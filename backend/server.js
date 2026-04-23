const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load secret variables from .env
dotenv.config();

const app = express();
app.use(cors()); 
app.use(express.json());

// --- CONNECT TO MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB securely connected!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- SERVER & SOCKET SETUP ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // We'll lock this down later for security
    methods: ["GET", "POST"]
  }
});

// --- API ROUTES ---
app.get('/', (req, res) => {
  res.send('BugHunter Backend is live! 🐛');
});

// --- WEBSOCKETS (Real-time) ---
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

// --- START UP ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});