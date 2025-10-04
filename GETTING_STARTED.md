# Getting Started with Anti-Brainrot Pomodoro Timer

This guide will help you get the Anti-Brainrot Pomodoro Timer up and running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`

- **Python** (version 3.8 or higher)
  - Download from [python.org](https://python.org/)
  - Verify installation: `python3 --version`

- **Webcam** (optional, for eye tracking feature)
  - Built-in laptop camera or USB webcam

## Quick Start with Setup Script

The easiest way to get started is using our automated setup script:

```bash
# Clone the repository
git clone https://github.com/braydenmsue/cacheroyale-pomodoro.git
cd cacheroyale-pomodoro

# Run the setup script
chmod +x setup.sh
./setup.sh
```

This script will:
- Create Python virtual environments
- Install all backend dependencies
- Install all frontend dependencies

## Manual Setup

If you prefer to set up components manually:

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python app.py
```

The backend will start on `http://localhost:5000`

### 2. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:3000`

### 3. Computer Vision Setup (Optional)

Open a third terminal window:

```bash
# Navigate to CV directory
cd cv

# Create a virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment example
cp .env.example .env

# Edit .env and add your session ID (you'll get this from the frontend)
# nano .env

# Start the eye tracking
python gaze_detector.py
```

## Using the Application

### Starting Your First Session

1. **Open the Frontend**
   - Navigate to `http://localhost:3000` in your web browser
   - You should see the Anti-Brainrot Pomodoro Timer interface

2. **Grant Notification Permissions**
   - Click "Allow" when prompted for notification permissions
   - This enables break time alerts

3. **Start a Pomodoro Session**
   - Click the "Start" button
   - The timer will begin counting down from 25 minutes
   - You can pause or reset the timer anytime

4. **Enable Eye Tracking** (Optional)
   - After starting a session, copy the session ID from the developer console (F12)
   - Paste it in the CV terminal when prompted
   - The eye tracking window will open
   - Keep the window visible during your session

5. **Complete Your Session**
   - Work until the timer reaches 00:00
   - You'll receive a notification for break time
   - The system will recommend an adaptive break duration
   - Take your break!

6. **Resume Work**
   - After the break timer completes
   - Start a new session to continue working

## Configuration

### Frontend Configuration

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend Configuration

The backend uses SQLite by default (no configuration needed). The database file `pomodoro.db` will be created automatically.

### CV Configuration

Create a `.env` file in the `cv` directory:

```env
BACKEND_URL=http://localhost:5000
SESSION_ID=your-session-id-here
```

## Docker Deployment (Advanced)

If you prefer to use Docker:

```bash
# Make sure Docker and Docker Compose are installed

# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError: No module named 'flask'`
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

**Problem**: Port 5000 already in use
```bash
# Find and kill the process using port 5000
# On macOS/Linux:
lsof -ti:5000 | xargs kill -9
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend Issues

**Problem**: `Cannot find module 'next'`
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Port 3000 already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

### CV Issues

**Problem**: Webcam not detected
- Check if another application is using the camera
- Try changing camera index in `gaze_detector.py` (line with `cv2.VideoCapture(0)`)
- Grant camera permissions in system settings

**Problem**: `ModuleNotFoundError: No module named 'cv2'`
```bash
cd cv
source venv/bin/activate
pip install opencv-python
```

## Testing the API

You can test the backend API using curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Start a session
curl -X POST http://localhost:5000/api/start_session

# End a session (replace SESSION_ID)
curl -X POST http://localhost:5000/api/end_session \
  -H "Content-Type: application/json" \
  -d '{"session_id":"SESSION_ID"}'

# Get recommendation (replace SESSION_ID)
curl http://localhost:5000/api/recommend_interval/SESSION_ID
```

## Development Mode vs Production

### Development Mode
- Hot reload enabled
- Debug logging
- CORS enabled for all origins
- Detailed error messages

### Production Mode
To run in production:

```bash
# Backend
cd backend
source venv/bin/activate
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Frontend
cd frontend
npm run build
npm start
```

## Next Steps

- Read the [Architecture Documentation](ARCHITECTURE.md) to understand the system
- Check [CONTRIBUTING.md](CONTRIBUTING.md) if you want to contribute
- Explore the API endpoints and customize the timer settings
- Join the community and share your feedback

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review the [README.md](README.md) for additional info
3. Open an issue on GitHub with details about your problem

Happy focusing! 🧠⏱️
