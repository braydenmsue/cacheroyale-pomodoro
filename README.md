# Anti-Brainrot Pomodoro Timer

A smart Pomodoro timer with adaptive break intervals based on eye-tracking and focus detection. Stay productive and avoid burnout with intelligent break recommendations.

## 🎯 Features

- **Adaptive Break Intervals**: Break duration adjusts based on your focus level during work sessions
- **Eye Tracking**: OpenCV-powered gaze detection monitors your attention
- **Focus Companion**: Friendly mascot provides encouragement and feedback
- **Session Statistics**: Track your productivity over time
- **Desktop Notifications**: Get alerts when it's time for a break or to resume work
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## 🏗️ Architecture

### Frontend (`/frontend`)
- **Stack**: Next.js 14 + TypeScript + Tailwind CSS
- **Components**:
  - Timer UI with start/pause/reset controls
  - Animated mascot companion
  - Session statistics dashboard
  - Notification system
- **API Integration**: Axios-based API client for backend communication

### Backend (`/backend`)
- **Stack**: Flask + SQLite
- **Endpoints**:
  - `POST /api/start_session` - Start a new Pomodoro session
  - `POST /api/end_session` - End current session
  - `POST /api/eye_activity` - Log eye tracking data
  - `GET /api/recommend_interval/<session_id>` - Get adaptive break recommendation
  - `GET /api/health` - Health check
- **Database**: SQLite with tables for sessions and eye activity logs
- **Adaptive Logic**: Calculates break intervals based on focus score (3-10 minutes)

### Computer Vision (`/cv`)
- **Stack**: OpenCV + Python
- **Features**:
  - Real-time face and eye detection
  - Gaze focus analysis
  - Periodic data transmission to backend
- **Visualization**: Live video feed with detection overlays

## 📋 Prerequisites

- Node.js 18+ (for frontend)
- Python 3.8+ (for backend and CV)
- Webcam (for eye tracking)

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`

### 3. Computer Vision Setup (Optional)

```bash
cd cv
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set session ID (get from frontend after starting a session)
export SESSION_ID=your-session-id  # On Windows: set SESSION_ID=your-session-id
python gaze_detector.py
```

## 📖 Usage

1. **Start a Session**:
   - Open the frontend at `http://localhost:3000`
   - Click "Start" to begin a 25-minute focus session
   - The backend creates a session and tracks your activity

2. **Enable Eye Tracking** (Optional):
   - Start the OpenCV script with your session ID
   - The system monitors your gaze and logs focus data
   - Keep the CV window open during your session

3. **Complete Session**:
   - When the timer ends, the system calculates your focus score
   - You'll receive a break recommendation (3-10 minutes)
   - Higher focus = shorter break, lower focus = longer break

4. **Take Your Break**:
   - The timer automatically starts your adaptive break
   - Notifications remind you when to resume work

## 🧠 Adaptive Break Logic

The system uses eye activity data to recommend break intervals:

- **80%+ Focus**: 3-minute break (you're in the zone!)
- **60-80% Focus**: 5-minute break (standard)
- **40-60% Focus**: 7-minute break (need a bit more rest)
- **<40% Focus**: 10-minute break (time for a longer reset)

## 📁 Project Structure

```
cacheroyale-pomodoro/
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── Timer.tsx
│   │   ├── Mascot.tsx
│   │   └── SessionStats.tsx
│   ├── lib/
│   │   └── api.ts
│   ├── utils/
│   │   └── time.ts
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .gitignore
├── cv/
│   ├── gaze_detector.py
│   ├── requirements.txt
│   └── .gitignore
└── README.md
```

## 🔌 API Documentation

### Start Session
```http
POST /api/start_session
Response: { "session_id": "uuid", "start_time": "ISO8601", "status": "started" }
```

### End Session
```http
POST /api/end_session
Body: { "session_id": "uuid" }
Response: { "session_id": "uuid", "duration": 1500, "eye_activity_score": 0.75 }
```

### Log Eye Activity
```http
POST /api/eye_activity
Body: { "session_id": "uuid", "gaze_focused": true }
Response: { "status": "logged", "timestamp": "ISO8601" }
```

### Get Break Recommendation
```http
GET /api/recommend_interval/<session_id>
Response: { 
  "recommended_break_seconds": 300,
  "recommended_break_minutes": 5,
  "eye_activity_score": 0.75
}
```

## 🛠️ Development

### Frontend Development
```bash
cd frontend
npm run dev     # Start dev server
npm run build   # Build for production
npm run lint    # Run ESLint
```

### Backend Development
```bash
cd backend
# Activate virtual environment
python app.py   # Run with debug mode
```

### CV Development
```bash
cd cv
# Activate virtual environment
python gaze_detector.py  # Run eye tracking
```

## 🧪 Testing

The application can be tested without a webcam - the backend will still function and provide default break recommendations. Eye tracking enhances the experience but is not required.

## 🎨 Customization

- **Work Duration**: Modify timer default in `frontend/components/Timer.tsx`
- **Break Logic**: Adjust adaptive algorithm in `backend/app.py` `recommend_interval()`
- **Detection Interval**: Change `DETECTION_INTERVAL` in `cv/gaze_detector.py`
- **UI Theme**: Customize colors in `frontend/tailwind.config.js`

## 📝 License

MIT License - Feel free to use and modify for your needs

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 🐛 Troubleshooting

**Frontend can't connect to backend**: 
- Ensure backend is running on port 5000
- Check CORS settings in `backend/app.py`

**Webcam not detected**:
- Verify webcam permissions
- Check if another app is using the camera
- Try a different camera index in `cv2.VideoCapture(0)`

**Database errors**:
- Delete `pomodoro.db` and restart backend to reinitialize

## 🔮 Future Enhancements

- [ ] User authentication and profiles
- [ ] Cloud sync for cross-device stats
- [ ] Machine learning for personalized recommendations
- [ ] Mobile app version
- [ ] Integration with calendar apps
- [ ] Spotify/focus music integration
- [ ] Team/collaboration features