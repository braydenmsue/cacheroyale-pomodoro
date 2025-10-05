'use client'

import { useState, useEffect } from 'react'
import focusedMascot from '../assets/capoo-capoo-type-transparent.gif'
import happyMascot from '../assets/happy-capoo.gif'
import tiredMascot from '../assets/tired-capoo.gif'

interface MascotProps {
  sessionActive: boolean
  isFocused: boolean
  isPaused: boolean
}

export default function Mascot({ sessionActive, isFocused, isPaused }: MascotProps) {
  const [mood, setMood] = useState<'happy' | 'focused' | 'tired'>('happy')
  const [message, setMessage] = useState('Ready to work!')
  const [health, setHealth] = useState(100)

  // Can adjust these values for difficulty
  const damageAmount = 10;
  const healAmount = 5;

  useEffect(() => {
    let healthInterval: NodeJS.Timeout;

    if (sessionActive && !isPaused) {
      if (isFocused) {
        healthInterval = setInterval(() => {
          setHealth((prev) => Math.min(prev + healAmount, 100));
        }, 1000)
      } else {
        healthInterval = setInterval(() => {
          setHealth((prev) => Math.max(prev - damageAmount, 0));
        }, 1000)
      }
    }
    return () => clearInterval(healthInterval)
  }, [sessionActive, isFocused, isPaused])

  useEffect(() => {
    if (health === 0) {
      alert('Mascot died! Restarting the timer...');
      // Logic to restart the timer
      setHealth(100); // Reset health
    }
  }, [health]);

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

  useEffect(() => {
    if (health >= 50 && sessionActive) {
      setMood('focused')
      setMessage('You\'re doing great! Stay focused!')
    } else if (health < 50 && sessionActive) {
      setMood('tired')
      setMessage('Stay focused, you can do it!')
    }
    else {
      setMood('happy')
      setMessage('Ready to work!')
    }
  }, [sessionActive, health])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 h-full flex flex-col justify-center items-center text-center">
      <img 
        src={getMascotImg()} 
        alt="mascot" 
        className="border w-full mb-4 hover:animate-bounce" 
      />
      <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
        {message}
      </p>
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Your focus companion
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-10 mb-10">
        <div 
          className={`h-10 rounded-full transition-all duration-500 ease-in-out ${health > 50 ? 'bg-green-500' : health > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} 
          style={{ width: `${health}%` }} 
        />
      </div>
    </div>
  )
}
