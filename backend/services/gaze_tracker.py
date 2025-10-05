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

    # def start(self):
    #     """Start the webcam"""
    #     print("Starting webcam...")
    #     if self.cap is None or not self.cap.isOpened():
    #         self.cap = cv2.VideoCapture(0)
    #         if not self.cap.isOpened():
    #             print("ERROR: Could not open webcam!")
    #             return False
    #     self.is_running = True
    #     print("Webcam started successfully")
    #     return True
    def start(self):
        print("Starting webcam...")
        if self.cap is None or not self.cap.isOpened():
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                print("ERROR: Could not open webcam!")
                return False

        # Reinitialize FaceMesh if it was closed
        if self.face_mesh is None:
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )

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
        cv2.destroyAllWindows()  # ensures all OpenCV resources are freed
        time.sleep(0.5)
        print("Webcam stopped")

    def detect_gaze_focus(self, face_landmarks, img_w, img_h):
        """
        Detect if user is looking at screen based on iris position
        Uses eye corners for horizontal and eyelids for vertical detection
        Returns: True if focused, False otherwise
        """
        try:
            # Get iris centers
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

            # left_inner = face_landmarks.landmark[133]
            # left_outer = face_landmarks.landmark[33]
            # right_inner = face_landmarks.landmark[362]
            # right_outer = face_landmarks.landmark[263]

            # Get eyelid landmarks for VERTICAL gaze
            left_top = face_landmarks.landmark[159]
            left_bottom = face_landmarks.landmark[145]
            right_top = face_landmarks.landmark[386]
            right_bottom = face_landmarks.landmark[374]

            # --- HORIZONTAL DETECTION (left/right) ---
            left_eye_coords = []
            for idx in self.LEFT_EYE:
                landmark = face_landmarks.landmark[idx]
                left_eye_coords.append([landmark.x, landmark.y])

            right_eye_coords = []
            for idx in self.RIGHT_EYE:
                landmark = face_landmarks.landmark[idx]
                right_eye_coords.append([landmark.x, landmark.y])

            # eye centers
            left_eye_center = np.mean(left_eye_coords, axis=0)
            right_eye_center = np.mean(right_eye_coords, axis=0)

            # eye widths (max - min x coordinate)
            left_eye_width = max([c[0] for c in left_eye_coords]) - min([c[0] for c in left_eye_coords])
            right_eye_width = max([c[0] for c in right_eye_coords]) - min([c[0] for c in right_eye_coords])

            # Horizontal offset from eye center
            left_horizontal_offset = abs(left_iris_center[0] - left_eye_center[0])
            right_horizontal_offset = abs(right_iris_center[0] - right_eye_center[0])

            # convert to ratio & normalize
            left_horizontal_ratio = left_horizontal_offset / left_eye_width if left_eye_width > 0 else 0
            right_horizontal_ratio = right_horizontal_offset / right_eye_width if right_eye_width > 0 else 0

            horizontal_threshold = 0.18  # 18% of eye width
            horizontal_focused = (left_horizontal_ratio < horizontal_threshold and
                                  right_horizontal_ratio < horizontal_threshold)

            # --- VERTICAL DETECTION (up/down) ---
            left_eye_height = abs(left_top.y - left_bottom.y)
            left_iris_from_top = abs(left_iris_center[1] - left_top.y)
            left_vertical_ratio = left_iris_from_top / left_eye_height if left_eye_height > 0 else 0.5

            right_eye_height = abs(right_top.y - right_bottom.y)
            right_iris_from_top = abs(right_iris_center[1] - right_top.y)
            right_vertical_ratio = right_iris_from_top / right_eye_height if right_eye_height > 0 else 0.5

            # Average vertical position (more stable than individual eyes)
            if (left_eye_height + right_eye_height)/2 < 0.0015:
                avg_vertical_ratio = 0
            else:
                avg_vertical_ratio = (left_vertical_ratio + right_vertical_ratio) / 2

            # vertical thresholds:
            # < 0.20: Looking straight up
            # 0.20-0.75: Looking forward
            # > 0.75: Looking down around phone level
            vertical_min = 0.20
            vertical_max = 0.65

            vertical_focused = (vertical_min < avg_vertical_ratio < vertical_max)

            if avg_vertical_ratio == 0:
                focused = False # eyes are closed
            elif avg_vertical_ratio < 0 or avg_vertical_ratio > 1:
                focused = horizontal_focused
            else:
                focused = horizontal_focused and vertical_focused

            return focused

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
            if current_time - self.last_check_time >= 1:
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
            status_text = "FOCUSED" if is_focused else "NOT FOCUSED"
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