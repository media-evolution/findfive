import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/lib/session-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    const options = {
      status: status || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    }

    const sessions = await SessionService.getUserSessions(userId, options)

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, start_date, planned_end_date } = body

    if (!userId || !type || !start_date || !planned_end_date) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, start_date, planned_end_date' },
        { status: 400 }
      )
    }

    const session = await SessionService.createSession(userId, {
      type,
      start_date,
      planned_end_date
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}