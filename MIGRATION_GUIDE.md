# Better Auth Database Migration Guide

## Step 1: Create the Update Function

In your Supabase SQL Editor, run this first:

```sql
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
```

## Step 2: Apply Better Auth Schema

After Step 1 completes successfully, run the contents of:
`supabase/migrations/002_better_auth_schema.sql`

## Step 3: Update Environment Variable

Make sure your `.env.local` has the correct database URL:

```env
DATABASE_URL=postgresql://postgres.pyofapdoloqbyponvumi:[YOUR_SUPABASE_PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

Replace `[YOUR_SUPABASE_PASSWORD]` with your actual Supabase database password.

## Step 4: Test Authentication

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/auth/signin`
3. Try creating a new account

## Troubleshooting

- If you get "function does not exist" errors, make sure Step 1 was completed successfully
- If you get connection errors, verify your DATABASE_URL is correct
- Check the Supabase logs for any additional error details