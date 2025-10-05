(function() {
  const sessionId = window.CURRENT_SESSION_ID || null;
  if (!sessionId) {
    console.warn('No CURRENT_SESSION_ID set — alert.js will not join a room.');
    return;
  }

  const socket = io(); // adjust if Socket.IO served at a different origin

  // Join the session room on connect
  socket.on('connect', () => {
    socket.emit('join_session', { session_id: sessionId });
    console.log('Socket connected and joined session', sessionId);
  });

  // Load a short sound asset (place alert.mp3 under /static or adjust path)
  const alertAudio = new Audio('/static/alert.mp3');
  alertAudio.preload = 'auto';
  alertAudio.volume = 0.8;

  // Provide an "Enable sound" button for unlocking audio autoplay policies:
  // Add <button id="enable-sound">Enable sound</button> into the page.
  const enableBtn = document.getElementById('enable-sound');
  if (enableBtn) {
    enableBtn.addEventListener('click', async () => {
      try {
        await alertAudio.play();
        alertAudio.pause();
        alertAudio.currentTime = 0;
        enableBtn.style.display = 'none';
        console.log('Audio unlocked');
      } catch (err) {
        console.warn('Unable to unlock audio:', err);
      }
    });
  }

  socket.on('unfocused_alert', (data) => {
    // Play the alert (will succeed if user previously unlocked audio)
    alertAudio.currentTime = 0;
    alertAudio.play().catch(err => {
      console.warn('Play blocked; user must gesture to enable sound', err);
      // Optionally show a visual prompt to click the enable button
    });
    console.log('Received unfocused_alert', data);
  });
})();
