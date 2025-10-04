import cv2
import numpy as np
import time
import requests
import os
from datetime import datetime

# Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')
SESSION_ID = None
DETECTION_INTERVAL = 5  # Check every 5 seconds

# Load pre-trained face and eye cascade classifiers
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

def detect_gaze_focus(frame):
    """
    Detect if user is looking at the screen based on face and eye detection
    Returns: True if focused (eyes detected), False otherwise
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Detect faces
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    if len(faces) == 0:
        return False
    
    # Check for eyes in detected face regions
    for (x, y, w, h) in faces:
        roi_gray = gray[y:y+h, x:x+w]
        eyes = eye_cascade.detectMultiScale(roi_gray, 1.1, 5)
        
        # If both eyes are detected, consider user as focused
        if len(eyes) >= 2:
            return True
    
    return False

def send_eye_activity(session_id, gaze_focused):
    """Send eye activity data to backend"""
    try:
        response = requests.post(
            f'{BACKEND_URL}/api/eye_activity',
            json={
                'session_id': session_id,
                'gaze_focused': gaze_focused
            },
            timeout=5
        )
        return response.json()
    except Exception as e:
        print(f"Error sending eye activity: {e}")
        return None

def main():
    """Main function to run gaze detection"""
    global SESSION_ID
    
    print("Anti-Brainrot Pomodoro - Eye Tracking Module")
    print("=" * 50)
    
    # Get session ID from user or environment
    SESSION_ID = os.getenv('SESSION_ID')
    if not SESSION_ID:
        SESSION_ID = input("Enter session ID (or press Enter to use test mode): ").strip()
        if not SESSION_ID:
            SESSION_ID = "test-session"
            print(f"Using test session ID: {SESSION_ID}")
    
    # Initialize webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open webcam")
        return
    
    print("\nStarting eye tracking...")
    print("Press 'q' to quit\n")
    
    last_check_time = time.time()
    frame_count = 0
    focused_count = 0
    
    while True:
        ret, frame = cap.read()
        
        if not ret:
            print("Error: Could not read frame")
            break
        
        frame_count += 1
        current_time = time.time()
        
        # Check gaze focus every DETECTION_INTERVAL seconds
        if current_time - last_check_time >= DETECTION_INTERVAL:
            is_focused = detect_gaze_focus(frame)
            
            if is_focused:
                focused_count += 1
            
            # Send to backend
            result = send_eye_activity(SESSION_ID, is_focused)
            
            # Display status
            status = "FOCUSED ✓" if is_focused else "NOT FOCUSED ✗"
            focus_percentage = (focused_count / (frame_count / (DETECTION_INTERVAL * 30))) * 100 if frame_count > 0 else 0
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Status: {status} | Focus: {focus_percentage:.1f}%")
            
            last_check_time = current_time
        
        # Draw detection visualization
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
            roi_gray = gray[y:y+h, x:x+w]
            roi_color = frame[y:y+h, x:x+w]
            eyes = eye_cascade.detectMultiScale(roi_gray)
            
            for (ex, ey, ew, eh) in eyes:
                cv2.rectangle(roi_color, (ex, ey), (ex+ew, ey+eh), (0, 255, 0), 2)
        
        # Add text overlay
        cv2.putText(frame, f"Session: {SESSION_ID[:8]}...", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(frame, "Press 'q' to quit", (10, 60), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Display the frame
        cv2.imshow('Anti-Brainrot Eye Tracking', frame)
        
        # Exit on 'q' key
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    print("\nEye tracking stopped")

if __name__ == '__main__':
    main()
