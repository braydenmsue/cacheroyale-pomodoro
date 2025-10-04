# Anti-Brainrot Pomodoro Timer - Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│                    http://localhost:3000                         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Timer     │  │    Mascot    │  │SessionStats  │          │
│  │  Component   │  │  Component   │  │  Component   │          │
│  └──────┬───────┘  └──────────────┘  └──────────────┘          │
│         │                                                         │
│         │ API Calls (Axios)                                      │
│         │                                                         │
└─────────┼─────────────────────────────────────────────────────┬─┘
          │                                                       │
          │ HTTP/JSON                                            │
          ▼                                                       │
┌────────────────────────────────────────────┐                   │
│        BACKEND (Flask)                     │                   │
│      http://localhost:5000                 │                   │
│                                             │                   │
│  API Endpoints:                            │                   │
│  • POST /api/start_session                 │                   │
│  • POST /api/end_session                   │                   │
│  • POST /api/eye_activity ◄────────────────┼───────────┐       │
│  • GET  /api/recommend_interval/:id        │           │       │
│  • GET  /api/health                        │           │       │
│                                             │           │       │
│  ┌──────────────────────────────┐          │           │       │
│  │   SQLite Database            │          │           │       │
│  │   - sessions table           │          │           │       │
│  │   - eye_activity table       │          │           │       │
│  └──────────────────────────────┘          │           │       │
│                                             │           │       │
│  Adaptive Break Logic:                     │           │       │
│  • Analyzes eye activity score             │           │       │
│  • Recommends break duration               │           │       │
│    (3-10 minutes)                          │           │       │
└─────────────────────────────────────────────┘           │       │
                                                           │       │
                                              HTTP/JSON    │       │
                                                           │       │
┌──────────────────────────────────────────────────────────┘       │
│          COMPUTER VISION (OpenCV)                                │
│                                                                   │
│  ┌──────────────────────────────────────┐                       │
│  │   OpenCV Gaze Detection              │                       │
│  │   - Face detection (Haar Cascade)    │                       │
│  │   - Eye detection (Haar Cascade)     │                       │
│  │   - Focus status calculation         │                       │
│  │   - Real-time video feed             │                       │
│  └──────────────────────────────────────┘                       │
│                                                                   │
│  Sends gaze_focused data every 5 seconds                        │
└───────────────────────────────────────────────────────────────┘

             ▲
             │
             │ Webcam Input
             │
        ┌────┴────┐
        │ Webcam  │
        └─────────┘
```

## Data Flow

1. **Starting a Session**:
   ```
   User → Frontend Timer → Backend /start_session → Database
   ```

2. **During Session**:
   ```
   Webcam → OpenCV Detection → Backend /eye_activity → Database
   ```

3. **Ending Session**:
   ```
   User → Frontend Timer → Backend /end_session
                        ↓
                    Calculate focus score
                        ↓
                    Backend /recommend_interval
                        ↓
                    Return adaptive break time
                        ↓
   Frontend displays recommended break
   ```

## Technology Stack

| Component | Technologies |
|-----------|-------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Axios |
| Backend | Flask 3.0, Python 3.8+, SQLite, Flask-CORS |
| Computer Vision | OpenCV 4.8, NumPy, Python 3.8+ |
| Development | Node.js 18+, npm, Python venv |

## Database Schema

### sessions table
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER,
    eye_activity_score REAL DEFAULT 0
)
```

### eye_activity table
```sql
CREATE TABLE eye_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    timestamp TIMESTAMP,
    gaze_focused BOOLEAN,
    FOREIGN KEY (session_id) REFERENCES sessions (id)
)
```

## Adaptive Break Algorithm

```python
if eye_activity_score >= 0.8:
    recommended_break = 180  # 3 minutes (high focus)
elif eye_activity_score >= 0.6:
    recommended_break = 300  # 5 minutes (good focus)
elif eye_activity_score >= 0.4:
    recommended_break = 420  # 7 minutes (moderate focus)
else:
    recommended_break = 600  # 10 minutes (low focus)
```

The eye activity score is calculated as:
```
score = focused_detections / total_detections
```

Where:
- `focused_detections`: Number of times both eyes were detected
- `total_detections`: Total number of detection attempts during session
