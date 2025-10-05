'use client'

import { useState } from 'react'
import Timer from '@/components/Timer'
import Mascot from '@/components/Mascot'
import SessionStats from '@/components/SessionStats'
import EyeTracking from '@/components/EyeTracking'
import SpotifyPlayer from '@/components/SpotifyPlayer'

export default function Home() {
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  console.log('Home render:', { sessionActive, sessionId }) // Debug log

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-2">
            Anti-Brainrot Pomodoro Timer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Stay focused with adaptive break intervals powered by MediaPipe
          </p>
        </header>

        <div className="space-y-8">
          {/* Top row: Timer + Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <div className="lg:col-span-2 space-y-6">
              <Timer
                sessionActive={sessionActive}
                setSessionActive={setSessionActive}
                onSessionIdChange={setSessionId}
                onPausedChange={setIsPaused}
              />
              <EyeTracking
                sessionId={sessionId}
                isActive={sessionActive}
                isPaused={isPaused}
              />
            </div>

            <div className="flex">
              <div className="flex-1">
                <SessionStats />
              </div>
            </div>
          </div>

          {/* Bottom row: Mascot + Spotify */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <div className="flex">
              <div className="flex-1">
                <Mascot sessionActive={sessionActive} />
              </div>
            </div>

            <div className="lg:col-span-2 flex">
              <div className="flex-1">
                <SpotifyPlayer />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
