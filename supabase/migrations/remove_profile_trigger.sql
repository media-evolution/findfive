-- Remove the problematic trigger that references non-existent profiles table

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_better_auth_user_created ON public."user";
DROP TRIGGER IF EXISTS sync_better_auth_user_updates ON public."user";

-- Drop the functions that reference profiles table
DROP FUNCTION IF EXISTS public.handle_new_better_auth_user();
DROP FUNCTION IF EXISTS public.sync_better_auth_user_updates();

-- That's it! Better Auth will work without these profile integrations