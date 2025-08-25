'use client'

import { useState } from 'react'
import { useEntriesStore } from '@/store/entries-store'
import { useUser } from '@/lib/user-context'
import { VoiceButton } from './voice-button'
import { Clock, Save, Loader2 } from 'lucide-react'

export function TaskForm() {
  const [taskName, setTaskName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(15)
  const [category, setCategory] = useState<'delegate' | 'automate' | 'eliminate' | 'personal'>('personal')
  
  // V2 fields
  const [energyLevel, setEnergyLevel] = useState<number>(3)
  const [taskMode, setTaskMode] = useState<'proactive' | 'reactive'>('proactive')
  const [enjoyment, setEnjoyment] = useState<'like' | 'neutral' | 'dislike'>('neutral')
  const [taskType, setTaskType] = useState<'personal' | 'work' | 'both'>('work')
  const [frequency, setFrequency] = useState<'daily' | 'regular' | 'infrequent'>('regular')
  const [urgency, setUrgency] = useState<'urgent' | 'not_urgent'>('not_urgent')
  const [importance, setImportance] = useState<'important' | 'not_important'>('important')
  
  const { addEntry, addEntryFromVoice, isLoading, error } = useEntriesStore()
  const { userId } = useUser()

  const handleVoiceTranscript = async (transcript: string) => {
    await addEntryFromVoice(transcript, userId, duration)
    // Clear form after voice entry
    setTaskName('')
    setDescription('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskName.trim()) return

    await addEntry({
      task_name: taskName.trim(),
      description: description.trim() || undefined,
      category,
      duration_minutes: duration,
      // V2 fields
      energy_level: energyLevel,
      task_mode: taskMode,
      enjoyment: enjoyment,
      task_type: taskType,
      frequency: frequency,
      recorded_at: new Date().toISOString(),
      recording_delay_minutes: 0,
      urgency: urgency,
      importance: importance
    }, userId)

    // Clear form
    setTaskName('')
    setDescription('')
  }

  const categoryColors = {
    delegate: 'bg-green-100 text-green-800 border-green-200',
    automate: 'bg-orange-100 text-orange-800 border-orange-200', 
    eliminate: 'bg-red-100 text-red-800 border-red-200',
    personal: 'bg-purple-100 text-purple-800 border-purple-200'
  }

  const categoryLabels = {
    delegate: 'Delegate',
    automate: 'Automate', 
    eliminate: 'Eliminate',
    personal: 'Personal'
  }

  return (
    <div className="rounded-3xl card-shadow-lg p-6 mb-6" style={{ backgroundColor: 'var(--card-background)' }}>
      <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: 'var(--foreground)' }}>
        Capture Your Task
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Voice Capture */}
      <div className="text-center mb-8">
        <VoiceButton
          onTranscript={handleVoiceTranscript}
          disabled={isLoading}
        />
      </div>

      {/* Manual Entry Form */}
      <div className="relative">
        <div className="absolute left-1/2 transform -translate-x-1/2 -top-3 px-3 text-sm" style={{ backgroundColor: 'var(--card-background)', color: 'var(--secondary-text)' }}>
          or enter manually
        </div>
        <div className="pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="taskName" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Task Name
              </label>
              <input
                id="taskName"
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="What did you work on?"
                className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                style={{ 
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card-background)',
                  color: 'var(--foreground)'
                }}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any additional details..."
                rows={2}
                className="w-full px-4 py-3 rounded-2xl outline-none resize-none transition-all"
                style={{ 
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card-background)',
                  color: 'var(--foreground)'
                }}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  <Clock className="inline w-4 h-4 mr-1" />
                  Duration (minutes)
                </label>
                <input
                  id="duration"
                  type="number"
                  min="1"
                  max="480"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 15)}
                  className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                  style={{ 
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)'
                  }}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                  style={{ 
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)'
                  }}
                  disabled={isLoading}
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* V2 Enhanced Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Energy Level (1-5)
                </label>
                <select
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                  style={{ 
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)'
                  }}
                  disabled={isLoading}
                >
                  <option value={1}>1 - Very Low</option>
                  <option value={2}>2 - Low</option>
                  <option value={3}>3 - Medium</option>
                  <option value={4}>4 - High</option>
                  <option value={5}>5 - Very High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Task Mode
                </label>
                <select
                  value={taskMode}
                  onChange={(e) => setTaskMode(e.target.value as 'proactive' | 'reactive')}
                  className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                  style={{ 
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)'
                  }}
                  disabled={isLoading}
                >
                  <option value="proactive">Proactive</option>
                  <option value="reactive">Reactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Enjoyment
                </label>
                <select
                  value={enjoyment}
                  onChange={(e) => setEnjoyment(e.target.value as 'like' | 'neutral' | 'dislike')}
                  className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                  style={{ 
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)'
                  }}
                  disabled={isLoading}
                >
                  <option value="like">👍 Like</option>
                  <option value="neutral">😐 Neutral</option>
                  <option value="dislike">👎 Dislike</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Task Type
                </label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as 'personal' | 'work' | 'both')}
                  className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                  style={{ 
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)'
                  }}
                  disabled={isLoading}
                >
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'daily' | 'regular' | 'infrequent')}
                  className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                  style={{ 
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)'
                  }}
                  disabled={isLoading}
                >
                  <option value="daily">Daily</option>
                  <option value="regular">Regular</option>
                  <option value="infrequent">Infrequent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Urgency
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as 'urgent' | 'not_urgent')}
                  className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                  style={{ 
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)'
                  }}
                  disabled={isLoading}
                >
                  <option value="urgent">🔥 Urgent</option>
                  <option value="not_urgent">⏰ Not Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Importance
                </label>
                <select
                  value={importance}
                  onChange={(e) => setImportance(e.target.value as 'important' | 'not_important')}
                  className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                  style={{ 
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)'
                  }}
                  disabled={isLoading}
                >
                  <option value="important">⭐ Important</option>
                  <option value="not_important">➖ Not Important</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!taskName.trim() || isLoading}
              className="w-full gradient-primary disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 card-shadow"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Task
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}