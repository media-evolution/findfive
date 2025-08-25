# Better Auth Setup Guide

This guide walks you through setting up Better Auth for the Find Five application.

## Overview

Better Auth has been configured with:
- PostgreSQL adapter using Kysely for Supabase database
- Email/password authentication
- Magic link authentication  
- Full TypeScript support
- Mantine UI components for auth forms

## Files Created

### Core Auth Files
- `src/lib/auth.ts` - Better Auth server configuration
- `src/lib/auth-client.ts` - Client-side auth helpers and hooks
- `src/app/api/auth/[...all]/route.ts` - API route handler
- `src/middleware.ts` - Route protection middleware

### UI Components
- `src/components/auth/auth-forms.tsx` - Sign in/up forms with Mantine
- `src/components/auth/auth-guard.tsx` - Authentication guard component
- `src/components/auth/user-menu.tsx` - User menu with sign out
- `src/app/auth/signin/page.tsx` - Authentication page

### Database
- `supabase/migrations/002_better_auth_schema.sql` - Database schema migration

### Configuration
- `.env.example` - Environment variables example

## Setup Steps

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required variables:
```env
# Generate a secure secret (32+ characters)
BETTER_AUTH_SECRET=your-super-secret-key-here-at-least-32-characters-long

# Your app URL
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Your Supabase database connection string
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/[database]
```

### 2. Generate Secret Key

Generate a secure secret for production:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Run Database Migration

Apply the Better Auth schema migration:

```bash
# If using Supabase CLI
supabase db push

# Or run the SQL directly in your Supabase dashboard
```

The migration creates:
- `user` - Better Auth users table
- `session` - User sessions
- `account` - External provider accounts
- `verification` - Email verification and magic links

### 4. Install Missing Dependencies

Make sure you have all required packages:

```bash
npm install @tabler/icons-react
```

### 5. Update Your App Layout

Add the auth client to your providers:

```tsx
// src/app/providers.tsx
'use client'

import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider>
      <Notifications />
      {children}
    </MantineProvider>
  )
}
```

### 6. Protect Your Routes

Use the AuthGuard component to protect pages:

```tsx
// src/app/page.tsx
import { AuthGuard } from '@/components/auth/auth-guard'

export default function HomePage() {
  return (
    <AuthGuard>
      {/* Your protected content */}
    </AuthGuard>
  )
}
```

Or use the hook in client components:

```tsx
'use client'

import { useAuth } from '@/lib/auth-client'

export function ProtectedComponent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please sign in</div>
  
  return <div>Hello {user?.name}!</div>
}
```

### 7. Add User Menu to Navigation

Add the UserMenu component to your app navigation:

```tsx
import { UserMenu } from '@/components/auth/user-menu'

export function Navigation() {
  return (
    <nav>
      {/* Other nav items */}
      <UserMenu variant="compact" />
    </nav>
  )
}
```

## Usage Examples

### Sign In with Email/Password

```tsx
import { authActions } from '@/lib/auth-client'

const handleSignIn = async () => {
  try {
    await authActions.signInWithEmailPassword('user@example.com', 'password123')
    console.log('Signed in successfully!')
  } catch (error) {
    console.error('Sign in failed:', error.message)
  }
}
```

### Send Magic Link

```tsx
import { authActions } from '@/lib/auth-client'

const handleMagicLink = async () => {
  try {
    await authActions.sendMagicLinkEmail('user@example.com')
    console.log('Magic link sent!')
  } catch (error) {
    console.error('Failed to send magic link:', error.message)
  }
}
```

### Check Authentication Status

```tsx
import { useAuth } from '@/lib/auth-client'

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.name || user?.email}!</p>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  )
}
```

### Server-Side Authentication

```tsx
// In API routes or server components
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })
  
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Use session.user.id for database queries
  return Response.json({ userId: session.user.id })
}
```

## Migration from Temporary UUID System

To migrate from your current temporary UUID system:

1. **Update existing entries**: Run a migration script to associate existing time entries with authenticated users
2. **Remove temporary user logic**: Update your stores and components to use Better Auth user data
3. **Update database queries**: Use the Better Auth user ID instead of temporary UUIDs

Example migration script:
```sql
-- Create a mapping table for migration (optional)
CREATE TEMP TABLE user_migration AS
SELECT DISTINCT user_id as temp_id, email 
FROM time_entries 
WHERE user_id IS NOT NULL;

-- Update existing entries to use Better Auth user IDs
UPDATE time_entries 
SET user_id = ba_user.id::text
FROM user ba_user, user_migration um
WHERE ba_user.email = um.email 
AND time_entries.user_id = um.temp_id;
```

## Security Considerations

1. **Row Level Security**: The migration includes RLS policies for Better Auth tables
2. **CORS**: Better Auth handles CORS automatically for auth endpoints
3. **Session Security**: Sessions are HTTP-only cookies by default
4. **Password Security**: Better Auth uses secure password hashing
5. **CSRF Protection**: Built-in CSRF protection for state-changing operations

## Email Configuration (Optional)

To enable magic links and email verification, configure an email provider:

```env
EMAIL_FROM=noreply@yourapp.com
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=your-api-key
```

Supported providers:
- Resend (recommended)
- SendGrid
- AWS SES
- Custom SMTP

## Testing

Test the auth flow:

1. **Sign Up**: Visit `/auth/signin`, create a new account
2. **Email Verification**: Check your email for verification link
3. **Sign In**: Sign in with email/password
4. **Magic Link**: Try the magic link authentication
5. **Protected Routes**: Verify middleware redirects work
6. **Sign Out**: Test the sign out functionality

## Troubleshooting

### Common Issues

1. **"Database connection failed"**
   - Verify `DATABASE_URL` is correct
   - Check Supabase connection string format
   - Ensure database is accessible

2. **"Invalid secret"**
   - Generate a proper `BETTER_AUTH_SECRET` (32+ characters)
   - Don't use the example secret in production

3. **"Session not found"**
   - Clear browser cookies and try again
   - Check middleware configuration
   - Verify API routes are working

4. **Email not sending**
   - Configure email provider settings
   - Check email provider quotas/limits
   - Verify `EMAIL_FROM` domain is verified

### Debugging

Enable debug logging in development:
```env
NODE_ENV=development
```

Check the browser developer tools Network tab for API calls to `/api/auth/`.

## Next Steps

1. **Social Providers**: Add Google/GitHub OAuth if needed
2. **Email Templates**: Customize verification and magic link emails  
3. **User Profiles**: Extend user profile functionality
4. **Two-Factor Auth**: Add 2FA support using Better Auth plugins
5. **Analytics**: Track auth events for insights

For more information, see the [Better Auth documentation](https://www.better-auth.com/docs).