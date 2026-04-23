const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
const axios = require('axios');
const dotenv = require('dotenv');

// 1. Initialize Configuration
dotenv.config();

// 2. Initialize Express App
const app = express();

// 3. Setup Middleware
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST"]
}));
app.use(express.json());

// 4. Firebase Setup
let serviceAccount;
try {
  serviceAccount = require('./firebaseServiceAccount.json');
  console.log('🔥 Firebase connected via Secret File!');
} catch (e) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('🔥 Firebase connected via Env Var string!');
  } else {
    console.error("❌ ERROR: No Firebase credentials found!");
    process.exit(1); 
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 5. Question Bank (Expand this to 10 questions before the event!)
const questionBank = {
  "q1": {
    id: "q1",
    points: 10,
    expectedOutput: "Hello World",
    initialCode: "#include <stdio.h>\nint main() { printf(\"Hello World\"); return 0; }" 
  },
  "q2": {
    id: "q2",
    points: 20,
    expectedOutput: "15",
    initialCode: "// Fix the loop to sum numbers 1 to 5\n#include <stdio.h>\nint main() { int s=0; for(int i=0; i<5; i++) s+=i; printf(\"%d\", s); return 0; }"
  }
};

// 6. Submit Rate Limiter (Protects Piston API)
const rateLimit = require('express-rate-limit');
const submitLimiter = rateLimit({
  windowMs: 5 * 1000, 
  max: 1, 
  message: { error: "Wait 5 seconds between attempts!" }
});
app.use('/api/submit', submitLimiter);

// 7. Server & Socket Initialization
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});
// Make io accessible in our Express routes
app.set('io', io);

// ==========================================
//                 API ROUTES
// ==========================================

app.get('/', (req, res) => {
  res.send('BugHunter Backend is live on Render! 🔥');
});

// AUTO-REGISTER & LOGIN ROUTE
app.post('/api/login', async (req, res) => {
  const { teamName, password } = req.body;

  if (!teamName || !password) {
    return res.status(400).json({ success: false, message: "Missing team name or password" });
  }

  // Optional: Sanitize team name (prevent super long names from breaking your UI)
  if (teamName.length > 20) {
    return res.status(400).json({ success: false, message: "Team name is too long! Keep it under 20 characters." });
  }

  try {
    const teamRef = db.collection('teams').doc(teamName);
    const doc = await teamRef.get();

    if (!doc.exists) {
      // 🌟 NEW TEAM REGISTRATION 🌟
      const newTeamData = {
        password: password, 
        score: 0,
        hasLoggedIn: true,
        solvedQuestions: []
      };

      // Save to Firebase
      await teamRef.set(newTeamData);

      // Broadcast to the Leaderboard
      io.emit('team_joined', { teamName: teamName, score: 0 });

      delete newTeamData.password; 
      return res.json({ 
        success: true, 
        message: "New team registered and logged in!", 
        team: { name: teamName, ...newTeamData } 
      });

    } else {
      // 🔄 EXISTING TEAM LOGIN 🔄
      const teamData = doc.data();

      if (teamData.password === password) {
        // Correct password
        await teamRef.set({ hasLoggedIn: true }, { merge: true });
        io.emit('team_joined', { teamName: teamName, score: teamData.score || 0 });
        
        delete teamData.password;
        return res.json({ 
          success: true, 
          message: "Welcome back!", 
          team: { name: teamName, ...teamData } 
        });
      } else {
        // Wrong password
        return res.status(401).json({ 
          success: false, 
          message: "Team name already taken, or incorrect password!" 
        });
      }
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});

// LEADERBOARD ROUTE
app.get('/api/leaderboard', async (req, res) => {
  try {
    const teamsSnapshot = await db.collection('teams')
      .where('hasLoggedIn', '==', true) 
      .orderBy('score', 'desc')
      .orderBy('lastFixed', 'asc')
      .limit(50)
      .get();

    const leaderboard = [];
    teamsSnapshot.forEach(doc => {
      const data = doc.data();
      leaderboard.push({ 
        name: doc.id, 
        score: data.score || 0,
        lastFixed: data.lastFixed ? data.lastFixed.toDate() : null
      });
    });

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({ success: false, message: "Error fetching leaderboard" });
  }
});

// SUBMIT ROUTE (With Piston & Anti-Cheat)
app.post('/api/submit', async (req, res) => {
  const { teamName, questionId, submittedCode } = req.body;
  
  if (!teamName || !questionId || !submittedCode) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const question = questionBank[questionId];
  if (!question) return res.status(404).json({ error: "Question not found" });

  try {
    // Check Firebase FIRST to prevent double-dipping
    const teamRef = db.collection('teams').doc(teamName);
    const teamDoc = await teamRef.get();
    
    if (!teamDoc.exists) return res.status(404).json({ error: "Team not found" });
    const teamData = teamDoc.data();

    // 🛑 ANTI-CHEAT
    if (teamData.solvedQuestions && teamData.solvedQuestions.includes(questionId)) {
      return res.json({ 
        success: false, 
        message: "Nice try! You already fixed this bug. Move on to the next one!" 
      });
    }

    // Call Piston API
    const pistonResponse = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: 'c',
      version: '*', 
      files: [{ name: "main.c", content: submittedCode }]
    });

    const { run, compile } = pistonResponse.data;

    if (compile && compile.code !== 0) {
      return res.json({ success: false, message: "Compilation Error", error: compile.stderr });
    }

    if (run && run.stdout !== undefined) {
      const actualOutput = run.stdout.trim(); 
      const expectedOutput = question.expectedOutput.trim();

      if (actualOutput === expectedOutput) {
        
        // 🎉 Update Database
        await teamRef.set({
          score: admin.firestore.FieldValue.increment(question.points),
          solvedQuestions: admin.firestore.FieldValue.arrayUnion(questionId),
          lastFixed: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        io.emit('score_updated', { teamName, points: question.points });

        // 🏆 VICTORY CHECK
        if (teamData.solvedQuestions && teamData.solvedQuestions.length === 9) {
           console.log(`🏆 ${teamName} HAS COMPLETED ALL 10 BUGS!`);
           io.emit('team_finished_all', { teamName: teamName });
        }
        
        return res.json({ success: true, message: "Bug Fixed! Points updated." });
      } else {
        return res.json({ 
          success: false, 
          message: "Incorrect Output", 
          error: `Expected: '${expectedOutput}', but got: '${actualOutput}'` 
        });
      }
    }
    res.status(500).json({ error: "Execution failed. No output returned." });

  } catch (error) {
    console.error("Piston API Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Compiler Server is busy. Try again in 5 seconds." });
  }
});

// ==========================================
//            WEBSOCKET CONNECTIONS
// ==========================================

io.on('connection', (socket) => {
  console.log(`📡 New screen connected: ${socket.id}`);
  
  // 🚨 ANTI-CHEAT: Penalty for switching tabs
  socket.on('tab_switch_violation', async (data) => {
    if (!data || !data.teamName) return;
    
    console.log(`🚨 CHEATING DETECTED: ${data.teamName} tabbed out!`);
    
    try {
      const teamRef = db.collection('teams').doc(data.teamName);
      
      // Deduct 5 points!
      await teamRef.set({
        score: admin.firestore.FieldValue.increment(-5)
      }, { merge: true });

      // Tell the big screen to flash a penalty warning
      io.emit('score_updated', { 
        teamName: data.teamName, 
        points: -5,
        message: "Penalty applied for switching tabs!"
      });
    } catch (error) {
      console.error("Error applying penalty:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

// ==========================================
//               START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});