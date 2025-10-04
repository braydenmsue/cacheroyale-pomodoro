'use client'

import { useState, useEffect } from 'react'

interface MascotProps {
  sessionActive: boolean
}

export default function Mascot({ sessionActive }: MascotProps) {
  const [mood, setMood] = useState<'happy' | 'focused' | 'tired'>('happy')
  const [message, setMessage] = useState('Ready to work!')

  useEffect(() => {
    if (sessionActive) {
      setMood('focused')
      setMessage('You\'re doing great! Stay focused!')
    } else {
      setMood('happy')
      setMessage('Ready to work!')
    }
  }, [sessionActive])

  const getMascotEmoji = () => {
    switch (mood) {
      case 'focused':
        return '🧠'
      case 'tired':
        return '😴'
      default:
        return '😊'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <div className="text-center">
        <div className="text-8xl mb-4 animate-bounce">
          {getMascotEmoji()}
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
          {message}
        </p>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Your focus companion
        </div>
      </div>
    </div>
  )
}
