-- Better Auth Schema Migration
-- This creates the required tables for Better Auth authentication

-- Ensure the update_updated_at_column function exists
-- (This should have been created in 001_create_update_function.sql)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;   
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER;
        
        GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
        GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;
    END IF;
END
$$;

-- Users table for Better Auth (using "users" instead of "user" to avoid reserved word issues)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    name TEXT,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS public.session (
    id TEXT PRIMARY KEY,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

-- Accounts table for external providers
CREATE TABLE IF NOT EXISTS public.account (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, account_id)
);

-- Verification table for magic links and email verification
CREATE TABLE IF NOT EXISTS public.verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_user_id ON public.session(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token ON public.session(token);
CREATE INDEX IF NOT EXISTS idx_session_expires_at ON public.session(expires_at);
CREATE INDEX IF NOT EXISTS idx_account_user_id ON public.account(user_id);
CREATE INDEX IF NOT EXISTS idx_account_provider ON public.account(provider_id, account_id);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON public.verification(identifier);
CREATE INDEX IF NOT EXISTS idx_verification_expires_at ON public.verification(expires_at);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Better Auth tables
-- Users can read their own user data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (id = auth.uid()::text);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (id = auth.uid()::text);

-- Sessions are managed by the auth system
CREATE POLICY "Auth system manages sessions" ON public.session
    FOR ALL USING (true);

-- Accounts are managed by the auth system
CREATE POLICY "Auth system manages accounts" ON public.account
    FOR ALL USING (true);

-- Verification tokens are managed by the auth system
CREATE POLICY "Auth system manages verification" ON public.verification
    FOR ALL USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_updated_at BEFORE UPDATE ON public.session
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_updated_at BEFORE UPDATE ON public.account
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_updated_at BEFORE UPDATE ON public.verification
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile when Better Auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_better_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile in existing profiles table
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (NEW.id::uuid, NEW.email, NEW.name, NEW.created_at, NEW.updated_at);
    
    -- Create user preferences
    INSERT INTO public.user_preferences (user_id, updated_at)
    VALUES (NEW.id::uuid, NEW.created_at);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new Better Auth user creation
DROP TRIGGER IF EXISTS on_better_auth_user_created ON public.users;
CREATE TRIGGER on_better_auth_user_created
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_better_auth_user();

-- Function to sync Better Auth user updates with profiles
CREATE OR REPLACE FUNCTION public.sync_better_auth_user_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- Update corresponding profile
    UPDATE public.profiles 
    SET 
        email = NEW.email,
        full_name = NEW.name,
        updated_at = NEW.updated_at
    WHERE id = NEW.id::uuid;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Better Auth user updates
CREATE TRIGGER sync_better_auth_user_updates
    AFTER UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_better_auth_user_updates();

-- Clean up expired verification tokens (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.verification 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;