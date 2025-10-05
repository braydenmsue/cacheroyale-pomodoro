import cv2
import mediapipe as mp
import numpy as np
import time
from datetime import datetime


class GazeTracker:
    def __init__(self):
        self.cap = None
        self.is_running = False
        self.last_check_time = time.time()
        self.focused_count = 0
        self.total_checks = 0

        # MediaPipe setup
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

        # Iris and eye landmarks
        self.LEFT_IRIS = [474, 475, 476, 477]
        self.RIGHT_IRIS = [469, 470, 471, 472]
        self.LEFT_EYE = [362, 385, 387, 263, 373, 380]
        self.RIGHT_EYE = [33, 160, 158, 133, 153, 144]

    def start(self):
        """Start the webcam"""
        print("Starting webcam...")
        if self.cap is None or not self.cap.isOpened():
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                print("ERROR: Could not open webcam!")
                return False
        self.is_running = True
        print("Webcam started successfully")
        return True

    def stop(self):
        """Stop the webcam"""
        print("Stopping webcam...")
        self.is_running = False
        if self.cap:
            self.cap.release()
            self.cap = None
        print("Webcam stopped")

    def detect_gaze_focus(self, face_landmarks, img_w, img_h):
        """
        Detect if user is looking at screen based on iris position
        Returns: True if focused, False otherwise
        """
        try:
            # Get iris positions
            left_iris_coords = []
            for idx in self.LEFT_IRIS:
                landmark = face_landmarks.landmark[idx]
                left_iris_coords.append([landmark.x, landmark.y])

            right_iris_coords = []
            for idx in self.RIGHT_IRIS:
                landmark = face_landmarks.landmark[idx]
                right_iris_coords.append([landmark.x, landmark.y])

            if not left_iris_coords or not right_iris_coords:
                return False

            # Calculate iris centers
            left_iris_center = np.mean(left_iris_coords, axis=0)
            right_iris_center = np.mean(right_iris_coords, axis=0)

            # Get eye boundaries
            left_eye_coords = []
            for idx in self.LEFT_EYE:
                landmark = face_landmarks.landmark[idx]
                left_eye_coords.append([landmark.x, landmark.y])

            right_eye_coords = []
            for idx in self.RIGHT_EYE:
                landmark = face_landmarks.landmark[idx]
                right_eye_coords.append([landmark.x, landmark.y])

            # Calculate if iris is centered (looking at screen)
            left_eye_center = np.mean(left_eye_coords, axis=0)
            right_eye_center = np.mean(right_eye_coords, axis=0)

            # Calculate distance from iris to eye center
            left_distance = np.linalg.norm(left_iris_center - left_eye_center)
            right_distance = np.linalg.norm(right_iris_center - right_eye_center)

            # If both irises are relatively centered, user is focused
            threshold = 0.02  # Adjust based on testing
            return left_distance < threshold and right_distance < threshold

        except Exception as e:
            print(f"Error detecting gaze: {e}")
            return False

    def generate_frames(self, session_id, socketio_instance):
        """Generate video frames with gaze tracking overlay"""
        print(f"Starting frame generation for session {session_id}")

        # Make sure camera is started
        if not self.start():
            print("Failed to start camera in generate_frames")
            return

        frame_count = 0
        while self.is_running:
            if self.cap is None or not self.cap.isOpened():
                print("Camera not available")
                break

            ret, frame = self.cap.read()
            if not ret:
                print("Failed to read frame")
                break

            frame_count += 1
            if frame_count % 30 == 0:
                print(f"Generated {frame_count} frames")

            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            rgb_frame = cv2.cvtColor(rgb_frame, cv2.COLOR_GRAY2RGB)
            img_h, img_w = frame.shape[:2]

            results = self.face_mesh.process(rgb_frame)

            is_focused = False

            if results.multi_face_landmarks:
                face_landmarks = results.multi_face_landmarks[0]

                # Detect if user is focused
                is_focused = self.detect_gaze_focus(face_landmarks, img_w, img_h)

                # Draw iris tracking
                for idx in self.LEFT_IRIS:
                    landmark = face_landmarks.landmark[idx]
                    x = int(landmark.x * img_w)
                    y = int(landmark.y * img_h)
                    cv2.circle(frame, (x, y), 2, (0, 255, 0), -1)

                for idx in self.RIGHT_IRIS:
                    landmark = face_landmarks.landmark[idx]
                    x = int(landmark.x * img_w)
                    y = int(landmark.y * img_h)
                    cv2.circle(frame, (x, y), 2, (0, 255, 0), -1)

                # Draw eye outlines
                for idx in self.LEFT_EYE + self.RIGHT_EYE:
                    landmark = face_landmarks.landmark[idx]
                    x = int(landmark.x * img_w)
                    y = int(landmark.y * img_h)
                    cv2.circle(frame, (x, y), 1, (255, 0, 0), -1)

            # Check if we should send update (every 5 seconds)
            current_time = time.time()
            if current_time - self.last_check_time >= 5:
                self.total_checks += 1
                if is_focused:
                    self.focused_count += 1

                # Emit to WebSocket
                focus_percentage = (self.focused_count / self.total_checks * 100) if self.total_checks > 0 else 0
                socketio_instance.emit('gaze_update', {
                    'session_id': str(session_id),
                    'is_focused': bool(is_focused),
                    'focus_percentage': float(focus_percentage),
                    'timestamp': datetime.now().isoformat()
                })

                print(f"Gaze update: focused={is_focused}, percentage={focus_percentage:.1f}%")

                self.last_check_time = current_time

            # Add overlay
            status_text = "FOCUSED ✓" if is_focused else "NOT FOCUSED ✗"
            status_color = (0, 255, 0) if is_focused else (0, 0, 255)
            cv2.putText(frame, status_text, (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)

            focus_pct = (self.focused_count / self.total_checks * 100) if self.total_checks > 0 else 0
            cv2.putText(frame, f"Focus: {focus_pct:.1f}%", (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

            cv2.putText(frame, f"Session: {session_id[:8]}...", (10, 90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

            # Encode frame
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                print("Failed to encode frame")
                continue

            frame_bytes = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        print("Frame generation ended")