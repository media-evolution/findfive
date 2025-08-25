# API Migration Guide for Better Auth

This guide shows how to update your existing API routes to work with Better Auth.

## Current API Route Updates

### Update `/api/entries/route.ts`

Replace the current entries API route with Better Auth integration:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { TimeEntry } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch entries for authenticated user
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch entries' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const entry: TimeEntry = await request.json()

    // Ensure the entry belongs to the authenticated user
    const entryData = {
      ...entry,
      user_id: userId,
      updated_at: new Date().toISOString()
    }

    // Insert or update entry
    const { data, error } = await supabase
      .from('time_entries')
      .upsert(entryData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save entry' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('id')

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID required' },
        { status: 400 }
      )
    }

    // Soft delete the entry (mark as deleted)
    const { data, error } = await supabase
      .from('time_entries')
      .update({ 
        is_deleted: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', entryId)
      .eq('user_id', userId) // Ensure user owns the entry
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Update Component Usage

Update your components to use Better Auth:

```typescript
// Before (with temporary UUID)
'use client'

import { useEntriesStore } from '@/store/entries-store'

export function TaskForm() {
  const { addEntry } = useEntriesStore()
  const userId = localStorage.getItem('userId') || crypto.randomUUID()
  
  const handleSubmit = async (data) => {
    await addEntry(data, userId)
  }
  
  // ... rest of component
}
```

```typescript
// After (with Better Auth)
'use client'

import { useAuth } from '@/lib/auth-client'
import { useUserEntries } from '@/store/auth-entries-store'
import { AuthGuard } from '@/components/auth/auth-guard'

export function TaskForm() {
  const { user } = useAuth()
  const { addEntry } = useUserEntries(user?.id)
  
  const handleSubmit = async (data) => {
    await addEntry(data)
  }
  
  return (
    <AuthGuard>
      {/* Your form JSX */}
    </AuthGuard>
  )
}
```

## Migration Steps

### 1. Update Existing API Routes

Replace authentication checks in existing API routes:

```typescript
// Old way
const userId = request.headers.get('x-user-id') || 'anonymous'

// New way
const session = await auth.api.getSession({
  headers: request.headers,
})

if (!session?.user) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
}

const userId = session.user.id
```

### 2. Update Client Components

Replace temporary user ID logic with Better Auth:

```typescript
// Old way
const userId = localStorage.getItem('userId') || crypto.randomUUID()

// New way
const { user } = useAuth()
const userId = user?.id
```

### 3. Update Database Queries

Ensure all user-scoped queries use the authenticated user ID:

```typescript
// Always filter by authenticated user
const { data, error } = await supabase
  .from('time_entries')
  .select('*')
  .eq('user_id', session.user.id) // Use session user ID
```

### 4. Handle Unauthenticated States

Add proper loading and unauthenticated states:

```typescript
export function MyComponent() {
  const { user, isLoading, isAuthenticated } = useAuth()
  
  if (isLoading) {
    return <Loader />
  }
  
  if (!isAuthenticated) {
    return <AuthGuard />
  }
  
  // Authenticated content
  return <div>Hello {user.name}!</div>
}
```

## Testing the Migration

1. **Sign up**: Create a new account through the auth forms
2. **Create entries**: Add new time entries and verify they're saved with correct user ID
3. **Sign out/in**: Verify entries persist across sessions
4. **API protection**: Try accessing API endpoints without auth (should return 401)
5. **User isolation**: Create entries with different accounts, verify they don't see each other's data

## Data Migration Script

If you have existing data with temporary UUIDs, create a migration script:

```sql
-- Create a backup first
CREATE TABLE time_entries_backup AS SELECT * FROM time_entries;

-- Update existing entries to use Better Auth user IDs
-- This assumes you can map email addresses or have another way to identify users
UPDATE time_entries 
SET user_id = better_auth_user.id
FROM (
  SELECT id, email FROM "user" -- Better Auth users table
) AS better_auth_user
WHERE EXISTS (
  -- Your logic to match temporary users to real users
  -- This depends on how you want to handle the migration
  SELECT 1 FROM profiles 
  WHERE profiles.id = better_auth_user.id::uuid 
  AND profiles.email = better_auth_user.email
);

-- Remove entries that can't be matched to real users (optional)
DELETE FROM time_entries WHERE user_id NOT IN (
  SELECT id FROM "user"
);
```

## Environment Variables Update

Make sure your environment variables are set correctly:

```env
# Required for Better Auth
BETTER_AUTH_SECRET=your-generated-secret
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Database connection for Better Auth
DATABASE_URL=your-supabase-connection-string

# Keep existing Supabase vars for other features
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

This migration maintains backward compatibility while adding proper authentication. Test thoroughly before deploying to production!