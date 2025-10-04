'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface Stats {
  totalSessions: number
  totalFocusTime: number
  averageSession: number
  todaySessions: number
}

export default function SessionStats() {
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalFocusTime: 0,
    averageSession: 0,
    todaySessions: 0,
  })

  useEffect(() => {
    // In a real app, fetch stats from backend
    // For now, using placeholder data
    setStats({
      totalSessions: 0,
      totalFocusTime: 0,
      averageSession: 25,
      todaySessions: 0,
    })
  }, [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
        📊 Session Stats
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Today's Sessions:</span>
          <span className="text-2xl font-bold text-primary">{stats.todaySessions}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Total Sessions:</span>
          <span className="text-2xl font-bold text-primary">{stats.totalSessions}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Focus Time:</span>
          <span className="text-2xl font-bold text-primary">
            {Math.round(stats.totalFocusTime / 60)}m
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Avg Session:</span>
          <span className="text-2xl font-bold text-primary">{stats.averageSession}m</span>
        </div>
      </div>
    </div>
  )
}
