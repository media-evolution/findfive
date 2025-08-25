# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Find Five** - A Progressive Web App (PWA) for time tracking with voice capture, designed to help business owners identify tasks to delegate, automate, or eliminate using AI-powered categorization.

## Commands

Development server with Turbopack:
```bash
npm run dev -- --turbo
```

Build production version:
```bash
npm run build
```

Production server:
```bash
npm start
```

Type checking:
```bash
npm run type-check
```
Architecture
Core Technologies

Framework: Next.js 15 with App Router and TypeScript
Styling: Tailwind CSS 4 with @tailwindcss/postcss
Database: Supabase (PostgreSQL with Row Level Security)
State Management: Zustand with persist middleware
Voice: Web Speech API with Whisper API fallback
AI: OpenAI API for task categorization
PWA: next-pwa with offline-first architecture
UI Components: shadcn/ui components when available
Animations: Framer Motion for smooth transitions
Charts: Recharts for analytics visualizations

## Project Structure

src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth group routes
│   ├── api/               # API routes
│   │   ├── entries/       # CRUD for time entries
│   │   ├── voice/         # Voice transcription
│   │   └── ai/            # AI categorization
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page with voice capture
├── components/            
│   ├── ui/                # Base UI components
│   ├── voice/             # Voice recording components
│   ├── entries/           # Time entry components
│   └── analytics/         # Analytics components
├── lib/                   
│   ├── supabase/          # Database client & types
│   ├── ai/                # AI service layer
│   ├── voice/             # Voice recording utilities
│   └── utils/             # Helper functions
├── hooks/                 # Custom React hooks
│   ├── use-voice.ts       # Voice recording hook
│   ├── use-entries.ts     # Time entries hook
│   └── use-offline.ts     # Offline sync hook
├── store/                 # Zustand stores
│   ├── entries.ts         # Time entries store
│   └── sync-queue.ts      # Offline sync queue
└── types/                 # TypeScript definitions
## Coding Standards
TypeScript Best Practices

Always use strict types - Avoid any, use unknown when type is truly unknown
Define interfaces for all data structures:

typescriptinterface TimeEntry {
  id: string;
  taskName: string;
  description?: string;
  category: 'delegate' | 'automate' | 'eliminate' | 'personal';
  confidenceScore: number;
  durationMinutes: number;
  createdAt: Date;
}

Use type guards for runtime safety:

typescriptfunction isTimeEntry(obj: unknown): obj is TimeEntry {
  return typeof obj === 'object' && obj !== null && 'taskName' in obj;
}
## Component Patterns

Server Components by default - Use 'use client' only when needed
Composition over props drilling - Use component composition
Error boundaries - Wrap features in error boundaries
Loading states - Always handle loading, error, and empty states

Example component structure:
typescript// components/voice/voice-button.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function VoiceButton({ onTranscript, className }: VoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  
  // Component logic here
  
  return (
    <button
      className={cn(
        "base-styles",
        isRecording && "recording-styles",
        className
      )}
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
    >
      {/* Content */}
    </button>
  );
}
## State Management
Use Zustand with TypeScript and persist:
typescript// store/entries.ts
interface EntriesStore {
  entries: TimeEntry[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addEntry: (entry: Omit<TimeEntry, 'id'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => void;
  syncEntries: () => Promise<void>;
}

export const useEntriesStore = create<EntriesStore>()(
  persist(
    (set, get) => ({
      // Implementation
    }),
    {
      name: 'entries-storage',
      partialize: (state) => ({ entries: state.entries }),
    }
  )
);
## API Routes Pattern
typescript// app/api/entries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}
## Database Queries
Always use Row Level Security and type-safe queries:
typescript// lib/supabase/queries.ts
export async function getTimeEntries(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      id,
      task_name,
      description,
      category,
      confidence_score,
      duration_minutes,
      created_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) throw new Error(`Failed to fetch entries: ${error.message}`);
  
  return data;
}
## Error Handling

Use try-catch with proper error types
Log errors to console in development, Sentry in production
Show user-friendly error messages
Implement retry logic for network requests

typescriptasync function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}
## Performance Optimizations

Use React.memo for expensive components
Implement virtual scrolling for long lists
Lazy load heavy components
Optimize images with next/image
Use Web Workers for heavy computations

## Accessibility (a11y)

Semantic HTML - Use proper HTML elements
ARIA labels - Add where needed
Keyboard navigation - Ensure all interactive elements are keyboard accessible
Focus management - Manage focus for modals and dynamic content
Color contrast - Maintain WCAG AA standards

## Testing Approach
While not implemented yet, structure code for testability:
typescript// Separate business logic from UI
export function categorizeTask(transcript: string): TaskCategory {
  // Pure function - easy to test
}

// Use dependency injection
export function createVoiceRecorder(mediaRecorder = MediaRecorder) {
  // Mockable dependencies
}
## Key Features Implementation
Voice Recording

Use Web Speech API for immediate feedback
Fall back to Whisper API for accuracy
Show visual feedback during recording
Auto-stop after 30 seconds

## PWA Requirements

Service worker for offline functionality
Cache API responses intelligently
Queue offline changes for sync
Show connection status to user

## AI Integration

Cache categorization results
Show confidence scores
Allow user corrections
Learn from corrections over time

## Environment Variables
env# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
WEB_PUSH_PUBLIC_KEY=your_vapid_public_key
WEB_PUSH_PRIVATE_KEY=your_vapid_private_key
Common Patterns
Optimistic Updates
typescript// Update UI immediately, sync in background
const addEntry = async (entry: TimeEntry) => {
  // Update local state immediately
  set(state => ({ entries: [...state.entries, entry] }));
  
  // Sync to database
  try {
    await syncToDatabase(entry);
  } catch (error) {
    // Revert on failure
    set(state => ({
      entries: state.entries.filter(e => e.id !== entry.id)
    }));
  }
};
## Offline Queue
typescript// Queue actions when offline
if (!navigator.onLine) {
  queueAction({ type: 'ADD_ENTRY', payload: entry });
  return;
}
Documentation Requirements

Component documentation - JSDoc for all exported components
Function documentation - Describe parameters and return values
Complex logic - Add inline comments for complex algorithms
Type definitions - Document non-obvious type choices

## Performance Targets

First Contentful Paint: < 1.5s
Time to Interactive: < 3.5s
Lighthouse Score: > 90
Bundle Size: < 200KB (initial)

## Security Considerations

Never expose sensitive keys in client code
Validate all user inputs
Use Row Level Security in Supabase
Sanitize voice transcripts before storage
Rate limit API endpoints

Git Commit Conventions
Use conventional commits:

feat: New feature
fix: Bug fix
perf: Performance improvement
refactor: Code refactoring
docs: Documentation changes
style: Code style changes
test: Test additions/changes
chore: Maintenance tasks

## When in Doubt

Prioritize user experience over code elegance
Ship working code over perfect code
Make it work, make it right, make it fast - in that order
Follow Next.js conventions when uncertain
Ask for clarification rather than assume

## Sprint Tracking

See `SPRINT.md` for current sprint objectives and task tracking.  
See `DEVLOG.md` for development history and decisions.

Sub-Agents

## 🔧 Development Support
- `documentation-specialist` - Technical documentation

## 🐛 Debugging & Troubleshooting
- `senior-debugger` - Multi-model complex issue resolution

## 🧪 Available Testing & Auth MCP Servers

  This project has access to specialized MCP servers for comprehensive testing and authentication consulting:

  ### Chrome DevTools MCP
  **Purpose**: Real-time browser debugging and performance analysis
  **Use for**: Network request debugging, JavaScript console errors, performance bottlenecks
  ```javascript
  start_chrome_and_connect("localhost:3000")
  get_network_requests(filter_status=500)
  get_console_error_summary()

  Authentication Expert Agent

  Purpose: Senior authentication consultant with research capabilities
  Use for: Auth system design, security audits, debugging login issues, provider comparisons
  debug_auth_issue({
    issueDescription: "Users getting logged out randomly",
    environment: { framework: "Next.js" }
  })
  research_auth_methods(["oauth2", "jwt", "passwordless"])

  Functional Testing Agent

  Purpose: Automated feature and workflow validationUse for: Testing user flows, forms, API endpoints, authentication workflows
  init_test_session({ baseUrl: "localhost:3000" })
  test_authentication({ authType: "login" })
  test_form_submission({ formName: "Contact Form" })

  UI/UX Testing Agent

  Purpose: Design consistency and accessibility analysis
  Use for: Visual regression testing, accessibility audits, responsive design validation
  start_testing_session({ url: "localhost:3000" })
  test_accessibility()
  test_responsive_design()

  Quick Testing Workflow

  1. Debug technical issues: Use Chrome DevTools MCP
  2. Test authentication: Use Authentication Expert + Functional Testing
  3. Validate user experience: Use UI/UX Testing Agent
  4. Generate reports: All agents export Markdown/JSON reports
Remember: We're building fast but maintaining quality. Code should be clean enough to iterate on tomorrow.