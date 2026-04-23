const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
const axios = require('axios'); // ADDED THIS: Necessary for Piston API
const dotenv = require('dotenv');

// 1. Initialize Configuration
dotenv.config();
const serviceAccount = require('./firebaseServiceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
console.log('🔥 Firebase securely connected!');

// 2. Setup Middleware (Order is critical!)
const app = express();
app.use(cors()); 
app.use(express.json()); // This allows the server to read your JSON requests

// 3. Question Bank (Define this before the routes use it)
const questionBank = {
  "q1": {
    id: "q1",
    points: 10,
    expectedOutput: "Hello World",
    initialCode: "#include <stdio.h>\nint main() { printf(\"Hello Wordl\"); return 0; }" 
  }
};

// 4. Server & Socket Initialization
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// 5. API ROUTES

// Root Check
app.get('/', (req, res) => {
  res.send('BugHunter Backend is live with Firebase! 🔥');
});

// Submit Route (Piston API)
app.post('/api/submit', async (req, res) => {
  const { teamName, questionId, submittedCode } = req.body;
  
  if (!teamName || !questionId || !submittedCode) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const question = questionBank[questionId];

  try {
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: 'c',
      version: '*', // Use '*' to grab whatever stable GCC version they have
      files: [{ content: submittedCode }]
    }, {
      // Adding a User-Agent header sometimes bypasses 401 blocks on public APIs
      headers: {
        'User-Agent': 'BugHunter-App-VTU' 
      }
    });

    const { run } = response.data;

    // Check if Piston actually executed the code
    if (run.stdout !== undefined) {
      const actualOutput = run.stdout.trim();

      if (actualOutput === question.expectedOutput.trim()) {
        const teamRef = db.collection('teams').doc(teamName);
        await teamRef.set({
          score: admin.firestore.FieldValue.increment(question.points),
          solvedQuestions: admin.firestore.FieldValue.arrayUnion(questionId),
          lastFixed: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        io.emit('score_updated', { teamName, points: question.points });
        return res.json({ success: true, message: "Bug Fixed! Points updated." });
      }

      return res.json({ 
        success: false, 
        message: run.stderr ? "Compilation Error" : "Incorrect Output", 
        error: run.stderr || `Got: ${actualOutput}` 
      });
    }

    res.status(500).json({ error: "Piston execution failed" });

  } catch (error) {
    // This will help us see the EXACT reason for the 401
    console.error("Piston Details:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Compiler API Error. Check console." });
  }
});

// Admin Kill Switch
app.post('/api/admin/toggle-event', async (req, res) => {
  const { password, status } = req.body;
  if (password === "your_secret_admin_pass") {
    await db.collection('settings').doc('eventState').set({ isActive: status });
    io.emit('event_status_change', { isActive: status });
    return res.json({ success: true, message: `Event status: ${status}` });
  }
  res.status(401).send("Unauthorized");
});

// Leaderboard Route
app.get('/api/leaderboard', async (req, res) => {
  try {
    const teamsSnapshot = await db.collection('teams')
      .orderBy('score', 'desc')
      .orderBy('lastFixed', 'asc')
      .limit(50)
      .get();

    const leaderboard = [];
    teamsSnapshot.forEach(doc => {
      leaderboard.push({ name: doc.id, ...doc.data() });
    });
    res.json(leaderboard);
  } catch (error) {
    res.status(500).send("Error fetching leaderboard");
  }
});

// 6. WebSocket Connection Logic
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

// 7. Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});