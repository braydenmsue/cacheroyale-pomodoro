# Anti-Brainrot Pomodoro Timer

Keep your brain in check! 🧠  
A smart Pomodoro timer with a little companion that reacts to your focus. Work hard, play nice with your attention, and let your friendly mascot guide your productivity.

---

## 🎯 Features

- **Adaptive Breaks** – Short breaks if you’re crushing it, longer ones if your focus dips
- **Eye Tracking (automated)** – MediaPipe-powered gaze detection handled by the backend
- **Companion System** – Your mascot loses health if you lose focus; if it dies, the timer resets
- **Session Stats** – Track your productivity over time
- **Desktop Notifications** – Know when it’s time to focus or take a break
- **Modern UI** – Clean, responsive interface built with Next.js + Tailwind CSS

---

## 🏗️ How It’s Built

### Frontend (`/frontend`)
- **Stack:** Next.js 14 + TypeScript + Tailwind CSS
- **Components:**
  - Timer + start/pause/reset controls
  - Animated companion showing health and mood
  - Session stats dashboard
- **Backend Integration:** REST API calls to Flask

### Backend (`/backend`)
- **Stack:** Flask + SQLite
- **Features:**
  - Automatic gaze tracking via `GazeTracker` (MediaPipe)
  - Companion health system & adaptive Pomodoro logic
  - REST endpoints to start/stop sessions, log eye activity, get recommendations
- **Database:** Local SQLite for sessions and eye activity logs

### Computer Vision (`/backend/gaze_tracker.py`)
- **Stack:** Python + MediaPipe
- **What it does:**
  - Detects if you’re looking at the screen
  - Updates backend about focus automatically
  - Drives companion health logic and adaptive intervals

---

## 📁 Project Structure
cacheroyale-pomodoro/
├── frontend/
│ ├── app/
│ ├── components/
│ ├── lib/
│ ├── utils/
│ └── package.json
├── backend/
│ ├── app.py
│ ├── services
│ └── pomodoro.db
└── README.md



---

## 🚀 Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🧠 How Adaptive Breaks Work

- **80%+ Focus:** 3-minute break (you’re on fire!)  
- **60–80% Focus:** 5-minute break (steady)  
- **40–60% Focus:** 7-minute break (take it easy)  
- **<40% Focus:** 10-minute break (time for a reset)

> Keep an eye on your companion — if it dies, your Pomodoro timer resets.

---

## 🔮 Future Ideas

- User accounts + cloud sync  
- Mobile companion app  
- Personalized ML-driven break recommendations  
- Spotify integration for focus music  
- Team/collaboration features  
- Custom companion skins and animations  
- Focus streaks and rewards system  
- Integration with calendar apps for smarter scheduling

---

## 📁 Project Structure
cacheroyale-pomodoro/
├── backend/
│ ├── services/
│ │ ├── init.py
│ │ └── gaze_tracker.py
│ ├── app.py
│ ├── pomodoro.db
│ └── requirements.txt
├── frontend/
│ ├── app/
│ │ ├── globals.css
│ │ ├── layout.tsx
│ │ └── page.tsx
│ └── components/
│ ├── EyeTracking.tsx
│ ├── Mascot.tsx
│ ├── SessionStats.tsx
│ └── SpotifyPlayer.tsx
└── README.md

## 🧠 How Adaptive Breaks Work

- **80%+ Focus:** 3-minute break (you’re on fire!)  
- **60–80% Focus:** 5-minute break (steady)  
- **40–60% Focus:** 7-minute break (take it easy)  
- **<40% Focus:** 10-minute break (time for a reset)

> Keep an eye on your companion — if it dies, your Pomodoro timer resets.

---

## 🔮 Future Ideas

- User accounts + cloud sync  
- Mobile companion app  
- Personalized ML-driven break recommendations  
- Spotify integration for focus music  
- Team/collaboration features  
- Custom companion skins and animations  
- Focus streaks and rewards system  
- Integration with calendar apps for smarter scheduling

---

## 📁 Project Structure

