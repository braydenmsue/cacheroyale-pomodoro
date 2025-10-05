'use client'

import { useState, useEffect } from 'react'
import focusedMascot from '../assets/capoo-capoo-type-transparent.gif'
import happyMascot from '../assets/happy-capoo.gif'
import tiredMascot from '../assets/tired-capoo.gif'
import deadMascot from '../assets/dead-capoo.png'
import InfoBubble from './InfoBubble'
import infoButton from '../assets/info.png'
import { PetDescription } from '../lib/constants'

interface MascotProps {
  sessionActive: boolean
  isFocused: boolean
  isPaused: boolean
  isBreak: boolean
}

export default function Mascot({ sessionActive, isFocused, isPaused, isBreak }: MascotProps) {
  const [mood, setMood] = useState<'happy' | 'focused' | 'tired' | 'dead'>('happy')
  const [message, setMessage] = useState('Ready to work!')
  const [health, setHealth] = useState(100)
  const [showInfo, setShowInfo] = useState(false)
  const [showDeathPopup, setShowDeathPopup] = useState(false)

  // Config
  const damageAmount = 60
  const healAmount = 1
  const gracePeriod = 3000 // 3 seconds
  let unfocusedTimer: NodeJS.Timeout | null = null

  const toggleInfoBubble = () => setShowInfo(prev => !prev)

  // Health logic
  useEffect(() => {
    let healthInterval: NodeJS.Timeout

    if (sessionActive && !isPaused && health > 0) {
      if (isFocused) {
        if (unfocusedTimer) {
          clearTimeout(unfocusedTimer)
          unfocusedTimer = null
        }
        healthInterval = setInterval(() => {
          setHealth(prev => Math.min(prev + healAmount, 100))
        }, 1000)
      } else {
        if (!unfocusedTimer) {
          unfocusedTimer = setTimeout(() => {
            healthInterval = setInterval(() => {
              setHealth(prev => Math.max(prev - damageAmount, 0))
            }, 1000)
          }, gracePeriod)
        }
      }
    }

    return () => {
      clearInterval(healthInterval)
      if (unfocusedTimer) clearTimeout(unfocusedTimer)
    }
  }, [sessionActive, isFocused, isPaused, health])

  // Death handler
  useEffect(() => {
    if (health === 0) {
      setMood('dead')
      setMessage("💀 I'm dead... restart to save me!")
      setShowDeathPopup(true)

      // Play alarm once
      const audio = new Audio('/alarm.wav')
      audio.volume = 1.0
      audio.play().catch(err => console.error('Audio error:', err))

      return () => {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [health])

  // Reset health if new session starts
  useEffect(() => {
    if (!sessionActive) {
      setHealth(100)
      setMood('happy')
      setShowDeathPopup(false)
    }
  }, [sessionActive])

  const getMascotImg = () => {
    switch (mood) {
      case 'focused':
        return focusedMascot.src
      case 'tired':
        return tiredMascot.src
      case 'dead':
        return deadMascot.src
      default:
        return happyMascot.src
    }
  }

  // Mood changes
  useEffect(() => {
    if (health > 50 && sessionActive && !isBreak) {
      setMood('focused')
      setMessage("You're doing great! Stay focused!")
    } else if (health > 0 && health <= 50 && sessionActive) {
      setMood('tired')
      setMessage("I'm crashing out... focus up!")
    } else if (isBreak) {
      setMood('happy')
      setMessage('Enjoy your break!')
    } else if (!sessionActive && health > 0) {
      setMood('happy')
      setMessage('Ready to work!')
    }
  }, [sessionActive, health, isBreak])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 h-full flex flex-col justify-center items-center text-center relative">
      <h1 className="text-2xl font-bold mb-2 text-gray-700 dark:text-gray-200">
        Meet Pomi!
      </h1>

      {!sessionActive && (
        <img
          src={infoButton.src}
          alt="info"
          className="w-6 h-6 mb-2 cursor-pointer"
          onClick={toggleInfoBubble}
        />
      )}

      {showInfo && !sessionActive && (
        <div className="absolute">
          <InfoBubble>{PetDescription}</InfoBubble>
        </div>
      )}

      <img src={getMascotImg()} alt="mascot" className="border w-full mb-4 rounded-lg" />

      <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{message}</p>

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">Your focus companion</div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-10 mb-10">
        <div
          className={`flex items-center justify-center h-10 rounded-full transition-all duration-500 ease-in-out ${
            health > 50 ? 'bg-green-500' : health > 20 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${health}%` }}
        >
          <span className="text-white font-bold">{health}%</span>
        </div>
      </div>

      {/* Death Popup */}
      {showDeathPopup && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-red-600">💔 Pomi has died</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Oh no! Pomi couldn’t handle the distractions.  
              Restart the timer to bring Pomi back to life.
              Would you like to honor Pomi's sacrifice by donating to charity?
            </p>
            <a
              href="https://www.charitynavigator.org" // example charity link
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Donate Now
            </a>
            <button
              onClick={() => setShowDeathPopup(false)}
              className="ml-4 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
