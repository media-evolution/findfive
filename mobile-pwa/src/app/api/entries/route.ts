import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // For temporary UUID system, entries are stored locally only
  // This endpoint returns empty array as data is managed client-side
  return NextResponse.json([])
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      user_id, 
      task_name, 
      description, 
      category, 
      confidence_score, 
      duration_minutes, 
      voice_transcript,
      // V2 fields
      session_id,
      energy_level,
      task_mode,
      enjoyment,
      task_type,
      frequency,
      recorded_at,
      recording_delay_minutes,
      urgency,
      importance
    } = body

    if (!user_id || !task_name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, task_name, category' },
        { status: 400 }
      )
    }

    // Validate V2 field constraints
    if (energy_level !== undefined && (energy_level < 1 || energy_level > 5)) {
      return NextResponse.json(
        { error: 'energy_level must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (recording_delay_minutes !== undefined && recording_delay_minutes < 0) {
      return NextResponse.json(
        { error: 'recording_delay_minutes must be non-negative' },
        { status: 400 }
      )
    }

    // For temporary UUID system, just return success
    // Data is managed entirely client-side in the store
    const mockEntry = {
      id: crypto.randomUUID(),
      user_id,
      task_name,
      description,
      category,
      confidence_score: confidence_score || 0.5,
      duration_minutes: duration_minutes || 15,
      voice_transcript,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      input_method: voice_transcript ? 'voice' : 'text',
      // V2 fields
      session_id,
      energy_level,
      task_mode,
      enjoyment,
      task_type,
      frequency,
      recorded_at,
      recording_delay_minutes,
      urgency,
      importance
    }

    return NextResponse.json(mockEntry)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}