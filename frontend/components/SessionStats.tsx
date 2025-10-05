'use client'

import { useState, useEffect } from 'react'

interface Stats {
  totalSessions: number
  totalFocusTime: number
  averageSession: number
  todaySessions: number
  averageFocusScore: number
  bestFocusScore: number
}

export default function SessionStats() {
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalFocusTime: 0,
    averageSession: 0,
    todaySessions: 0,
    averageFocusScore: 0,
    bestFocusScore: 0
  })

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/stats", {
        credentials: "include",
      });
      const data = await res.json();
      setStats(data);
      console.log("Stats updated:", data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }

  useEffect(() => {
    // Fetch stats on mount
    fetchStats();

    // Listen for session completion events
    const handleSessionComplete = () => {
      console.log("Session complete event received, refreshing stats...");
      fetchStats();
    };

    window.addEventListener('sessionComplete', handleSessionComplete);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('sessionComplete', handleSessionComplete);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
        📊 Session Stats
      </h3>

      <div className="space-y-4 flex-1 flex flex-col justify-center">
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

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Avg Focus Score:</span>
          <span className="text-2xl font-bold text-primary">{stats.averageFocusScore}%</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Best Focus Score:</span>
          <span className="text-2xl font-bold text-primary">{stats.bestFocusScore}%</span>
        </div>
      </div>
    </div>
  )
}