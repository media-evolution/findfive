import { NextRequest, NextResponse } from 'next/server'
import { InterruptionService } from '@/lib/interruption-service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ interruptionId: string }> }
) {
  try {
    const { interruptionId } = await params
    const body = await request.json()
    
    const interruption = await InterruptionService.updateInterruption(interruptionId, body)
    
    return NextResponse.json(interruption)
  } catch (error) {
    console.error('Interruption update error:', error)
    return NextResponse.json(
      { error: 'Failed to update interruption' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ interruptionId: string }> }
) {
  try {
    const { interruptionId } = await params
    
    await InterruptionService.deleteInterruption(interruptionId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Interruption deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete interruption' },
      { status: 500 }
    )
  }
}