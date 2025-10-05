'use client'

import { useState, useEffect } from 'react'
import focusedMascot from '../assets/capoo-capoo-type-transparent.gif'
import happyMascot from '../assets/happy-capoo.gif'
import tiredMascot from '../assets/tired-capoo.gif'

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

  const getMascotImg = () => {
    switch (mood) {
      case 'focused':
        return focusedMascot.src
      case 'tired':
        return tiredMascot.src
      default:
        return happyMascot.src
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 h-full flex flex-col justify-center items-center text-center">
      <img 
        src={getMascotImg()} 
        alt="mascot" 
        className="w-24 h-24 mb-4" 
      />
      <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
        {message}
      </p>
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Your focus companion
      </div>
    </div>
  )
}
