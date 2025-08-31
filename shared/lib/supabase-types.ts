export interface Profile {
  id: string
  email: string
  full_name?: string
  company?: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  user_id: string
  notification_interval: number
  work_start_time: string
  work_end_time: string
  work_days: number[]
  voice_enabled: boolean
  auto_categorize: boolean
  theme: 'light' | 'dark' | 'system'
  updated_at: string
}

export interface TimeEntry {
  id: string
  user_id: string
  task_name: string
  description?: string
  category: 'delegate' | 'automate' | 'eliminate' | 'personal'
  confidence_score: number
  duration_minutes: number
  input_method: 'voice' | 'text' | 'quick_select'
  voice_transcript?: string
  created_at: string
  updated_at: string
  completed_at?: string
  is_deleted: boolean
}

export interface TaskTemplate {
  id: string
  user_id: string
  task_name: string
  category?: 'delegate' | 'automate' | 'eliminate' | 'personal'
  use_count: number
  last_used?: string
  created_at: string
}

export interface Insight {
  id: string
  user_id: string
  insight_type: 'pattern' | 'recommendation' | 'achievement'
  title: string
  description: string
  data?: any
  is_read: boolean
  created_at: string
}

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export interface SyncQueueItem {
  id: string
  user_id: string
  action: 'create' | 'update' | 'delete'
  entity_type: 'time_entry' | 'task_template'
  entity_id?: string
  payload: any
  synced: boolean
  created_at: string
  synced_at?: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      user_preferences: {
        Row: UserPreferences
        Insert: Partial<UserPreferences>
        Update: Partial<UserPreferences>
      }
      time_entries: {
        Row: TimeEntry
        Insert: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TimeEntry, 'id'>>
      }
      task_templates: {
        Row: TaskTemplate
        Insert: Omit<TaskTemplate, 'id' | 'created_at'>
        Update: Partial<Omit<TaskTemplate, 'id'>>
      }
      insights: {
        Row: Insight
        Insert: Omit<Insight, 'id' | 'created_at'>
        Update: Partial<Omit<Insight, 'id'>>
      }
      push_subscriptions: {
        Row: PushSubscription
        Insert: Omit<PushSubscription, 'id' | 'created_at'>
        Update: Partial<Omit<PushSubscription, 'id'>>
      }
      sync_queue: {
        Row: SyncQueueItem
        Insert: Omit<SyncQueueItem, 'id' | 'created_at'>
        Update: Partial<Omit<SyncQueueItem, 'id'>>
      }
    }
  }
}