-- Rename users table to user for Better Auth compatibility
-- Better Auth expects the table to be named "user" not "users"

-- Drop existing foreign key constraints first
ALTER TABLE IF EXISTS public.session DROP CONSTRAINT IF EXISTS session_user_id_fkey;
ALTER TABLE IF EXISTS public.account DROP CONSTRAINT IF EXISTS account_user_id_fkey;

-- Drop triggers on users table
DROP TRIGGER IF EXISTS update_user_updated_at ON public.users;
DROP TRIGGER IF EXISTS on_better_auth_user_created ON public.users;
DROP TRIGGER IF EXISTS sync_better_auth_user_updates ON public.users;

-- Rename the table
ALTER TABLE IF EXISTS public.users RENAME TO "user";

-- Re-add foreign key constraints with new table name
ALTER TABLE public.session 
    ADD CONSTRAINT session_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE public.account 
    ADD CONSTRAINT account_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

-- Re-create triggers on the renamed table
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON public."user"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies to use the new table name
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

CREATE POLICY "Users can view own data" ON public."user"
    FOR SELECT USING (id = auth.uid()::text);

CREATE POLICY "Users can update own data" ON public."user"
    FOR UPDATE USING (id = auth.uid()::text);