const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let timers = {};

// Serve static files from 'public' directory
app.use(express.static('public'));

// Endpoint to create a new timer
app.get('/create-timer', (req, res) => {
  const timerId = uuidv4(); // Generate unique timer ID
  timers[timerId] = { time: 0, running: false }; // Initialize timer state
  res.json({ timerId });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // User joins a timer room
  socket.on('joinTimer', (timerId) => {
    socket.join(timerId);
    socket.emit('timerUpdate', timers[timerId]); // Send current timer state to new user

    // Start the timer
    socket.on('startTimer', () => {
      if (timers[timerId] && !timers[timerId].running) {
        timers[timerId].running = true;
        io.to(timerId).emit('timerStarted'); // Notify all users in the room
        console.log(`Timer ${timerId} started`); // Debug log
      }
    });

    // Stop the timer
    socket.on('stopTimer', () => {
      if (timers[timerId] && timers[timerId].running) {
        timers[timerId].running = false;
        io.to(timerId).emit('timerStopped'); // Notify all users in the room
        console.log(`Timer ${timerId} stopped`); // Debug log
      }
    });
  });
});

// Update timers every second
setInterval(() => {
  for (const [id, timer] of Object.entries(timers)) {
    if (timer.running) {
      timer.time += 1; // Increment time
      io.to(id).emit('timerUpdate', timer); // Broadcast updated time to users in this room
      console.log(`Timer ${id} updated to ${timer.time}`); // Debug log
    }
  }
}, 1000);

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});