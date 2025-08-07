# Find Five API Structure & Documentation

## API Overview

Base URL: `https://api.findfive.app/v1`
Authentication: Bearer Token (JWT)
Content-Type: `application/json`

## Authentication Endpoints

### POST `/auth/register`
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe",
  "company": "Acme Corp",
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### POST `/auth/login`
Authenticate existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "preferences": {
      "notificationInterval": 30,
      "workStartTime": "09:00",
      "workEndTime": "17:00",
      "workDays": [1, 2, 3, 4, 5],
      "voiceEnabled": true,
      "autoCategories": true
    }
  },
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### POST `/auth/refresh`
Refresh access token.

**Request:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:**
```json
{
  "token": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

### POST `/auth/magic-link`
Send magic link for passwordless login.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Magic link sent to email",
  "expiresIn": 900
}
```

## Time Entry Endpoints

### POST `/entries`
Create a new time entry.

**Request:**
```json
{
  "taskName": "Email Campaign Review",
  "description": "Reviewing Q2 email marketing campaigns",
  "category": "delegate",
  "duration": 30,
  "inputMethod": "voice",
  "voiceTranscript": "I'm reviewing the email campaigns for next quarter",
  "confidenceScore": 0.85,
  "recordedAt": "2024-03-12T09:30:00Z"
}
```

**Response:**
```json
{
  "id": "entry_uuid",
  "taskName": "Email Campaign Review",
  "description": "Reviewing Q2 email marketing campaigns",
  "category": "delegate",
  "duration": 30,
  "inputMethod": "voice",
  "confidenceScore": 0.85,
  "recordedAt": "2024-03-12T09:30:00Z",
  "createdAt": "2024-03-12T09:30:15Z"
}
```

### GET `/entries`
Get user's time entries with filtering.

**Query Parameters:**
- `date`: Filter by specific date (YYYY-MM-DD)
- `startDate`: Start date for range
- `endDate`: End date for range
- `category`: Filter by category (delegate|automate|eliminate|personal)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset

**Response:**
```json
{
  "entries": [
    {
      "id": "entry_uuid",
      "taskName": "Email Campaign Review",
      "description": "Reviewing Q2 email marketing campaigns",
      "category": "delegate",
      "duration": 30,
      "inputMethod": "voice",
      "recordedAt": "2024-03-12T09:30:00Z"
    }
  ],
  "total": 145,
  "hasMore": true
}
```

### GET `/entries/:id`
Get specific time entry.

**Response:**
```json
{
  "id": "entry_uuid",
  "taskName": "Email Campaign Review",
  "description": "Reviewing Q2 email marketing campaigns",
  "category": "delegate",
  "duration": 30,
  "inputMethod": "voice",
  "voiceTranscript": "I'm reviewing the email campaigns for next quarter",
  "confidenceScore": 0.85,
  "aiReasoning": "This task involves routine analysis that could be handled by a marketing team member",
  "recordedAt": "2024-03-12T09:30:00Z",
  "createdAt": "2024-03-12T09:30:15Z",
  "updatedAt": "2024-03-12T09:30:15Z"
}
```

### PUT `/entries/:id`
Update time entry (for corrections).

**Request:**
```json
{
  "category": "personal",
  "description": "Actually requires strategic decision making"
}
```

**Response:**
```json
{
  "id": "entry_uuid",
  "taskName": "Email Campaign Review",
  "description": "Actually requires strategic decision making",
  "category": "personal",
  "duration": 30,
  "updatedAt": "2024-03-12T10:00:00Z"
}
```

### DELETE `/entries/:id`
Delete time entry.

**Response:**
```json
{
  "message": "Entry deleted successfully"
}
```

### POST `/entries/batch`
Create multiple entries at once (for offline sync).

**Request:**
```json
{
  "entries": [
    {
      "taskName": "Task 1",
      "category": "delegate",
      "duration": 15,
      "recordedAt": "2024-03-12T09:00:00Z"
    },
    {
      "taskName": "Task 2",
      "category": "automate",
      "duration": 30,
      "recordedAt": "2024-03-12T09:30:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "created": 2,
  "entries": [
    { "id": "uuid1", "taskName": "Task 1" },
    { "id": "uuid2", "taskName": "Task 2" }
  ]
}
```

## Voice & AI Endpoints

### POST `/voice/transcribe`
Transcribe audio to text.

**Request:**
```json
{
  "audio": "base64_encoded_audio",
  "format": "webm",
  "duration": 15
}
```

**Response:**
```json
{
  "transcript": "I'm reviewing the email campaigns for next quarter",
  "confidence": 0.92,
  "language": "en",
  "processingTime": 1.2
}
```

### POST `/ai/categorize`
Categorize task using AI.

**Request:**
```json
{
  "text": "Reviewing email campaigns for optimization opportunities",
  "userContext": {
    "recentTasks": ["Email drafting", "Campaign analytics"],
    "role": "Marketing Director"
  }
}
```

**Response:**
```json
{
  "taskName": "Email Campaign Review",
  "description": "Reviewing campaigns for optimization opportunities",
  "category": "delegate",
  "confidence": 0.85,
  "reasoning": "This task involves routine analysis that could be handled by a marketing team member",
  "alternativeCategories": [
    {
      "category": "personal",
      "confidence": 0.15,
      "reasoning": "May require strategic decisions"
    }
  ]
}
```

### POST `/ai/analyze-patterns`
Analyze user's task patterns.

**Request:**
```json
{
  "userId": "user_uuid",
  "period": "week",
  "startDate": "2024-03-05",
  "endDate": "2024-03-12"
}
```

**Response:**
```json
{
  "patterns": [
    {
      "id": "pattern_uuid",
      "name": "Email Management",
      "frequency": 14,
      "totalMinutes": 420,
      "averageDaily": 60,
      "category": "delegate",
      "confidence": 0.78,
      "suggestion": "Consider delegating routine email responses to an assistant"
    },
    {
      "name": "Data Entry",
      "frequency": 8,
      "totalMinutes": 240,
      "category": "automate",
      "suggestion": "Use Zapier or similar tools to automate data transfer"
    }
  ],
  "insights": {
    "totalTrackedMinutes": 2400,
    "delegatableMinutes": 720,
    "automatableMinutes": 480,
    "eliminableMinutes": 180,
    "potentialTimeSaved": "23 hours/week"
  }
}
```

## Analytics Endpoints

### GET `/analytics/summary`
Get user's analytics summary.

**Query Parameters:**
- `period`: day|week|month|quarter
- `date`: Reference date (defaults to today)

**Response:**
```json
{
  "period": "week",
  "startDate": "2024-03-05",
  "endDate": "2024-03-12",
  "stats": {
    "totalEntries": 145,
    "totalMinutes": 2400,
    "averageDaily": 480,
    "completionRate": 0.82
  },
  "breakdown": {
    "delegate": {
      "count": 45,
      "minutes": 720,
      "percentage": 30
    },
    "automate": {
      "count": 32,
      "minutes": 480,
      "percentage": 20
    },
    "eliminate": {
      "count": 18,
      "minutes": 180,
      "percentage": 7.5
    },
    "personal": {
      "count": 50,
      "minutes": 1020,
      "percentage": 42.5
    }
  },
  "topTasks": [
    {
      "name": "Email Management",
      "totalMinutes": 420,
      "occurrences": 14,
      "category": "delegate"
    }
  ]
}
```

### GET `/analytics/trends`
Get trend data for charts.

**Query Parameters:**
- `metric`: time|tasks|categories
- `period`: week|month|quarter
- `groupBy`: day|week|month

**Response:**
```json
{
  "metric": "categories",
  "period": "month",
  "data": [
    {
      "date": "2024-03-01",
      "delegate": 120,
      "automate": 80,
      "eliminate": 30,
      "personal": 180
    },
    {
      "date": "2024-03-02",
      "delegate": 100,
      "automate": 90,
      "eliminate": 20,
      "personal": 200
    }
  ]
}
```

### GET `/analytics/recommendations`
Get AI-powered recommendations.

**Response:**
```json
{
  "recommendations": [
    {
      "id": "rec_uuid",
      "priority": "high",
      "type": "delegate",
      "title": "Delegate Email Reviews",
      "description": "You spend 2 hours daily on email. Consider delegating routine responses.",
      "estimatedTimeSaved": 600,
      "implementation": [
        "Create email templates for common responses",
        "Train assistant on response criteria",
        "Set up daily review process"
      ],
      "relatedTasks": ["Email Campaign Review", "Customer Email Responses"]
    },
    {
      "priority": "medium",
      "type": "automate",
      "title": "Automate Data Entry",
      "description": "3 hours weekly on data entry could be automated",
      "estimatedTimeSaved": 180,
      "suggestedTools": ["Zapier", "Make", "Google Apps Script"]
    }
  ],
  "totalPotentialSaved": 1380
}
```

## User Preferences Endpoints

### GET `/user/preferences`
Get user preferences.

**Response:**
```json
{
  "notificationInterval": 30,
  "workStartTime": "09:00",
  "workEndTime": "17:00",
  "workDays": [1, 2, 3, 4, 5],
  "timezone": "America/New_York",
  "voiceEnabled": true,
  "autoCategories": true,
  "notificationSound": true,
  "dailySummary": true,
  "weeklyReport": true
}
```

### PUT `/user/preferences`
Update user preferences.

**Request:**
```json
{
  "notificationInterval": 60,
  "workEndTime": "18:00",
  "voiceEnabled": false
}
```

**Response:**
```json
{
  "message": "Preferences updated",
  "preferences": {
    "notificationInterval": 60,
    "workStartTime": "09:00",
    "workEndTime": "18:00",
    "workDays": [1, 2, 3, 4, 5],
    "voiceEnabled": false,
    "autoCategories": true
  }
}
```

## Notification Endpoints

### POST `/notifications/subscribe`
Subscribe to push notifications.

**Request:**
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "public_key",
    "auth": "auth_secret"
  },
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "id": "subscription_uuid",
  "active": true
}
```

### DELETE `/notifications/subscribe/:id`
Unsubscribe from push notifications.

**Response:**
```json
{
  "message": "Unsubscribed successfully"
}
```

### GET `/notifications/schedule`
Get upcoming notification schedule.

**Response:**
```json
{
  "schedule": [
    {
      "scheduledFor": "2024-03-12T10:00:00Z",
      "type": "time_entry"
    },
    {
      "scheduledFor": "2024-03-12T10:30:00Z",
      "type": "time_entry"
    },
    {
      "scheduledFor": "2024-03-12T17:00:00Z",
      "type": "daily_summary"
    }
  ],
  "nextNotification": "2024-03-12T10:00:00Z"
}
```

### POST `/notifications/pause`
Pause notifications temporarily.

**Request:**
```json
{
  "duration": 120,
  "reason": "meeting"
}
```

**Response:**
```json
{
  "pausedUntil": "2024-03-12T12:00:00Z",
  "message": "Notifications paused for 2 hours"
}
```

## Export Endpoints

### GET `/export/csv`
Export time entries as CSV.

**Query Parameters:**
- `startDate`: Start date
- `endDate`: End date
- `includeTranscripts`: Include voice transcripts (true|false)

**Response:**
```csv
Date,Task Name,Description,Category,Duration,Input Method
2024-03-12,Email Campaign Review,Reviewing Q2 campaigns,delegate,30,voice
2024-03-12,Financial Report,Monthly analysis,personal,60,text
```

### GET `/export/pdf`
Generate PDF report.

**Query Parameters:**
- `type`: summary|detailed|insights
- `period`: week|month|quarter

**Response:**
```json
{
  "url": "https://exports.findfive.app/reports/uuid.pdf",
  "expiresAt": "2024-03-13T12:00:00Z"
}
```

## Webhook Endpoints

### POST `/webhooks`
Register a webhook for events.

**Request:**
```json
{
  "url": "https://yourapp.com/webhook",
  "events": ["entry.created", "pattern.detected"],
  "secret": "webhook_secret"
}
```

**Response:**
```json
{
  "id": "webhook_uuid",
  "url": "https://yourapp.com/webhook",
  "events": ["entry.created", "pattern.detected"],
  "active": true
}
```

## Error Responses

All endpoints follow consistent error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid category value",
    "field": "category",
    "timestamp": "2024-03-12T10:00:00Z"
  }
}
```

### Error Codes
- `AUTHENTICATION_REQUIRED` - 401
- `INVALID_TOKEN` - 401
- `FORBIDDEN` - 403
- `NOT_FOUND` - 404
- `VALIDATION_ERROR` - 400
- `RATE_LIMIT_EXCEEDED` - 429
- `SERVER_ERROR` - 500

## Rate Limiting

- **Authentication**: 5 requests per minute
- **Voice transcription**: 60 requests per hour
- **AI categorization**: 300 requests per hour
- **General API**: 1000 requests per hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1678637600
```

## WebSocket Events

Connect to: `wss://api.findfive.app/v1/ws`

### Events from Server

**notification.scheduled**
```json
{
  "type": "notification.scheduled",
  "data": {
    "scheduledFor": "2024-03-12T10:30:00Z",
    "notificationType": "time_entry"
  }
}
```

**entry.analyzed**
```json
{
  "type": "entry.analyzed",
  "data": {
    "entryId": "uuid",
    "patterns": ["Recurring task", "Prime delegation candidate"],
    "insights": "This task appears 3x weekly"
  }
}
```

**sync.required**
```json
{
  "type": "sync.required",
  "data": {
    "reason": "offline_entries",
    "count": 5
  }
}
```

### Events from Client

**presence.update**
```json
{
  "type": "presence.update",
  "data": {
    "status": "active",
    "lastActivity": "2024-03-12T10:25:00Z"
  }
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { FindFiveClient } from '@findfive/sdk';

const client = new FindFiveClient({
  apiKey: 'your_api_key',
  environment: 'production'
});

// Quick capture
const entry = await client.entries.create({
  taskName: 'Email Review',
  category: 'delegate',
  duration: 30
});

// Voice capture
const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
const transcript = await client.voice.transcribe(audio);
const categorized = await client.ai.categorize(transcript);
const saved = await client.entries.create(categorized);

// Get analytics
const insights = await client.analytics.getInsights('week');
console.log(`You can save ${insights.potentialTimeSaved} hours/week`);
```

### REST Example
```bash
# Create entry
curl -X POST https://api.findfive.app/v1/entries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskName": "Email Campaign Review",
    "category": "delegate",
    "duration": 30
  }'

# Get weekly analytics
curl https://api.findfive.app/v1/analytics/summary?period=week \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Versioning

The API uses URL versioning. Current version: `v1`

Breaking changes will result in a new version. Non-breaking changes:
- Adding new endpoints
- Adding optional parameters
- Adding new response fields
- Adding new event types

## Status Page

Monitor API status at: https://status.findfive.app

## Support

- Documentation: https://docs.findfive.app
- Email: api@findfive.app
- Discord: https://discord.gg/findfive