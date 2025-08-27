import { NextRequest, NextResponse } from 'next/server'
import { InterruptionService } from '@/lib/interruption-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required' },
        { status: 400 }
      )
    }

    let interruptions

    if (sessionId) {
      interruptions = await InterruptionService.getSessionInterruptions(sessionId)
    } else if (userId) {
      const options = {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      }
      interruptions = await InterruptionService.getUserInterruptions(userId, options)
    }

    return NextResponse.json(interruptions)
  } catch (error) {
    console.error('Interruption API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interruptions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, source, impact, duration_minutes, description, occurred_at } = body

    if (!session_id || !source || !impact || !duration_minutes) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, source, impact, duration_minutes' },
        { status: 400 }
      )
    }

    // Validate enum values
    const validSources = ['self', 'email', 'phone', 'team', 'client', 'other']
    const validImpacts = ['low', 'medium', 'high']

    if (!validSources.includes(source)) {
      return NextResponse.json(
        { error: 'Invalid source value' },
        { status: 400 }
      )
    }

    if (!validImpacts.includes(impact)) {
      return NextResponse.json(
        { error: 'Invalid impact value' },
        { status: 400 }
      )
    }

    if (duration_minutes <= 0 || duration_minutes > 480) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 480 minutes' },
        { status: 400 }
      )
    }

    const interruption = await InterruptionService.createInterruption({
      session_id,
      source,
      impact,
      duration_minutes,
      description,
      occurred_at: occurred_at || new Date().toISOString()
    })

    return NextResponse.json(interruption)
  } catch (error) {
    console.error('Interruption creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create interruption' },
      { status: 500 }
    )
  }
}