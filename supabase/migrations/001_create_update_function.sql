-- Create the update_updated_at_column function needed for Better Auth
-- This function is commonly used in Supabase for automatic timestamp updates

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;   
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- Also grant to the service role (used by Better Auth)
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;