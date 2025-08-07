'use client'

import { useEffect, useState, useRef } from 'react'
import { TaskList } from '@/components/task-list'
import { TaskModal } from '@/components/task-modal'
import { BottomNav } from '@/components/bottom-nav'
import { useEntriesStore } from '@/store/entries-store'
import { VoiceRecorder } from '@/lib/voice-recorder'
import { Mic, Plus, Keyboard, RotateCcw, Trash2 } from 'lucide-react'

export default function Home() {
  const { userId, setUserId, syncOfflineEntries, addEntryFromVoice } = useEntriesStore()
  const [activeTab, setActiveTab] = useState('Today')
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const recorderRef = useRef<VoiceRecorder | null>(null)

  useEffect(() => {
    // Initialize user ID for MVP
    if (!userId) {
      let storedUserId = localStorage.getItem('find-five-user-id')
      if (!storedUserId) {
        storedUserId = `user-${Date.now()}`
        localStorage.setItem('find-five-user-id', storedUserId)
      }
      setUserId(storedUserId)
    }
  }, [userId, setUserId])

  useEffect(() => {
    // Try to sync offline entries when app loads
    if (userId) {
      syncOfflineEntries()
    }
  }, [userId, syncOfflineEntries])

  useEffect(() => {
    const recorder = new VoiceRecorder({
      onStart: () => {
        setIsRecording(true)
        setTranscript('')
      },
      onStop: () => {
        setIsRecording(false)
        if (transcript.trim()) {
          handleVoiceTranscript(transcript.trim())
          setTranscript('')
        }
      },
      onTranscript: (text) => {
        setTranscript(text)
      },
      onError: (err) => {
        console.error('Voice recording error:', err)
        setIsRecording(false)
        setTranscript('')
      }
    })

    recorderRef.current = recorder

    return () => {
      if (recorder.getIsRecording()) {
        recorder.stopRecording()
      }
    }
  }, [transcript])

  const getCurrentDate = () => {
    const date = new Date()
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCurrentTime = () => {
    const date = new Date()
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleVoiceTranscript = async (transcript: string) => {
    await addEntryFromVoice(transcript, 15)
  }

  const handleMouseDown = () => {
    if (!isRecording) {
      recorderRef.current?.startRecording()
    }
  }

  const handleMouseUp = () => {
    if (isRecording) {
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

  const tabs = ['Today', 'This Week', 'Insights']

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>

      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-4xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
          Find Five
        </h1>
        <p className="text-lg" style={{ color: 'var(--secondary-text)' }}>
          {getCurrentDate()}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 space-y-6">
        {/* Quick Capture Card */}
        <div className="rounded-3xl p-6 card-shadow-lg gradient-primary">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Quick Capture
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Tap and hold to record what you're doing
          </p>

          {/* Voice Button */}
          <div className="flex justify-center mb-8">
            <button 
              className={`w-24 h-24 rounded-full flex items-center justify-center card-shadow-lg transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-500 scale-110 animate-pulse' 
                  : 'bg-white hover:bg-gray-50 active:scale-95'
              }`}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Mic 
                className={`w-10 h-10 ${isRecording ? 'text-white' : ''}`} 
                style={{ color: isRecording ? 'white' : 'var(--gradient-start)' }}
              />
              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
              )}
            </button>
          </div>
          
          {isRecording && transcript && (
            <div className="text-center mb-4">
              <p className="text-white/90 text-sm italic">"{transcript}"</p>
            </div>
          )}
          
          {isRecording && (
            <div className="text-center mb-6">
              <p className="text-white font-medium">Recording...</p>
              <p className="text-white/80 text-sm">Hold to continue, release to stop</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white/90 text-sm font-medium hover:bg-white/30 transition-colors"
            >
              <Keyboard className="w-4 h-4" />
              Type
            </button>
            <button 
              onClick={() => {
                setTranscript('')
                if (isRecording) {
                  recorderRef.current?.stopRecording()
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white/90 text-sm font-medium hover:bg-white/30 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restart
            </button>
          </div>
        </div>

        <TaskList />
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full flex items-center justify-center fab-shadow gradient-primary"
      >
        <Plus className="w-8 h-8 text-white" />
      </button>

      {/* Task Modal */}
      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
