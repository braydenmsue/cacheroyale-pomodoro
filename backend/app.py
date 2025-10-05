from flask import Flask, request, jsonify, Response, session, redirect, url_for
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import sqlite3
import uuid
from datetime import datetime
import os
import sys
import secrets
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add services to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'services'))
# from gaze_tracker import GazeTracker

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(32))

# Session configuration - use Lax for localhost development
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True

CORS(app,
     supports_credentials=True,
     origins=['http://127.0.0.1:3000'],
     allow_headers=['Content-Type'],
     expose_headers=['Set-Cookie'])
socketio = SocketIO(app, cors_allowed_origins="*")

# Spotify OAuth configuration
SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
# Use localhost - Spotify allows http for localhost in development
SPOTIFY_REDIRECT_URI = os.getenv('SPOTIFY_REDIRECT_URI', 'http://localhost:5000/api/spotify/callback')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

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


@app.route('/api/spotify/login', methods=['GET'])
def spotify_login():
    """Initiate Spotify OAuth flow"""
    scope = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative'

    auth_url = (
        'https://accounts.spotify.com/authorize?'
        f'client_id={SPOTIFY_CLIENT_ID}&'
        f'response_type=code&'
        f'redirect_uri={SPOTIFY_REDIRECT_URI}&'
        f'scope={scope}'
    )

    return redirect(auth_url)


@app.route('/api/spotify/callback', methods=['GET'])
def spotify_callback():
    """Handle Spotify OAuth callback"""
    code = request.args.get('code')
    error = request.args.get('error')

    if error:
        return redirect(f'{FRONTEND_URL}?spotify_error={error}')

    if not code:
        return redirect(f'{FRONTEND_URL}?spotify_error=no_code')

    # Exchange code for access token
    token_url = 'https://accounts.spotify.com/api/token'
    token_data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': SPOTIFY_REDIRECT_URI,
        'client_id': SPOTIFY_CLIENT_ID,
        'client_secret': SPOTIFY_CLIENT_SECRET,
    }

    response = requests.post(token_url, data=token_data)

    if response.status_code != 200:
        return redirect(f'{FRONTEND_URL}?spotify_error=token_exchange_failed')

    token_info = response.json()

    # Store token in session
    session['spotify_access_token'] = token_info.get('access_token')
    session['spotify_refresh_token'] = token_info.get('refresh_token')
    session['spotify_expires_in'] = token_info.get('expires_in')

    # Redirect back to frontend
    return redirect(f'{FRONTEND_URL}?spotify_auth=success')


@app.route('/api/spotify/token', methods=['GET'])
def get_spotify_token():
    """Get Spotify access token from session"""
    access_token = session.get('spotify_access_token')

    if not access_token:
        return jsonify({'error': 'Not authenticated'}), 401

    return jsonify({
        'access_token': access_token,
        'expires_in': session.get('spotify_expires_in')
    })


@app.route('/api/spotify/logout', methods=['POST'])
def spotify_logout():
    """Clear Spotify session"""
    session.pop('spotify_access_token', None)
    session.pop('spotify_refresh_token', None)
    session.pop('spotify_expires_in', None)

    return jsonify({'status': 'logged_out'})


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