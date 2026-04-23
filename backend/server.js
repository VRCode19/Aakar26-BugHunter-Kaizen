const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');

// 1. Initialize Firebase Admin
// This points to the secret JSON file you just downloaded
const serviceAccount = require('./firebaseServiceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
console.log('🔥 Firebase securely connected!');

// 2. Server & Socket Setup
const app = express();
app.use(cors()); 
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// 3. API Routes
app.get('/', (req, res) => {
  res.send('BugHunter Backend is live with Firebase! 🔥');
});

// Example route: Check Firebase connection by adding a test document
app.post('/api/test-db', async (req, res) => {
  try {
    const docRef = await db.collection('test').add({
      message: 'Hello from Node.js!',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true, docId: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. WebSockets (Real-time)
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

// 5. Start Up
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


// --- QUESTION BANK (Placeholders) ---
const questionBank = {
  "q1": {
    id: "q1",
    points: 10,
    expectedOutput: "Hello World",
    initialCode: "#include <stdio.h>\nint main() {\n  printf(\"Hello Wordl\"); // BUG: Typo here\n  return 0;\n}"
  },
  // ... you will add 9 more here
};

// --- API ROUTES ---

// Submit Code for Debugging
app.post('/api/submit', async (req, res) => {
  const { teamName, questionId, submittedCode, submittedOutput } = req.body;

  // 1. Check if event is still active (Kill-switch check)
  const settings = await db.collection('settings').doc('eventState').get();
  if (!settings.data()?.isActive) {
    return res.status(403).json({ message: "Event is closed by Admin!" });
  }

  const question = questionBank[questionId];

  // 2. Simple logic: If output matches exactly, they get points
  if (submittedOutput.trim() === question.expectedOutput.trim()) {
    const teamRef = db.collection('teams').doc(teamName);
    
    // Update score in Firestore
    await teamRef.set({
      score: admin.firestore.FieldValue.increment(question.points),
      lastSubmission: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 3. Broadcast new score to everyone for the real-time leaderboard
    io.emit('score_updated', { teamName, newPoints: question.points });

    return res.json({ success: true, message: "Bug Fixed! +10 Points." });
  } else {
    return res.json({ success: false, message: "Output mismatch. Keep debugging!" });
  }
});

//Kill switch for Admin to end the event

app.post('/api/admin/toggle-event', async (req, res) => {
  const { password, status } = req.body;
  
  if (password === "your_secret_admin_pass") { // Use a real pass later
    await db.collection('settings').doc('eventState').set({ isActive: status });
    
    // Tell all connected teams to lock/unlock
    io.emit('event_status_change', { isActive: status });
    
    return res.json({ success: true, message: `Event status: ${status}` });
  }
  res.status(401).send("Unauthorized");
});