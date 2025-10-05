
'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface EyeTrackingProps {
  sessionId: string | null
  isActive: boolean
  isPaused: boolean
  onFocusChange: (isFocused: boolean) => void
}

export default function EyeTracking({ sessionId, isActive, isPaused, onFocusChange }: EyeTrackingProps) {
  const [trackingActive, setTrackingActive] = useState(false)
  const [focusPercentage, setFocusPercentage] = useState(0)
  const [currentStatus, setCurrentStatus] = useState('Waiting...')
  const [socket, setSocket] = useState<Socket | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onFocusChangeRef = useRef(onFocusChange)
  useEffect(() => { onFocusChangeRef.current = onFocusChange }, [onFocusChange])

  useEffect(() => {
    const newSocket = io('http://localhost:5000')
    setSocket(newSocket)

    const handleGaze = (data: { is_focused: boolean; focus_percentage: number }) => {
      setCurrentStatus(data.is_focused ? 'Focused ✓' : 'Not Focused ✗')
      setFocusPercentage(data.focus_percentage)
      onFocusChangeRef.current(data.is_focused)
    }

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected')
    })

    newSocket.on('gaze_update', handleGaze)

    newSocket.on('connect_error', (err) => {
      console.error('❌ WebSocket connection error:', err)
    })

    return () => {
      newSocket.off('gaze_update', handleGaze)
      newSocket.close()
    }
  }, [])

    useEffect(() => {
      if (!sessionId) return

      if (isActive && !isPaused) {
        startTracking()
      } else {
        stopTracking()
      }
    }, [isActive, sessionId, isPaused])


  const startTracking = async () => {
    if (!sessionId) {
      console.error('❌ No session ID')
      return
    }

    console.log('🎬 Calling start_tracking API for session:', sessionId)
    setError(null)

    try {
      const response = await fetch('http://localhost:5000/api/start_tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      })

      const data = await response.json()
      console.log('📥 Start tracking response:', data)

      if (response.ok) {
        console.log('✅ Tracking started')
        setTrackingActive(true)
      } else {
        console.error('❌ Failed to start tracking:', data)
        setError(data.message || 'Failed to start tracking')
      }
    } catch (error) {
      console.error('❌ Error starting tracking:', error)
      setError('Failed to connect to backend')
    }
  }

  const stopTracking = async () => {
    console.log('Stopping tracking...')
    try {
      await fetch('http://localhost:5000/api/stop_tracking', {
        method: 'POST'
      })
      setTrackingActive(false)
    } catch (error) {
      console.error('Error stopping tracking:', error)
    }
  }

  if (!isActive) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
        👁️ Eye Tracking {isPaused && <span className="text-yellow-500">(Paused)</span>}
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          ❌ {error}
        </div>
      )}

      {isPaused && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg text-center">
          ⏸️ Tracking paused - Resume timer to continue
        </div>
      )}

      {trackingActive && !isPaused ? (
        <>
          <div className="mb-4 rounded-lg overflow-hidden bg-black">
            <img
              src={`http://localhost:5000/api/video_feed/${sessionId}`}
              alt="Eye tracking feed"
              className="w-full"
              onLoad={() => console.log('✅ Image loaded')}
              onError={(e) => {
                console.error('❌ Image load error:', e)
                setError('Failed to load video feed')
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
              <div className="text-3xl font-bold">{focusPercentage.toFixed(1)}%</div>
              <div className="text-sm opacity-90">Focus Rate</div>
            </div>

            <div   className={`text-center p-4 rounded-lg text-white ${
              currentStatus === 'Focused ✓'
                ? 'bg-gradient-to-br from-green-500 to-teal-600'
                : 'bg-gradient-to-br from-red-500 to-pink-600'
            }`}>
              <div className="text-xl font-bold">{currentStatus}</div>
              <div className="text-sm opacity-90">Status</div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          {isPaused ? '⏸️ Paused' : 'Eye tracking will start with your session...'}
        </div>
      )}
    </div>
  )
}
