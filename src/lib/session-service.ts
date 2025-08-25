// Session Service - Core session management operations
import { supabase } from '@/lib/supabase'
import { 
  Session, 
  LeaveRecord, 
  CreateSessionInput, 
  CreateLeaveRecordInput,
  SessionWithProgress,
  SessionProgress,
  SessionExtendRequest,
  SessionCompleteRequest,
  calculateEndDate 
} from '@/types/session'

export class SessionService {
  /**
   * Create a new session for a user
   */
  static async createSession(userId: string, input: CreateSessionInput): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .insert([{
        user_id: userId,
        type: input.type,
        start_date: input.start_date,
        planned_end_date: input.planned_end_date,
        status: 'active'
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return data
  }

  /**
   * Get the current active session for a user
   */
  static async getCurrentSession(userId: string): Promise<SessionWithProgress | null> {
    // First get the active session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        // No active session found
        return null
      }
      throw new Error(`Failed to get current session: ${sessionError.message}`)
    }

    // Get session progress using the database function
    const { data: progressData, error: progressError } = await supabase
      .rpc('calculate_session_progress', { p_session_id: session.id })

    if (progressError) {
      console.warn('Failed to calculate session progress:', progressError)
    }

    // Get additional stats
    const { data: leaveData } = await supabase
      .from('leave_records')
      .select('*')
      .eq('session_id', session.id)

    const { data: interruptionData } = await supabase
      .from('interruptions')
      .select('*')
      .eq('session_id', session.id)

    const sessionWithProgress: SessionWithProgress = {
      ...session,
      progress: progressData || undefined,
      leave_count: leaveData?.length || 0,
      interruption_count: interruptionData?.length || 0,
      total_interruption_minutes: interruptionData?.reduce((sum, int) => sum + int.duration_minutes, 0) || 0
    }

    return sessionWithProgress
  }

  /**
   * Get all sessions for a user with optional filtering
   */
  static async getUserSessions(
    userId: string, 
    options?: { 
      status?: string
      limit?: number
      offset?: number 
    }
  ): Promise<SessionWithProgress[]> {
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data: sessions, error } = await query

    if (error) {
      throw new Error(`Failed to get user sessions: ${error.message}`)
    }

    // Enhance each session with progress data
    const sessionsWithProgress = await Promise.all(
      sessions.map(async (session) => {
        const { data: progressData } = await supabase
          .rpc('calculate_session_progress', { p_session_id: session.id })

        const { data: leaveData } = await supabase
          .from('leave_records')
          .select('*')
          .eq('session_id', session.id)

        const { data: interruptionData } = await supabase
          .from('interruptions')
          .select('*')
          .eq('session_id', session.id)

        return {
          ...session,
          progress: progressData || undefined,
          leave_count: leaveData?.length || 0,
          interruption_count: interruptionData?.length || 0,
          total_interruption_minutes: interruptionData?.reduce((sum, int) => sum + int.duration_minutes, 0) || 0
        }
      })
    )

    return sessionsWithProgress
  }

  /**
   * Extend a session by additional days
   */
  static async extendSession(request: SessionExtendRequest): Promise<Session> {
    const { sessionId, additionalDays } = request

    // Get current session
    const { data: currentSession, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch session: ${fetchError.message}`)
    }

    // Calculate new end date
    const currentEndDate = new Date(currentSession.planned_end_date)
    const newEndDate = new Date(currentEndDate)
    newEndDate.setDate(currentEndDate.getDate() + additionalDays)

    // Update session
    const { data, error } = await supabase
      .from('sessions')
      .update({
        planned_end_date: newEndDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to extend session: ${error.message}`)
    }

    return data
  }

  /**
   * Complete a session
   */
  static async completeSession(request: SessionCompleteRequest): Promise<Session> {
    const { sessionId, actualEndDate, notes } = request

    const updateData: any = {
      status: 'completed',
      actual_end_date: actualEndDate || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to complete session: ${error.message}`)
    }

    return data
  }

  /**
   * Pause a session
   */
  static async pauseSession(sessionId: string): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to pause session: ${error.message}`)
    }

    return data
  }

  /**
   * Resume a paused session
   */
  static async resumeSession(sessionId: string): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to resume session: ${error.message}`)
    }

    return data
  }

  /**
   * Add a leave day to a session
   */
  static async addLeaveDay(sessionId: string, date: string, reason?: string): Promise<LeaveRecord> {
    const input: CreateLeaveRecordInput = {
      session_id: sessionId,
      leave_date: date,
      reason
    }

    const { data, error } = await supabase
      .from('leave_records')
      .insert([input])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add leave day: ${error.message}`)
    }

    return data
  }

  /**
   * Remove a leave day from a session
   */
  static async removeLeaveDay(leaveRecordId: string): Promise<void> {
    const { error } = await supabase
      .from('leave_records')
      .delete()
      .eq('id', leaveRecordId)

    if (error) {
      throw new Error(`Failed to remove leave day: ${error.message}`)
    }
  }

  /**
   * Get leave records for a session
   */
  static async getSessionLeaveRecords(sessionId: string): Promise<LeaveRecord[]> {
    const { data, error } = await supabase
      .from('leave_records')
      .select('*')
      .eq('session_id', sessionId)
      .order('leave_date', { ascending: true })

    if (error) {
      throw new Error(`Failed to get leave records: ${error.message}`)
    }

    return data
  }

  /**
   * Check if a session needs auto-extension based on configuration
   */
  static async checkAutoExtension(sessionId: string, config: { autoExtendOnMiss: boolean, maxMissedDays: number }): Promise<boolean> {
    if (!config.autoExtendOnMiss) {
      return false
    }

    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session || session.status !== 'active') {
      return false
    }

    const today = new Date().toISOString().split('T')[0]
    const plannedEndDate = session.planned_end_date

    if (today > plannedEndDate) {
      const daysPastEnd = Math.floor((new Date(today).getTime() - new Date(plannedEndDate).getTime()) / (1000 * 60 * 60 * 24))
      return daysPastEnd <= config.maxMissedDays
    }

    return false
  }

  /**
   * Auto-extend session if conditions are met
   */
  static async autoExtendSession(sessionId: string, missedDays: number): Promise<Session | null> {
    try {
      return await this.extendSession({
        sessionId,
        additionalDays: missedDays,
        reason: 'Auto-extended due to missed days'
      })
    } catch (error) {
      console.error('Failed to auto-extend session:', error)
      return null
    }
  }
}