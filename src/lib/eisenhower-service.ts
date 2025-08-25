import { supabase } from '@/lib/supabase'

export type EisenhowerQuadrant = 'urgent-important' | 'urgent-not-important' | 'not-urgent-important' | 'not-urgent-not-important'

export interface EisenhowerTask {
  id: string
  taskName: string
  description?: string
  category: 'delegate' | 'automate' | 'eliminate' | 'personal'
  confidenceScore: number
  durationMinutes: number
  energyLevel: number
  taskMode: 'proactive' | 'reactive'
  enjoyment: 'like' | 'neutral' | 'dislike'
  taskType: 'personal' | 'work' | 'both'
  frequency: 'daily' | 'regular' | 'infrequent'
  urgency?: 'urgent' | 'not_urgent'
  importance?: 'important' | 'not_important'
  quadrant?: EisenhowerQuadrant
  createdAt: string
  sessionId?: string
  userId: string
}

export interface EisenhowerFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  sessionId?: string
  category?: string[]
  userId: string
}

export interface EisenhowerStats {
  total: number
  categorized: number
  uncategorized: number
  byQuadrant: Record<EisenhowerQuadrant, number>
  byCategory: Record<string, number>
}

export class EisenhowerService {

  static async getTasks(filters: EisenhowerFilters): Promise<EisenhowerTask[]> {
    let query = supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', filters.userId)
      .order('created_at', { ascending: false })

    if (filters.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start.toISOString())
        .lte('created_at', filters.dateRange.end.toISOString())
    }

    if (filters.sessionId) {
      query = query.eq('session_id', filters.sessionId)
    }

    if (filters.category && filters.category.length > 0) {
      query = query.in('category', filters.category)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    return data?.map(this.mapDatabaseToTask) || []
  }

  static async updateTaskQuadrant(taskId: string, quadrant: EisenhowerQuadrant): Promise<void> {
    const { urgency, importance } = this.quadrantToUrgencyImportance(quadrant)

    const { error } = await supabase
      .from('time_entries')
      .update({
        urgency,
        importance,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (error) {
      throw new Error(`Failed to update task quadrant: ${error.message}`)
    }
  }

  static async bulkUpdateQuadrants(
    updates: Array<{ taskId: string; quadrant: EisenhowerQuadrant }>
  ): Promise<void> {
    const promises = updates.map(({ taskId, quadrant }) => 
      this.updateTaskQuadrant(taskId, quadrant)
    )

    await Promise.all(promises)
  }

  static async getStats(filters: EisenhowerFilters): Promise<EisenhowerStats> {
    const tasks = await this.getTasks(filters)
    
    const total = tasks.length
    const categorized = tasks.filter(t => t.quadrant).length
    const uncategorized = total - categorized

    const byQuadrant: Record<EisenhowerQuadrant, number> = {
      'urgent-important': 0,
      'urgent-not-important': 0,
      'not-urgent-important': 0,
      'not-urgent-not-important': 0
    }

    const byCategory: Record<string, number> = {}

    tasks.forEach(task => {
      if (task.quadrant) {
        byQuadrant[task.quadrant]++
      }
      
      byCategory[task.category] = (byCategory[task.category] || 0) + 1
    })

    return {
      total,
      categorized,
      uncategorized,
      byQuadrant,
      byCategory
    }
  }

  static getQuadrantFromUrgencyImportance(
    urgency?: 'urgent' | 'not_urgent',
    importance?: 'important' | 'not_important'
  ): EisenhowerQuadrant | undefined {
    if (!urgency || !importance) return undefined

    const isUrgent = urgency === 'urgent'
    const isImportant = importance === 'important'

    if (isUrgent && isImportant) return 'urgent-important'
    if (isUrgent && !isImportant) return 'urgent-not-important'
    if (!isUrgent && isImportant) return 'not-urgent-important'
    return 'not-urgent-not-important'
  }

  static quadrantToUrgencyImportance(quadrant: EisenhowerQuadrant): {
    urgency: 'urgent' | 'not_urgent'
    importance: 'important' | 'not_important'
  } {
    switch (quadrant) {
      case 'urgent-important':
        return { urgency: 'urgent', importance: 'important' }
      case 'urgent-not-important':
        return { urgency: 'urgent', importance: 'not_important' }
      case 'not-urgent-important':
        return { urgency: 'not_urgent', importance: 'important' }
      case 'not-urgent-not-important':
        return { urgency: 'not_urgent', importance: 'not_important' }
    }
  }

  static getQuadrantInfo(quadrant: EisenhowerQuadrant) {
    switch (quadrant) {
      case 'urgent-important':
        return {
          title: 'Do First',
          subtitle: 'Urgent & Important',
          description: 'Crisis, emergencies, deadline-driven projects',
          color: 'red',
          actionType: 'DO'
        }
      case 'urgent-not-important':
        return {
          title: 'Delegate',
          subtitle: 'Urgent & Not Important',
          description: 'Interruptions, some emails, some meetings',
          color: 'yellow',
          actionType: 'DELEGATE'
        }
      case 'not-urgent-important':
        return {
          title: 'Schedule',
          subtitle: 'Not Urgent & Important',
          description: 'Planning, prevention, improvement activities',
          color: 'green',
          actionType: 'SCHEDULE'
        }
      case 'not-urgent-not-important':
        return {
          title: 'Eliminate',
          subtitle: 'Not Urgent & Not Important',
          description: 'Time wasters, excessive social media, busy work',
          color: 'gray',
          actionType: 'ELIMINATE'
        }
    }
  }

  private static mapDatabaseToTask(dbEntry: any): EisenhowerTask {
    return {
      id: dbEntry.id,
      taskName: dbEntry.task_name,
      description: dbEntry.description,
      category: dbEntry.category,
      confidenceScore: dbEntry.confidence_score || 0,
      durationMinutes: dbEntry.duration_minutes,
      energyLevel: dbEntry.energy_level || 3,
      taskMode: dbEntry.task_mode || 'reactive',
      enjoyment: dbEntry.enjoyment || 'neutral',
      taskType: dbEntry.task_type || 'work',
      frequency: dbEntry.frequency || 'regular',
      urgency: dbEntry.urgency,
      importance: dbEntry.importance,
      quadrant: this.getQuadrantFromUrgencyImportance(dbEntry.urgency, dbEntry.importance),
      createdAt: dbEntry.created_at,
      sessionId: dbEntry.session_id,
      userId: dbEntry.user_id
    }
  }
}