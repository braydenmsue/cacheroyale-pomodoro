'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { formatTime } from '@/utils/time'

interface TimerProps {
  sessionActive: boolean
  setSessionActive: (active: boolean) => void
}

export default function Timer({ sessionActive, setSessionActive }: TimerProps) {
  const [time, setTime] = useState(25 * 60) // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [recommendedBreak, setRecommendedBreak] = useState(5 * 60)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev - 1)
      }, 1000)
    } else if (time === 0) {
      handleTimerComplete()
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, time])

  const handleTimerComplete = async () => {
    setIsRunning(false)
    
    if (!isBreak && sessionId) {
      // Work session ended, start break
      try {
        const response = await api.endSession(sessionId)
        const breakTime = await api.getRecommendedInterval(sessionId)
        setRecommendedBreak(breakTime)
        setTime(breakTime)
        setIsBreak(true)
        showNotification('Time for a break!', `Take a ${Math.round(breakTime / 60)} minute break`)
      } catch (error) {
        console.error('Error ending session:', error)
        setTime(5 * 60) // Default 5 min break
        setIsBreak(true)
      }
    } else {
      // Break ended
      setIsBreak(false)
      setTime(25 * 60)
      setSessionActive(false)
      showNotification('Break over!', 'Ready to focus again?')
    }
  }

  const startTimer = async () => {
    if (!isRunning) {
      try {
        if (!isBreak) {
          const response = await api.startSession()
          setSessionId(response.session_id)
          setSessionActive(true)
        }
        setIsRunning(true)
      } catch (error) {
        console.error('Error starting session:', error)
        setIsRunning(true)
      }
    }
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setIsBreak(false)
    setTime(25 * 60)
    setSessionActive(false)
    setSessionId(null)
  }

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.png' })
    }
  }

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
          {isBreak ? '☕ Break Time' : '🎯 Focus Session'}
        </h2>
        
        <div className="text-8xl font-bold mb-8 text-gray-800 dark:text-white font-mono">
          {formatTime(time)}
        </div>

        <div className="flex gap-4 justify-center mb-6">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="px-8 py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg"
            >
              Start
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="px-8 py-4 bg-yellow-500 text-white rounded-lg font-semibold text-lg hover:bg-yellow-600 transition-colors shadow-lg"
            >
              Pause
            </button>
          )}
          
          <button
            onClick={resetTimer}
            className="px-8 py-4 bg-gray-500 text-white rounded-lg font-semibold text-lg hover:bg-gray-600 transition-colors shadow-lg"
          >
            Reset
          </button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {isBreak 
            ? `Recommended break: ${Math.round(recommendedBreak / 60)} minutes`
            : 'Standard work session: 25 minutes'}
        </div>
      </div>
    </div>
  )
}
