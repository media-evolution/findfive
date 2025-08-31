-- Simple rename from users to user for Better Auth
-- This is a minimal migration that just renames the table

-- Check if users table exists and user doesn't, then rename
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
    AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user')
    THEN
        -- Rename the table
        ALTER TABLE public.users RENAME TO "user";
        
        -- Update any foreign key constraints
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'session_user_id_fkey')
        THEN
            ALTER TABLE public.session DROP CONSTRAINT session_user_id_fkey;
            ALTER TABLE public.session 
                ADD CONSTRAINT session_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'account_user_id_fkey')
        THEN
            ALTER TABLE public.account DROP CONSTRAINT account_user_id_fkey;
            ALTER TABLE public.account 
                ADD CONSTRAINT account_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
        END IF;
        
        RAISE NOTICE 'Successfully renamed users table to user';
    ELSE
        RAISE NOTICE 'Table rename not needed - either user already exists or users does not exist';
    END IF;
END $$;