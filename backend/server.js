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

// ---(PISTON API) ---
app.post('/api/submit', async (req, res) => {
  const { teamName, questionId, submittedCode } = req.body;
  const question = questionBank[questionId];

  try {
    // 1. Send code to Piston API (No key needed!)
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: 'c',
      version: '10.2.0', // GCC version
      files: [
        {
          content: submittedCode
        }
      ]
    });

    const { run } = response.data;
    const actualOutput = run.stdout.trim();

    // 2. Logic: Compare the output
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

    // 3. If failed, send back the error or the wrong output
    res.json({ 
      success: false, 
      message: run.stderr ? "Compilation Error" : "Incorrect Output", 
      error: run.stderr || `Got: ${actualOutput}` 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Execution Server Busy. Try again!" });
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

//leaderboard route to fetch top teams

app.get('/api/leaderboard', async (req, res) => {
  try {
    const teamsSnapshot = await db.collection('teams')
      .orderBy('score', 'desc')
      .orderBy('lastFixed', 'asc') // Tie-breaker: who solved it first?
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