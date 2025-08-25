// Interruption Service - API integration for interruption tracking
import { supabase } from '@/lib/supabase'
import { 
  Interruption, 
  CreateInterruptionInput,
  UpdateInterruptionInput,
  InterruptionWithSession
} from '@/types/session'

export class InterruptionService {
  /**
   * Create a new interruption
   */
  static async createInterruption(input: CreateInterruptionInput): Promise<Interruption> {
    const { data, error } = await supabase
      .from('interruptions')
      .insert([{
        session_id: input.session_id,
        source: input.source,
        impact: input.impact,
        duration_minutes: input.duration_minutes,
        description: input.description,
        occurred_at: input.occurred_at
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create interruption: ${error.message}`)
    }

    return data
  }

  /**
   * Get interruptions for a specific session
   */
  static async getSessionInterruptions(sessionId: string): Promise<Interruption[]> {
    const { data, error } = await supabase
      .from('interruptions')
      .select('*')
      .eq('session_id', sessionId)
      .order('occurred_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get session interruptions: ${error.message}`)
    }

    return data
  }

  /**
   * Get all interruptions for a user (across sessions)
   */
  static async getUserInterruptions(
    userId: string, 
    options?: { 
      limit?: number
      offset?: number
      dateRange?: { start: string, end: string }
    }
  ): Promise<InterruptionWithSession[]> {
    let query = supabase
      .from('interruptions')
      .select(`
        *,
        session:sessions!inner(
          id,
          user_id,
          type,
          start_date,
          status
        )
      `)
      .eq('session.user_id', userId)
      .order('occurred_at', { ascending: false })

    if (options?.dateRange) {
      query = query
        .gte('occurred_at', options.dateRange.start)
        .lte('occurred_at', options.dateRange.end)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get user interruptions: ${error.message}`)
    }

    return data.map(item => ({
      ...item,
      session: item.session
    }))
  }

  /**
   * Update an interruption
   */
  static async updateInterruption(
    interruptionId: string, 
    updates: UpdateInterruptionInput
  ): Promise<Interruption> {
    const { data, error } = await supabase
      .from('interruptions')
      .update(updates)
      .eq('id', interruptionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update interruption: ${error.message}`)
    }

    return data
  }

  /**
   * Delete an interruption
   */
  static async deleteInterruption(interruptionId: string): Promise<void> {
    const { error } = await supabase
      .from('interruptions')
      .delete()
      .eq('id', interruptionId)

    if (error) {
      throw new Error(`Failed to delete interruption: ${error.message}`)
    }
  }

  /**
   * Get interruption statistics for a session
   */
  static async getSessionInterruptionStats(sessionId: string): Promise<{
    total: number
    bySource: Record<string, number>
    byImpact: Record<string, number>
    totalMinutes: number
    averageDuration: number
  }> {
    const { data, error } = await supabase
      .from('interruptions')
      .select('source, impact, duration_minutes')
      .eq('session_id', sessionId)

    if (error) {
      throw new Error(`Failed to get interruption stats: ${error.message}`)
    }

    const total = data.length
    const totalMinutes = data.reduce((sum, int) => sum + int.duration_minutes, 0)
    const averageDuration = total > 0 ? Math.round(totalMinutes / total) : 0

    const bySource: Record<string, number> = {}
    const byImpact: Record<string, number> = {}

    data.forEach(interruption => {
      bySource[interruption.source] = (bySource[interruption.source] || 0) + 1
      byImpact[interruption.impact] = (byImpact[interruption.impact] || 0) + 1
    })

    return {
      total,
      bySource,
      byImpact,
      totalMinutes,
      averageDuration
    }
  }

  /**
   * Quick interruption creation with minimal data
   */
  static async quickInterruption(
    sessionId: string,
    source: Interruption['source'],
    impact: Interruption['impact'] = 'medium',
    durationMinutes: number = 5
  ): Promise<Interruption> {
    return this.createInterruption({
      session_id: sessionId,
      source,
      impact,
      duration_minutes: durationMinutes,
      occurred_at: new Date().toISOString()
    })
  }
}