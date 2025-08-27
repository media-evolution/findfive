import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/lib/session-service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const body = await request.json()
    const { action, ...data } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'extend':
        if (!data.additionalDays) {
          return NextResponse.json(
            { error: 'Missing required field: additionalDays' },
            { status: 400 }
          )
        }
        result = await SessionService.extendSession({
          sessionId,
          additionalDays: data.additionalDays,
          reason: data.reason
        })
        break

      case 'complete':
        result = await SessionService.completeSession({
          sessionId,
          actualEndDate: data.actualEndDate,
          notes: data.notes
        })
        break

      case 'pause':
        result = await SessionService.pauseSession(sessionId)
        break

      case 'resume':
        result = await SessionService.resumeSession(sessionId)
        break

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Session action error:', error)
    return NextResponse.json(
      { error: 'Failed to perform session action' },
      { status: 500 }
    )
  }
}