#!/bin/bash
# Quick start script for Anti-Brainrot Pomodoro Timer

echo "🧠 Anti-Brainrot Pomodoro Timer - Quick Start"
echo "=============================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

echo "✓ Python and Node.js detected"
echo ""

# Setup Backend
echo "📦 Setting up Backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Created Python virtual environment"
fi
source venv/bin/activate
pip install -q -r requirements.txt
echo "✓ Backend dependencies installed"
cd ..

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install --silent
    echo "✓ Frontend dependencies installed"
else
    echo "✓ Frontend dependencies already installed"
fi
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Backend:  cd backend && source venv/bin/activate && python app.py"
echo "  2. Frontend: cd frontend && npm run dev"
echo "  3. CV (optional): cd cv && source venv/bin/activate && python gaze_detector.py"
echo ""
echo "Then open http://localhost:3000 in your browser"
