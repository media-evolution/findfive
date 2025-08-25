import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/lib/session-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    const leaveRecords = await SessionService.getSessionLeaveRecords(sessionId)

    return NextResponse.json(leaveRecords)
  } catch (error) {
    console.error('Leave records API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leave records' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const body = await request.json()
    const { date, reason } = body

    if (!date) {
      return NextResponse.json(
        { error: 'Missing required field: date' },
        { status: 400 }
      )
    }

    const leaveRecord = await SessionService.addLeaveDay(sessionId, date, reason)

    return NextResponse.json(leaveRecord)
  } catch (error) {
    console.error('Add leave day error:', error)
    return NextResponse.json(
      { error: 'Failed to add leave day' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const leaveRecordId = searchParams.get('leaveRecordId')

    if (!leaveRecordId) {
      return NextResponse.json(
        { error: 'Missing required parameter: leaveRecordId' },
        { status: 400 }
      )
    }

    await SessionService.removeLeaveDay(leaveRecordId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove leave day error:', error)
    return NextResponse.json(
      { error: 'Failed to remove leave day' },
      { status: 500 }
    )
  }
}