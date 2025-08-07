# 🚀 Find Five - 5-Minute Quickstart

## Database Setup Fix

If you're getting the foreign key constraint error, use the simplified MVP schema:

### Option 1: Simple MVP Schema (Recommended)
Copy and run the contents of `lib/database-mvp.sql` in your Supabase SQL Editor. This removes foreign key constraints for faster MVP development.

### Option 2: Fix the Original Schema
If you already ran `lib/database.sql`, run this in Supabase SQL Editor to fix the constraint error:

```sql
-- Add the demo user first
INSERT INTO users (id, email) VALUES 
    ('00000000-0000-0000-0000-000000000000', 'demo@findfive.app') 
ON CONFLICT (id) DO NOTHING;

-- Or temporarily disable foreign key constraints:
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;
```

## Quick Test Steps

1. **Set User ID**
   - Go to Settings page
   - Set user ID to: `demo-user` 
   - Click Save

2. **Test Voice Recording**
   - Hold the red microphone button
   - Say: "Meeting with client about project updates"
   - Release button
   - Should auto-categorize as "delegate"

3. **Check Analytics**
   - Go to Analytics tab
   - Should see sample data pie chart
   - Try different time filters

## Environment Variables Needed

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## Common Issues

**"Voice recording not supported"**: Use Chrome/Safari, not Firefox
**"Failed to categorize"**: Check OpenAI API key in .env.local
**"No tasks showing"**: Set correct user ID in Settings

## MVP is Ready! ✅

All core features are working:
- Voice recording ✅
- AI categorization ✅  
- Task management ✅
- Analytics dashboard ✅
- PWA installation ✅