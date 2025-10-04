# Examples

This directory contains example scripts and usage demonstrations for the Anti-Brainrot Pomodoro Timer.

## API Demo Script

The `api_demo.py` script demonstrates how to interact with the backend API programmatically.

### Running the Demo

1. **Start the backend server**:
   ```bash
   cd backend
   source venv/bin/activate
   python app.py
   ```

2. **Run the demo script**:
   ```bash
   python examples/api_demo.py
   ```

### What the Demo Does

The script simulates a complete Pomodoro session:

1. ✅ Checks backend health
2. 🚀 Starts a new session
3. 👁️ Logs simulated eye activity (10 seconds)
4. 🛑 Ends the session
5. 💡 Gets adaptive break recommendation

### Expected Output

```
🧠 Anti-Brainrot Pomodoro Timer - API Demo

============================================================
  1. Health Check
============================================================
Status Code: 200
{
  "service": "anti-brainrot-pomodoro-backend",
  "status": "healthy"
}

... (more output) ...

📊 Session Summary:
  Duration: 10 seconds
  Eye Activity Score: 60.00%

💡 Break Recommendation:
  Recommended Break: 5.0 minutes
  😊 Good focus! Standard break.

✅ All API endpoints working correctly!
```

## Creating Your Own Integration

You can use this script as a starting point for:

- Desktop notification apps
- CLI tools
- Browser extensions
- Mobile apps
- Third-party integrations

### Basic Integration Example

```python
import requests

API_URL = "http://localhost:5000"

# Start session
response = requests.post(f"{API_URL}/api/start_session")
session_id = response.json()['session_id']

# During work session
requests.post(f"{API_URL}/api/eye_activity", json={
    "session_id": session_id,
    "gaze_focused": True
})

# End session
response = requests.post(f"{API_URL}/api/end_session", json={
    "session_id": session_id
})

# Get recommendation
response = requests.get(f"{API_URL}/api/recommend_interval/{session_id}")
break_time = response.json()['recommended_break_minutes']
print(f"Take a {break_time} minute break!")
```

## More Examples Coming Soon

- [ ] JavaScript/Node.js integration
- [ ] React custom hooks
- [ ] Discord bot integration
- [ ] Slack bot integration
- [ ] CLI pomodoro tool
- [ ] System tray application

## Contributing Examples

If you create a useful integration or example, please contribute it back!

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.
