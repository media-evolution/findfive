import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/lib/session-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    const currentSession = await SessionService.getCurrentSession(userId)

    if (!currentSession) {
      return NextResponse.json(null)
    }

    return NextResponse.json(currentSession)
  } catch (error) {
    console.error('Current session API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch current session' },
      { status: 500 }
    )
  }
}