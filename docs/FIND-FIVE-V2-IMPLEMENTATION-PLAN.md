# Find Five V2 - Claude Code Implementation Plan

## Overview

Systematic upgrade from MVP to V2 using evolutionary approach. Each prompt is designed for Claude Code to execute independently with clear success criteria.

---

## 🔐 SECTION 1: Authentication Migration (Better Auth)

### Prompt 1.1: Remove Supabase Auth Dependencies
```
Remove all Supabase authentication code from the Find Five app and replace localStorage user management with a temporary UUID system. 

Current location: `/Users/spencertoogood/Sites/find-five`

Tasks:
1. Remove any Supabase auth imports and calls
2. Update user ID generation to use crypto.randomUUID() 
3. Store user_id in localStorage as 'find-five-user-id'
4. Update all API calls to use this temporary user_id
5. Create a simple user context that provides the user_id

Files likely affected:
- src/store/entries-store.ts
- Any auth-related components
- API routes that reference user authentication

Success criteria: App works without any Supabase auth dependencies, using temporary UUID for user identification.
```

### Prompt 1.2: Install and Configure Better Auth
```
Install and configure Better Auth for the Find Five Next.js app with email/password and magic link authentication.

Current location: `/Users/spencertoogood/Sites/find-five`

Tasks:
1. Install better-auth and required dependencies
2. Create auth configuration file with:
   - Email/password provider
   - Magic link provider  
   - Database adapter for existing Supabase database
3. Create auth API routes
4. Set up auth middleware for protected routes
5. Create basic login/register forms using Mantine components
6. Update environment variables for auth secrets

Success criteria: Users can register, login, and logout. Auth state is properly managed. Existing app functionality works for authenticated users.
```

---

## 🗃️ SECTION 2: Database Schema Evolution

### Prompt 2.1: Add V2 Database Tables
```
Add the new database tables required for Find Five V2 session-based tracking.

Current location: `/Users/spencertoogood/Sites/find-five`
Database: Supabase PostgreSQL

Create migration script and execute:

NEW TABLES:
1. sessions - Track 5/7/14/30 day tracking periods
2. leave_records - Days users take off during sessions
3. interruptions - Track interruptions with source and impact
4. user_preferences - Move from localStorage to database

SQL Schema:
```sql
-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    type VARCHAR(10) CHECK (type IN ('5_days', '7_days', '14_days', '30_days')),
    start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    actual_end_date DATE,
    status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave records table  
CREATE TABLE leave_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    leave_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interruptions table
CREATE TABLE interruptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    source VARCHAR(20) CHECK (source IN ('self', 'email', 'phone', 'team', 'client', 'other')),
    impact VARCHAR(10) CHECK (impact IN ('low', 'medium', 'high')),
    duration_minutes INTEGER NOT NULL,
    description TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    notification_interval INTEGER DEFAULT 60,
    work_start_time TIME DEFAULT '09:00:00',
    work_end_time TIME DEFAULT '17:00:00', 
    work_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Success criteria: New tables created successfully. RLS policies enabled. TypeScript types generated.
```

### Prompt 2.2: Extend TimeEntry Schema
```
Extend the existing time_entries table with the 9 new V2 fields for enhanced task tracking.

Current location: `/Users/spencertoogood/Sites/find-five`

Add columns to time_entries table:
```sql
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id);
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5);
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS task_mode VARCHAR(10) CHECK (task_mode IN ('proactive', 'reactive'));
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS enjoyment VARCHAR(10) CHECK (enjoyment IN ('like', 'neutral', 'dislike'));
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS task_type VARCHAR(10) CHECK (task_type IN ('personal', 'work', 'both'));
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS frequency VARCHAR(15) CHECK (frequency IN ('daily', 'regular', 'infrequent'));
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS recording_delay_minutes INTEGER;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS urgency VARCHAR(15) CHECK (urgency IN ('urgent', 'not_urgent'));
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS importance VARCHAR(15) CHECK (importance IN ('important', 'not_important'));
```

Also update:
1. TypeScript interfaces in the codebase
2. Zustand store to handle new fields
3. Any existing API endpoints to accept new fields

Success criteria: Database updated, TypeScript types reflect new fields, existing functionality unbroken.
```

---

## 🎯 SECTION 3: Session Management System

### Prompt 3.1: Create Session Management Core
```
Build the core session management system for Find Five V2.

Current location: `/Users/spencertoogood/Sites/find-five`

Create:
1. **Session service**: `src/lib/session-service.ts`
   - createSession(userId, type)
   - getCurrentSession(userId) 
   - extendSession(sessionId, additionalDays)
   - completeSession(sessionId)
   - addLeaveDay(sessionId, date, reason)

2. **Session store**: `src/store/session-store.ts` (Zustand)
   - currentSession state
   - session actions
   - persist integration

3. **Session context**: `src/contexts/session-context.tsx`
   - Provide session state to components
   - Handle session initialization

4. **Session types**: `src/types/session.ts`
   - Session, LeaveRecord interfaces
   - Session status enums

Key logic:
- Auto-extend sessions when user misses days (configurable)
- Track actual vs planned end dates
- Handle leave days that don't count against session
- Integration with existing offline sync

Success criteria: Session CRUD operations work. Sessions persist across app restarts. Leave days tracked correctly.
```

### Prompt 3.2: Build Session UI Components  
```
Create the user interface components for session management in Find Five.

Current location: `/Users/spencertoogood/Sites/find-five`

Build Mantine components:
1. **SessionPicker** - Modal to start new session (5/7/14/30 days)
2. **SessionProgress** - Progress bar showing current session status  
3. **SessionCard** - Summary display for home screen
4. **LeaveDayManager** - Add/remove leave days
5. **SessionHistory** - Past sessions list

Components should:
- Use existing Mantine theme/styling
- Handle loading and error states
- Work with session store
- Be responsive for mobile PWA

Placement:
- Add SessionCard to home page
- SessionPicker accessible from settings
- Integrate SessionProgress into header
- LeaveDayManager in settings page

Success criteria: Users can start sessions, see progress, manage leave days. Components match existing app design.
```

---

## 📝 SECTION 4: Enhanced Task Entry

### Prompt 4.1: Upgrade Task Modal with V2 Fields
```
Enhance the existing task entry modal to capture the 9 new V2 task attributes.

Current location: `/Users/spencertoogood/Sites/find-five`
File to modify: `src/components/task-modal.tsx`

Add form fields for:
1. **Energy Level** - 1-5 slider with labels (Drained → Energized)
2. **Task Mode** - Toggle button (Proactive/Reactive) 
3. **Enjoyment** - 3-button group (👍 Like / 😐 Neutral / 👎 Dislike)
4. **Task Type** - Select dropdown (Personal/Work/Both)
5. **Frequency** - Button group (Daily/Regular/Infrequent)

Design requirements:
- Use Mantine components for consistency
- Compact layout for mobile use
- Smart defaults based on time of day
- Preserve existing voice-to-text functionality
- Add recording timestamp and delay calculation

Form validation:
- Energy level required
- Task mode defaults to 'reactive'
- Other fields optional but encouraged

Success criteria: Task modal captures all V2 fields. Form is intuitive and fast to complete. Data saves correctly.
```

### Prompt 4.2: Build Interruption Tracker
```
Create a quick interruption tracking system as a floating action button.

Current location: `/Users/spencertoogood/Sites/find-five`

Build:
1. **InterruptionFAB** - Floating action button (red, always visible)
2. **InterruptionModal** - Quick capture form
3. **InterruptionService** - API integration
4. **InterruptionStore** - Zustand state management

InterruptionModal fields:
- Source: Self/Email/Phone/Team/Client/Other (icon buttons)
- Impact: Low/Medium/High (color-coded buttons)  
- Duration: Quick time picker (5min, 15min, 30min, 1hr, custom)
- Description: Optional text field

UX:
- One-tap to open modal
- Pre-filled with current timestamp
- Auto-saves and closes
- Shows brief confirmation
- Syncs with offline queue

Success criteria: Users can log interruptions in <10 seconds. Data syncs properly. FAB doesn't interfere with existing UI.
```

---

## 📊 SECTION 5: Analytics & Web Dashboard

### Prompt 5.1: Create Web Dashboard Structure
```
Build the web dashboard structure for Find Five analytics and review.

Current location: `/Users/spencertoogood/Sites/find-five`

Create new routes:
- `/dashboard` - Session overview and key metrics
- `/review` - End-of-day task review interface  
- `/eisenhower` - Eisenhower matrix for task categorization
- `/reports` - Detailed analytics and exports

Dashboard features:
1. **Session Overview**: Progress, days remaining, completion rate
2. **Today's Summary**: Tasks logged, energy trends, interruptions
3. **Quick Stats**: Proactive vs reactive breakdown
4. **Recent Activity**: Last 10 tasks with quick edit

Use:
- Mantine components for consistency
- Responsive grid layout
- Charts with Recharts library
- Export buttons (CSV/PDF)

Success criteria: Web dashboard loads properly. Responsive design works on desktop/tablet. Navigation between sections smooth.
```

### Prompt 5.2: Build Eisenhower Matrix Interface
```
Create the Eisenhower Matrix interface for post-session task categorization.

Current location: `/Users/spencertoogood/Sites/find-five`
Route: `/eisenhower`

Build:
1. **Matrix Grid** - 2x2 visual grid (Urgent/Not Urgent × Important/Not Important)
2. **TaskCard** - Draggable task cards with key info
3. **BulkActions** - Select multiple tasks for batch categorization
4. **FilterControls** - Filter by date range, session, category

Features:
- Drag and drop tasks between quadrants
- Bulk select and move tasks
- Auto-save categorization changes
- Show task details on hover/click
- Progress indicator for uncategorized tasks

Integration:
- Pull tasks from completed sessions
- Update urgency/importance fields in database
- Sync changes across devices
- Export categorized data

Success criteria: Users can easily categorize tasks using drag-drop. Bulk operations work smoothly. Data updates persist correctly.
```

---

## 🔔 SECTION 6: Notification System

### Prompt 6.1: Build Smart Notification Scheduler
```
Implement the intelligent notification system for Find Five V2.

Current location: `/Users/spencertoogood/Sites/find-five`

Build:
1. **NotificationService** - Core scheduling logic
2. **NotificationWorker** - Background service worker
3. **NotificationSettings** - User preference controls

Key features:
- Respect work hours and days
- Skip notifications during leave days
- Progressive intervals (start gentle, increase frequency)
- Smart muting (detect user activity)
- Session-aware scheduling

Technical implementation:
- Use Web Push API and service worker
- Browser notification permissions
- Background sync for offline scenarios
- Integration with user preferences

Settings UI:
- Interval selection (15/30/60 minutes)
- Work hours configuration  
- Notification sounds toggle
- Temporary mute options

Success criteria: Notifications fire at correct intervals. Respect user preferences and work schedules. Work offline/background.
```

---

## 🔧 SECTION 7: Testing & Polish

### Prompt 7.1: Add Comprehensive Error Handling
```
Add proper error handling, loading states, and empty states throughout Find Five V2.

Current location: `/Users/spencertoogood/Sites/find-five`

Implement:
1. **Error Boundaries** - Catch and display React errors gracefully
2. **Loading Skeletons** - Mantine skeleton components for all async operations
3. **Empty States** - Friendly messages when no data exists
4. **Retry Logic** - Automatic retries for failed API calls
5. **Offline Indicators** - Clear status when app is offline

Areas to cover:
- Session loading and errors
- Task submission failures  
- Voice recording issues
- Network connectivity problems
- Database sync failures

Use consistent error messaging and recovery options throughout the app.

Success criteria: App handles all common error scenarios gracefully. Users always know what's happening and how to recover.
```

### Prompt 7.2: Performance Optimization and PWA Enhancement  
```
Optimize Find Five V2 performance and enhance PWA capabilities.

Current location: `/Users/spencertoogood/Sites/find-five`

Optimize:
1. **Bundle size** - Code splitting for dashboard routes
2. **Database queries** - Add indexes and optimize queries
3. **Caching** - Service worker caching for faster loads
4. **Images** - Optimize any icons/images
5. **Memory usage** - Profile and fix memory leaks

PWA enhancements:
- Update manifest.json for V2 features
- Enhanced offline functionality
- App shortcuts for quick task entry
- Share target API for external integrations

Performance targets:
- Lighthouse score >90
- First load <3 seconds
- Task entry <10 seconds
- Voice recognition <5 seconds

Success criteria: App feels fast and responsive. Works reliably offline. PWA features enhance user experience.
```

---

## 🚀 Implementation Timeline

### Week 1: Foundation
- **Day 1**: Section 1 (Better Auth migration)
- **Day 2**: Section 2 (Database schema) 
- **Day 3**: Section 3.1 (Session core)

### Week 2: Features
- **Day 1**: Section 3.2 (Session UI)
- **Day 2**: Section 4 (Enhanced task entry)
- **Day 3**: Section 5.1 (Dashboard structure)

### Week 3: Analytics & Polish  
- **Day 1**: Section 5.2 (Eisenhower matrix)
- **Day 2**: Section 6 (Notifications)
- **Day 3**: Section 7 (Testing & polish)

## 📋 Success Criteria Summary

Each section has specific success criteria, but overall V2 success means:
- ✅ Users can create and manage sessions  
- ✅ Enhanced task tracking with 9 new fields
- ✅ Interruption logging works smoothly
- ✅ Web dashboard provides valuable insights
- ✅ Eisenhower matrix enables post-session analysis
- ✅ Smart notifications respect user preferences
- ✅ App works reliably offline
- ✅ Performance meets PWA standards

## 🔄 Rollback Strategy

Each section is designed to be independent. If any section fails:
1. Previous sections remain functional
2. Can rollback specific database migrations
3. Feature flags can disable problematic features
4. MVP functionality always preserved