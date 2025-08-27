'use client'

import { useState, useEffect } from 'react'
import { useEntriesStore } from '@/store/entries-store'
import { useUser } from '@/lib/user-context'
import { X, Clock } from 'lucide-react'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TaskModal({ isOpen, onClose }: TaskModalProps) {
  const [taskName, setTaskName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'delegate' | 'automate' | 'eliminate' | 'personal'>('delegate')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [confidence, setConfidence] = useState(85)
  
  const { addEntry, isLoading } = useEntriesStore()
  const { userId } = useUser()

  useEffect(() => {
    if (isOpen) {
      // Set default times (current time and 30 minutes ago)
      const now = new Date()
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000)
      
      setStartTime(formatTimeForInput(thirtyMinutesAgo))
      setEndTime(formatTimeForInput(now))
    }
  }, [isOpen])

  const formatTimeForInput = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const calculateDuration = () => {
    if (!startTime || !endTime) return 15
    
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    
    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes
    
    const duration = endTotalMinutes - startTotalMinutes
    return duration > 0 ? duration : 15
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskName.trim()) return

    const duration = calculateDuration()

    await addEntry({
      task_name: taskName.trim(),
      description: description.trim() || undefined,
      category,
      confidence_score: confidence / 100,
      duration_minutes: duration
    }, userId)

    // Reset form
    setTaskName('')
    setDescription('')
    setCategory('delegate')
    onClose()
  }

  const categories = [
    { value: 'delegate', label: 'Can Delegate', color: 'bg-green-500' },
    { value: 'automate', label: 'Can Automate', color: 'bg-orange-500' },
    { value: 'eliminate', label: 'Can Eliminate', color: 'bg-red-500' },
    { value: 'personal', label: 'Must Do Personally', color: 'bg-purple-500' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg mx-4 rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:pb-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Log Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <p className="text-gray-500 mb-6">What are you working on?</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Task Name
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g., Email Campaign Review"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          
          {/* Duration Display */}
          <div className="text-center py-2 px-4 bg-gray-50 rounded-2xl">
            <span className="text-sm text-gray-600">Duration: </span>
            <span className="font-semibold text-gray-900">{calculateDuration()} minutes</span>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-3">
              Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value as any)}
                  className={`px-4 py-3 rounded-2xl font-medium text-sm transition-all ${
                    category === cat.value
                      ? `${cat.color} text-white shadow-lg scale-105`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Confidence */}
          <div className="p-4 bg-blue-50 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">AI Confidence</span>
              <span className="text-sm font-bold text-blue-600">{confidence}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-600 mt-2">
              Adjust the confidence level for this categorization
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={!taskName.trim() || isLoading}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-colors"
            >
              Save Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}