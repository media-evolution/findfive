import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface TimeEntry {
  id: string
  user_id: string  // TEXT field for MVP simplicity
  task_name: string
  description?: string
  category: 'delegate' | 'automate' | 'eliminate' | 'personal'
  confidence_score?: number
  duration_minutes: number
  voice_transcript?: string
  created_at: string
}

export interface User {
  id: string
  email: string
  created_at: string
}