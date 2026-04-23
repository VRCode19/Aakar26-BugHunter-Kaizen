const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
const axios = require('axios');
const dotenv = require('dotenv');

const cors = require('cors');

// This tells Render: "It's okay to accept requests from my Vercel website"
app.use(cors({
  origin: "*", // During the event, "*" is easiest to avoid errors
  methods: ["GET", "POST"]
}));

// 1. Initialize Configuration
dotenv.config();

/** * RENDER NOTE: 
 * We are checking for a local file first (Secret File approach), 
 * and falling back to the Env Var string (Vercel style) just in case.
 */
let serviceAccount;

try {
  // Option A: Render Secret File (Preferred)
  serviceAccount = require('./firebaseServiceAccount.json');
  console.log('🔥 Firebase connected via Secret File!');
} catch (e) {
  // Option B: Environment Variable string
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('🔥 Firebase connected via Env Var string!');
  } else {
    console.error("❌ ERROR: No Firebase credentials found! Add firebaseServiceAccount.json to Render Secret Files.");
    process.exit(1); // Stop the server if DB can't connect
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 2. Setup Middleware
const app = express();
app.use(cors()); 
app.use(express.json());

// 3. Question Bank
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

app.get('/', (req, res) => {
  res.send('BugHunter Backend is live on Render! 🔥');
});

// Submit Route (SIMULATION MODE)
// Note: Piston API is currently restricted, so we use simulation for testing.
app.post('/api/submit', async (req, res) => {
  const { teamName, questionId, submittedCode } = req.body;
  
  if (!teamName || !questionId || !submittedCode) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const question = questionBank[questionId];
  if (!question) return res.status(404).json({ error: "Question not found" });

  try {
    // Check if the submitted code contains the correct output 
    // (This acts as a placeholder until you have a working compiler API key)
    if (submittedCode.includes(question.expectedOutput)) {
      const teamRef = db.collection('teams').doc(teamName);
      
      await teamRef.set({
        score: admin.firestore.FieldValue.increment(question.points),
        solvedQuestions: admin.firestore.FieldValue.arrayUnion(questionId),
        lastFixed: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      io.emit('score_updated', { teamName, points: question.points });
      return res.json({ success: true, message: "Bug Fixed! Points updated." });
    }

    res.json({ success: false, message: "Incorrect Output. Check your printf logic!" });

  } catch (error) {
    console.error("Submission Error:", error);
    res.status(500).json({ error: "Server Error. Try again!" });
  }
});

app.post('/api/admin/toggle-event', async (req, res) => {
  const { password, status } = req.body;
  if (password === process.env.ADMIN_PASSWORD || password === "your_secret_admin_pass") {
    await db.collection('settings').doc('eventState').set({ isActive: status });
    io.emit('event_status_change', { isActive: status });
    return res.json({ success: true, message: `Event status: ${status}` });
  }
  res.status(401).send("Unauthorized");
});

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

// 6. WebSocket Connection
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

// 7. Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});