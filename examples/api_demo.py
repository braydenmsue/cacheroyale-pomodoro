#!/usr/bin/env python3
"""
Example script demonstrating API usage for Anti-Brainrot Pomodoro Timer
"""

import requests
import time
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:5000"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def pretty_print(data):
    """Pretty print JSON data"""
    print(json.dumps(data, indent=2))

def test_health_check():
    """Test the health check endpoint"""
    print_section("1. Health Check")
    response = requests.get(f"{API_BASE_URL}/api/health")
    print(f"Status Code: {response.status_code}")
    pretty_print(response.json())
    return response.status_code == 200

def test_start_session():
    """Test starting a new session"""
    print_section("2. Start New Session")
    response = requests.post(f"{API_BASE_URL}/api/start_session")
    print(f"Status Code: {response.status_code}")
    data = response.json()
    pretty_print(data)
    return data.get('session_id')

def test_log_eye_activity(session_id, focused=True):
    """Test logging eye activity"""
    print_section("3. Log Eye Activity")
    payload = {
        "session_id": session_id,
        "gaze_focused": focused
    }
    response = requests.post(
        f"{API_BASE_URL}/api/eye_activity",
        json=payload
    )
    print(f"Status Code: {response.status_code}")
    print(f"Logging: {'Focused' if focused else 'Not Focused'}")
    pretty_print(response.json())

def test_end_session(session_id):
    """Test ending a session"""
    print_section("4. End Session")
    payload = {"session_id": session_id}
    response = requests.post(
        f"{API_BASE_URL}/api/end_session",
        json=payload
    )
    print(f"Status Code: {response.status_code}")
    data = response.json()
    pretty_print(data)
    return data

def test_get_recommendation(session_id):
    """Test getting break recommendation"""
    print_section("5. Get Break Recommendation")
    response = requests.get(
        f"{API_BASE_URL}/api/recommend_interval/{session_id}"
    )
    print(f"Status Code: {response.status_code}")
    data = response.json()
    pretty_print(data)
    return data

def simulate_session():
    """Simulate a complete Pomodoro session"""
    print("\n" + "🧠 " * 20)
    print("Anti-Brainrot Pomodoro Timer - API Demo")
    print("🧠 " * 20)
    
    try:
        # 1. Health check
        if not test_health_check():
            print("❌ Backend is not healthy. Please start the backend server.")
            return
        
        # 2. Start session
        session_id = test_start_session()
        if not session_id:
            print("❌ Failed to start session")
            return
        
        print(f"\n✅ Session started: {session_id}")
        
        # 3. Simulate eye activity during session
        print("\n⏱️  Simulating 10-second work session with eye tracking...")
        
        for i in range(10):
            # Simulate varying focus levels
            focused = i % 3 != 0  # Focused 2 out of 3 times
            test_log_eye_activity(session_id, focused)
            time.sleep(1)
            print(f"  {i+1}/10 seconds elapsed...")
        
        # 4. End session
        session_data = test_end_session(session_id)
        
        print("\n📊 Session Summary:")
        print(f"  Duration: {session_data.get('duration')} seconds")
        print(f"  Eye Activity Score: {session_data.get('eye_activity_score', 0):.2%}")
        
        # 5. Get recommendation
        recommendation = test_get_recommendation(session_id)
        
        print("\n💡 Break Recommendation:")
        print(f"  Recommended Break: {recommendation.get('recommended_break_minutes')} minutes")
        print(f"  ({recommendation.get('recommended_break_seconds')} seconds)")
        
        # Interpret the recommendation
        score = recommendation.get('eye_activity_score', 0)
        if score >= 0.8:
            print("  🎯 Excellent focus! Short break.")
        elif score >= 0.6:
            print("  😊 Good focus! Standard break.")
        elif score >= 0.4:
            print("  😐 Moderate focus. Longer break recommended.")
        else:
            print("  😴 Low focus. Take a good rest!")
        
        print_section("Demo Complete!")
        print("✅ All API endpoints working correctly!")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Cannot connect to backend server")
        print("Make sure the backend is running on http://localhost:5000")
        print("Start it with: cd backend && python app.py")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    simulate_session()
