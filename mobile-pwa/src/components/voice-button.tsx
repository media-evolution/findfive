'use client'

import { useState, useEffect, useRef } from 'react'
import { VoiceRecorder } from '@/lib/voice-recorder'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface VoiceButtonProps {
  onTranscript: (transcript: string) => void
  className?: string
  disabled?: boolean
}

export function VoiceButton({ onTranscript, className = '', disabled = false }: VoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<VoiceRecorder | null>(null)

  useEffect(() => {
    const recorder = new VoiceRecorder({
      onStart: () => {
        setIsRecording(true)
        setError(null)
        setTranscript('')
      },
      onStop: () => {
        setIsRecording(false)
        if (transcript.trim()) {
          onTranscript(transcript.trim())
          setTranscript('')
        }
      },
      onTranscript: (text) => {
        setTranscript(text)
      },
      onError: (err) => {
        setError(err)
        setIsRecording(false)
        setTranscript('')
      }
    })

    recorderRef.current = recorder
    setIsSupported(recorder.isSupported())

    return () => {
      if (recorder.getIsRecording()) {
        recorder.stopRecording()
      }
    }
  }, [transcript, onTranscript])

  const handleMouseDown = () => {
    if (!disabled && !isRecording) {
      recorderRef.current?.startRecording()
    }
  }

  const handleMouseUp = () => {
    if (!disabled && isRecording) {
      recorderRef.current?.stopRecording()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleMouseDown()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    handleMouseUp()
  }

  if (!isSupported) {
    return (
      <div className="text-center p-4">
        <MicOff className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600">Voice recording not supported</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="gradient-primary rounded-3xl p-6 card-shadow-lg">
        <button
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-200 select-none
            ${isRecording 
              ? 'bg-red-500 shadow-lg scale-110 animate-pulse' 
              : 'bg-white hover:bg-gray-50 active:scale-95'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${isRecording ? 'text-white' : 'text-gray-700'}
            shadow-lg
            ${className}
          `}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={disabled}
          type="button"
        >
          {isRecording ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
          
          {isRecording && (
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
          )}
        </button>
      </div>
      
      <div className="text-center min-h-[60px] max-w-xs">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">
            {error}
          </p>
        )}
        
        {isRecording && (
          <div className="space-y-1">
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Recording...</p>
            <p className="text-xs" style={{ color: 'var(--secondary-text)' }}>Hold to continue, release to stop</p>
          </div>
        )}
        
        {!isRecording && !error && (
          <p className="text-sm" style={{ color: 'var(--secondary-text)' }}>
            Hold to record your task
          </p>
        )}
        
        {transcript && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 italic">"{transcript}"</p>
          </div>
        )}
      </div>
    </div>
  )
}