import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const api = {
  async startSession() {
    const response = await apiClient.post('/api/start_session')
    return response.data
  },

  async endSession(sessionId: string) {
    const response = await apiClient.post('/api/end_session', { session_id: sessionId })
    return response.data
  },

  async logEyeActivity(sessionId: string, gazeFocused: boolean) {
    const response = await apiClient.post('/api/eye_activity', {
      session_id: sessionId,
      gaze_focused: gazeFocused,
    })
    return response.data
  },

  async getRecommendedInterval(sessionId: string) {
    const response = await apiClient.get(`/api/recommend_interval/${sessionId}`)
    return response.data.recommended_break_seconds
  },
}
