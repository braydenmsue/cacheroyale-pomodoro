# Contributing to Anti-Brainrot Pomodoro Timer

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cacheroyale-pomodoro.git
   cd cacheroyale-pomodoro
   ```
3. **Set up the development environment**:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

## Development Workflow

### Making Changes

1. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines below

3. **Test your changes** locally:
   - Start the backend: `cd backend && source venv/bin/activate && python app.py`
   - Start the frontend: `cd frontend && npm run dev`
   - Test the CV module if relevant: `cd cv && python gaze_detector.py`

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## Code Style Guidelines

### Frontend (TypeScript/React)

- Use functional components with hooks
- Follow the existing component structure
- Use TypeScript for type safety
- Follow Next.js best practices
- Use Tailwind CSS for styling
- Run `npm run lint` before committing

Example component structure:
```typescript
'use client'

import { useState, useEffect } from 'react'

interface ComponentProps {
  prop1: string
  prop2: number
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  const [state, setState] = useState('')
  
  return (
    <div className="container">
      {/* JSX content */}
    </div>
  )
}
```

### Backend (Python/Flask)

- Follow PEP 8 style guide
- Use descriptive variable names
- Add docstrings to functions
- Handle errors gracefully
- Return appropriate HTTP status codes

Example endpoint:
```python
@app.route('/api/endpoint', methods=['POST'])
def endpoint_handler():
    """Brief description of what this endpoint does"""
    data = request.json
    
    # Validate input
    if not data.get('required_field'):
        return jsonify({'error': 'required_field is missing'}), 400
    
    # Process request
    result = process_data(data)
    
    return jsonify(result)
```

### Computer Vision (Python/OpenCV)

- Document detection algorithms
- Handle camera errors gracefully
- Optimize for performance
- Add comments for complex logic

## Project Structure

```
cacheroyale-pomodoro/
├── frontend/          # Next.js frontend
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   ├── lib/          # Utility libraries
│   └── utils/        # Helper functions
├── backend/          # Flask backend
│   └── app.py        # Main Flask application
├── cv/               # OpenCV module
│   └── gaze_detector.py  # Eye tracking script
└── README.md         # Main documentation
```

## Areas for Contribution

### High Priority
- [ ] User authentication system
- [ ] Statistics dashboard improvements
- [ ] Mobile responsiveness enhancements
- [ ] Better error handling and user feedback
- [ ] Unit and integration tests

### Features
- [ ] Multiple timer presets (custom work/break durations)
- [ ] Sound notifications
- [ ] Dark/light theme toggle
- [ ] Export statistics to CSV
- [ ] Integration with task management apps
- [ ] Multiple session profiles

### Computer Vision
- [ ] Improved gaze detection accuracy
- [ ] Head pose estimation
- [ ] Blink detection for screen fatigue
- [ ] Multiple camera support
- [ ] GPU acceleration

### Backend
- [ ] PostgreSQL support
- [ ] Redis caching
- [ ] User profiles and history
- [ ] RESTful API improvements
- [ ] WebSocket support for real-time updates

### Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Video tutorials
- [ ] Deployment guides (Docker, cloud platforms)
- [ ] Troubleshooting guide

## Testing

### Frontend Testing
```bash
cd frontend
npm run lint        # Run ESLint
npm run build       # Test production build
```

### Backend Testing
```bash
cd backend
source venv/bin/activate
python -m pytest    # Run tests (when available)
python app.py       # Manual testing
```

### Integration Testing
1. Start backend on port 5000
2. Start frontend on port 3000
3. Test complete user flow
4. Verify API communication
5. Check error handling

## Reporting Issues

When reporting issues, please include:

1. **Description**: Clear description of the issue
2. **Steps to reproduce**: Detailed steps to reproduce the problem
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**:
   - OS (Windows/Mac/Linux)
   - Node.js version
   - Python version
   - Browser (for frontend issues)
6. **Screenshots**: If applicable

## Feature Requests

For feature requests:

1. Check if the feature has already been requested
2. Describe the feature and its benefits
3. Provide examples or mockups if possible
4. Explain why it would be useful to users

## Questions?

If you have questions:

- Check the [README](README.md) and [ARCHITECTURE](ARCHITECTURE.md) docs
- Open an issue with the "question" label
- Reach out to the maintainers

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the community

Thank you for contributing! 🎉
