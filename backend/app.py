from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import sqlite3
import uuid
from datetime import datetime
import os
import sys

# Add services to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'services'))
# from gaze_tracker import GazeTracker

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

DATABASE = 'pomodoro.db'

# Global tracker instance
active_sessions = {}


def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables"""
    conn = get_db()
    cursor = conn.cursor()

    # Sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            start_time TIMESTAMP,
            end_time TIMESTAMP,
            duration INTEGER,
            eye_activity_score REAL DEFAULT 0
        )
    ''')

    # Eye activity logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS eye_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            timestamp TIMESTAMP,
            gaze_focused BOOLEAN,
            FOREIGN KEY (session_id) REFERENCES sessions (id)
        )
    ''')

    conn.commit()
    conn.close()


@app.route('/api/start_session', methods=['POST'])
def start_session():
    """Start a new pomodoro session"""
    session_id = str(uuid.uuid4())
    start_time = datetime.now()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO sessions (id, start_time) VALUES (?, ?)',
        (session_id, start_time)
    )
    conn.commit()
    conn.close()

    return jsonify({
        'session_id': session_id,
        'start_time': start_time.isoformat(),
        'status': 'started'
    })


@app.route('/api/start_tracking', methods=['POST'])
def start_tracking():
    """Start eye tracking for a session"""
    data = request.json
    session_id = data.get('session_id', 'default-session')

    tracker.start()
    active_sessions[session_id] = {
        'started_at': datetime.now().isoformat(),
        'is_active': True
    }

    return jsonify({
        'status': 'started',
        'session_id': session_id
    })


@app.route('/api/stop_tracking', methods=['POST'])
def stop_tracking():
    """Stop eye tracking"""
    tracker.stop()
    return jsonify({'status': 'stopped'})


@app.route('/api/video_feed/<session_id>')
def video_feed(session_id):
    """Stream video feed with eye tracking"""
    return Response(tracker.generate_frames(session_id, socketio),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/api/end_session', methods=['POST'])
def end_session():
    """End a pomodoro session"""
    data = request.json
    session_id = data.get('session_id')

    if not session_id:
        return jsonify({'error': 'session_id required'}), 400

    end_time = datetime.now()

    conn = get_db()
    cursor = conn.cursor()

    # Get session start time
    cursor.execute('SELECT start_time FROM sessions WHERE id = ?', (session_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({'error': 'Session not found'}), 404

    start_time = datetime.fromisoformat(row['start_time'])
    duration = int((end_time - start_time).total_seconds())

    # Calculate eye activity score
    cursor.execute(
        'SELECT COUNT(*) as total, SUM(CASE WHEN gaze_focused THEN 1 ELSE 0 END) as focused FROM eye_activity WHERE session_id = ?',
        (session_id,)
    )
    activity_row = cursor.fetchone()

    eye_activity_score = 0
    if activity_row['total'] > 0:
        eye_activity_score = activity_row['focused'] / activity_row['total']

    # Update session
    cursor.execute(
        'UPDATE sessions SET end_time = ?, duration = ?, eye_activity_score = ? WHERE id = ?',
        (end_time, duration, eye_activity_score, session_id)
    )
    conn.commit()
    conn.close()

    return jsonify({
        'session_id': session_id,
        'end_time': end_time.isoformat(),
        'duration': duration,
        'eye_activity_score': eye_activity_score,
        'status': 'completed'
    })


@app.route('/api/eye_activity', methods=['POST'])
def log_eye_activity():
    """Log eye activity data"""
    data = request.json
    session_id = data.get('session_id')
    gaze_focused = data.get('gaze_focused', False)

    if not session_id:
        return jsonify({'error': 'session_id required'}), 400

    timestamp = datetime.now()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO eye_activity (session_id, timestamp, gaze_focused) VALUES (?, ?, ?)',
        (session_id, timestamp, gaze_focused)
    )
    conn.commit()
    conn.close()

    return jsonify({
        'status': 'logged',
        'timestamp': timestamp.isoformat()
    })


@app.route('/api/recommend_interval/<session_id>', methods=['GET'])
def recommend_interval(session_id):
    """Calculate recommended break interval based on adaptive logic"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT eye_activity_score, duration FROM sessions WHERE id = ?', (session_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({'error': 'Session not found'}), 404

    eye_activity_score = row['eye_activity_score'] or 0.5

    if eye_activity_score >= 0.8:
        recommended_break = 180  # 3 minutes
    elif eye_activity_score >= 0.6:
        recommended_break = 300  # 5 minutes
    elif eye_activity_score >= 0.4:
        recommended_break = 420  # 7 minutes
    else:
        recommended_break = 600  # 10 minutes

    conn.close()

    return jsonify({
        'session_id': session_id,
        'recommended_break_seconds': recommended_break,
        'recommended_break_minutes': recommended_break / 60,
        'eye_activity_score': eye_activity_score
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'anti-brainrot-pomodoro-backend'})


if __name__ == '__main__':
    # Create services directory if it doesn't exist
    os.makedirs('services', exist_ok=True)
    # Create __init__.py for services package
    open('services/__init__.py', 'a').close()

    from services.gaze_tracker import GazeTracker  # import inside main
    tracker = GazeTracker()                        # create tracker here
    init_db()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)