import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getDbStatus } from './config/db.js';
import taskRoutes from './routes/tasks.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize Database connection (attempts MongoDB, falls back to JSON files)
connectDB();

// API Endpoints
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'Online',
    database: getDbStatus(),
    timestamp: new Date()
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory registry of active socket connections in rooms:
// key = socketId, value = { id, nickname, room, avatar, status }
const activeUsers = {};

io.on('connection', (socket) => {
  console.log(`Socket connection established: ${socket.id}`);

  // Handle joining a virtual study room
  socket.on('joinRoom', ({ nickname, room, avatar }) => {
    socket.join(room);
    
    activeUsers[socket.id] = {
      id: socket.id,
      nickname,
      room,
      avatar: avatar || '🧑‍🎓',
      status: 'Idle 💤' // States: "Focusing 🎯", "Resting ☕", "Idle 💤"
    };

    console.log(`User ${nickname} joined room: ${room}`);

    // Broadcast updated users list to everyone in the room
    const roomUsers = Object.values(activeUsers).filter(u => u.room === room);
    io.to(room).emit('roomUsers', roomUsers);

    // Broadcast system arrival alert
    io.to(room).emit('message', {
      system: true,
      text: `${nickname} has joined the room.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  // Handle update to user's Pomodoro focus state
  socket.on('updateStatus', (status) => {
    const user = activeUsers[socket.id];
    if (user) {
      user.status = status;
      const roomUsers = Object.values(activeUsers).filter(u => u.room === user.room);
      io.to(user.room).emit('roomUsers', roomUsers);
    }
  });

  // Handle a new chat message
  socket.on('chatMessage', (text) => {
    const user = activeUsers[socket.id];
    if (user) {
      const msg = {
        nickname: user.nickname,
        avatar: user.avatar,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      io.to(user.room).emit('message', msg);
    }
  });

  // Handle cheering emoji broadcasts
  socket.on('sendCheer', ({ emoji }) => {
    const user = activeUsers[socket.id];
    if (user) {
      io.to(user.room).emit('cheer', {
        nickname: user.nickname,
        emoji
      });
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    const user = activeUsers[socket.id];
    if (user) {
      console.log(`User ${user.nickname} disconnected`);
      socket.leave(user.room);
      delete activeUsers[socket.id];

      // Broadcast updated room users list
      const roomUsers = Object.values(activeUsers).filter(u => u.room === user.room);
      io.to(user.room).emit('roomUsers', roomUsers);

      // Broadcast system departure alert
      io.to(user.room).emit('message', {
        system: true,
        text: `${user.nickname} has left the room.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Express and Socket.io server running on port ${PORT} 🚀`);
});
