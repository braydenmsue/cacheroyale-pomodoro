from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import uuid
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

DATABASE = 'pomodoro.db'

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
    """Log eye activity data from OpenCV"""
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
    
    # Get session data
    cursor.execute('SELECT eye_activity_score, duration FROM sessions WHERE id = ?', (session_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return jsonify({'error': 'Session not found'}), 404
    
    eye_activity_score = row['eye_activity_score'] or 0.5
    duration = row['duration'] or 1500  # Default 25 minutes
    
    # Adaptive logic:
    # - Higher eye activity score (more focused) = shorter break needed
    # - Lower eye activity score (less focused) = longer break needed
    # Base break time: 5 minutes (300 seconds)
    # Range: 3-10 minutes based on focus level
    
    base_break = 300  # 5 minutes
    
    if eye_activity_score >= 0.8:
        # Very focused session - shorter break
        recommended_break = 180  # 3 minutes
    elif eye_activity_score >= 0.6:
        # Good focus - standard break
        recommended_break = 300  # 5 minutes
    elif eye_activity_score >= 0.4:
        # Moderate focus - slightly longer break
        recommended_break = 420  # 7 minutes
    else:
        # Low focus - longer break needed
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
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
