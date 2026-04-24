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

// 5. Question Bank (Edit these 10 questions before the event!)
const questionBank = {
  "q1": {
    id: "q1",
    points: 10,
    testInput: "5",
    expectedOutput: "1\n12\n123\n1234\n12345",
    initialCode: `#include <stdio.h>\n\n/*\nInstruction:\nThis program is intentionally buggy.\nFind and fix the bug so it prints the correct number pattern.\n\nInput:\nOne positive integer n.\n\nExpected output for n = 5:\n1\n12\n123\n1234\n12345\n\nDebug task:\nCheck the inner loop condition carefully. The pattern is missing one value in each row.\n*/\n\nint main(void) {\n    int n, i, j;\n\n    scanf("%d", &n);\n\n    for (i = 1; i <= n; i++) {\n        for (j = 1; j < i; j++) {\n            printf("%d", j);\n        }\n        printf("\\n");\n    }\n\n    return 0;\n}`
  },
  "q2": {
    id: "q2",
    points: 20,
    expectedOutput: "15",
    initialCode: "// Fix the loop to sum numbers 1 to 5\n#include <stdio.h>\nint main() { int s=0; for(int i=0; i<5; i++) s+=i; printf(\"%d\", s); return 0; }"
  }
};

// Auto-generate placeholders for q3 to q10. Overwrite these directly in the object above when you have the real questions!
for(let i = 3; i <= 10; i++) {
  questionBank[`q${i}`] = {
    id: `q${i}`,
    points: i * 10,
    expectedOutput: `expected_output_${i}`, // The exact output piston should return
    initialCode: `// Write starter code for q${i} here\n`
  };
}

// 6. Submit Rate Limiter
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

// Helper for compiling code using Godbolt API
async function executeWithGodbolt(code, stdinStr) {
  try {
    const data = {
      source: code,
      compiler: "cg132",
      options: {
        userArguments: "",
        executeParameters: { args: [], stdin: stdinStr || "" },
        compilerOptions: { executorRequest: true },
        filters: { execute: true },
        tools: []
      },
      lang: "c",
      allowStoreCodeDebug: true
    };
    const config = {
      method: 'post',
      url: 'https://godbolt.org/api/compiler/cg132/compile',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      data: data,
      timeout: 15000
    };
    const res = await axios(config);
    const d = res.data;

    // Check if build failed
    if (d.buildResult && d.buildResult.code !== 0) {
      const buildErr = (d.buildResult.stderr || []).map(item => item.text).join('\n');
      return { actualOutput: null, compilerErrorStr: buildErr || "Compilation Error" };
    }

    // Check if execution happened
    if (d.didExecute) {
      const outArr = (d.stdout || []).map(item => item.text).join('\n');
      const errArr = (d.stderr || []).map(item => item.text).join('\n');
      // If there's stderr but also stdout, include both
      if (errArr && !outArr) {
        return { actualOutput: null, compilerErrorStr: errArr };
      }
      return { actualOutput: outArr, compilerErrorStr: null };
    } else {
      // Build succeeded but didn't execute (shouldn't happen with executorRequest)
      const buildStderr = (d.buildResult?.stderr || []).map(item => item.text).join('\n');
      return { actualOutput: null, compilerErrorStr: buildStderr || "Build succeeded but execution failed" };
    }
  } catch (error) {
    console.error("Godbolt failed:", error.message);
    return { actualOutput: null, compilerErrorStr: null }; // Pass through to failsafe
  }
}

app.get('/', (req, res) => {
  res.send('BugHunter Backend is live on Render! 🔥');
});

// AUTO-REGISTER & LOGIN ROUTE
app.post('/api/login', async (req, res) => {
  const { teamName, password } = req.body;

  if (!teamName || !password) {
    return res.status(400).json({ success: false, message: "Missing team name or password" });
  }

  if (password !== 'Kaizen2026') {
    return res.status(401).json({ success: false, message: "Incorrect password!" });
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
        solvedQuestions: [],
        lastFixed: admin.firestore.FieldValue.serverTimestamp()
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
        const updateData = { hasLoggedIn: true };
        if (!teamData.lastFixed) {
          updateData.lastFixed = admin.firestore.FieldValue.serverTimestamp();
        }
        await teamRef.set(updateData, { merge: true });
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
    const teamsSnapshot = await db.collection('teams').get();

    const leaderboard = [];
    teamsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.hasLoggedIn) {
        leaderboard.push({ 
          name: doc.id, 
          score: data.score || 0,
          solved: (data.solvedQuestions && data.solvedQuestions.length) || 0,
          lastFixed: data.lastFixed ? data.lastFixed.toDate() : new Date(0)
        });
      }
    });

    leaderboard.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.lastFixed - b.lastFixed;
    });

    res.json({ success: true, leaderboard: leaderboard.slice(0, 50) });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({ success: false, message: "Error fetching leaderboard" });
  }
});

// RUN ROUTE (Compile & Execute via Godbolt)
app.post('/api/run', async (req, res) => {
  const { teamName, questionId, submittedCode } = req.body;
  
  if (!teamName || !questionId || !submittedCode) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const question = questionBank[questionId];
  if (!question) return res.status(404).json({ error: "Question not found" });

  try {
    let actualOutput = null;
    let compilerErrorStr = null;

    const inputToUse = req.body.customInput !== undefined ? req.body.customInput : question.testInput;
    const gbResult = await executeWithGodbolt(submittedCode, inputToUse);
    if (gbResult.actualOutput !== null || gbResult.compilerErrorStr !== null) {
      actualOutput = gbResult.actualOutput;
      compilerErrorStr = gbResult.compilerErrorStr;
    }

    if (compilerErrorStr) {
      return res.json({ success: true, message: "Compilation Error", output: compilerErrorStr });
    }

    if (actualOutput !== null) {
      return res.json({ success: true, message: "Execution Complete", output: actualOutput });
    } else {
      return res.json({ success: false, error: "Execution failed across all backends. Please try again." });
    }
  } catch (error) {
    console.error("Run Error:", error);
    res.status(500).json({ error: "System failure. Could not run execution." });
  }
});

// SUBMIT ROUTE (Compile, Validate & Submit for Approval)
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

    // Compile & execute via Godbolt
    let actualOutput = null;
    let compilerErrorStr = null;

    const gbResult = await executeWithGodbolt(submittedCode, question.testInput);
    if (gbResult.actualOutput !== null || gbResult.compilerErrorStr !== null) {
      actualOutput = gbResult.actualOutput;
      compilerErrorStr = gbResult.compilerErrorStr;
    }

    // API 4: Failsafe Regex Match (Guarantees Event Success)
    if (actualOutput === null && compilerErrorStr === null) {
        console.log("All APIs failed! Using Failsafe Regex Mathing...");
        const codeClean = submittedCode.replace(/\s+/g, '');
        let isRegexCorrect = false;
        if (questionId === 'q1' && codeClean.includes('j<=i')) isRegexCorrect = true;
        else if (questionId === 'q2' && (codeClean.includes('i<=5') || codeClean.includes('s+=i;s+=5'))) isRegexCorrect = true;
        
        if (isRegexCorrect) {
          actualOutput = question.expectedOutput.trim();
        } else {
          return res.json({ success: false, message: "Incorrect Syntax", error: "Your code doesn't exactly fix the bug. Try adjusting your syntax." });
        }
    }

    if (compilerErrorStr) {
      return res.json({ success: false, message: "Compilation Error", error: compilerErrorStr });
    }

    const expectedOutput = question.expectedOutput.trim();

    const cleanOut = actualOutput ? actualOutput.replace(/\s+/g, '') : '';
    const cleanExp = expectedOutput ? expectedOutput.replace(/\s+/g, '') : '';

    if (cleanOut === cleanExp) {
      // 🎉 Create Pending Approval instead of Auto-Updating Database
      await teamRef.set({
        pendingApproval: {
          questionId: questionId,
          code: submittedCode,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });

      io.emit('new_approval_request', { teamName, questionId });
      
      return res.json({ success: true, message: "Code output is correct! Waiting for Admin approval..." });
    } else {
      const actualOutputText = actualOutput.substring(0, 100);
      return res.json({ 
        success: false, 
        message: "Incorrect Output", 
        error: `Output did not match expected result.\nReceived: '${actualOutputText}'` 
      });
    }

  } catch (error) {
    console.error("Ultimate Compiler Catch Error:", error);
    res.status(500).json({ error: "System failure. Could not process submission." });
  }
});

// ==========================================
//            ADMIN APPROVALS
// ==========================================

app.get('/api/approvals', async (req, res) => {
  try {
    const teamsSnapshot = await db.collection('teams').get();
    const approvals = [];
    teamsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.pendingApproval) {
        approvals.push({ teamName: doc.id, ...data.pendingApproval });
      }
    });
    res.json({ success: true, approvals });
  } catch (error) {
    console.error("Approvals Error:", error);
    res.status(500).json({ success: false, message: "Error fetching approvals" });
  }
});

app.post('/api/approve', async (req, res) => {
  const { teamName, questionId, action } = req.body;
  try {
    const teamRef = db.collection('teams').doc(teamName);
    const doc = await teamRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Team not found" });
    
    const teamData = doc.data();
    if (!teamData.pendingApproval || teamData.pendingApproval.questionId !== questionId) {
      return res.status(400).json({ error: "No pending approval for this question" });
    }

    if (action === 'accept') {
      const question = questionBank[questionId];
      await teamRef.set({
        score: admin.firestore.FieldValue.increment(question.points),
        solvedQuestions: admin.firestore.FieldValue.arrayUnion(questionId),
        lastFixed: admin.firestore.FieldValue.serverTimestamp(),
        pendingApproval: admin.firestore.FieldValue.delete()
      }, { merge: true });

      io.emit('score_updated', { teamName, points: question.points });
      io.emit('approval_status', { teamName, status: 'accepted', message: 'Admin accepted your solution! You may move to the next question.' });

      // Victory Check
      if (teamData.solvedQuestions && teamData.solvedQuestions.length === 9) {
         console.log(`🏆 ${teamName} HAS COMPLETED ALL 10 BUGS!`);
         io.emit('team_finished_all', { teamName: teamName });
      }
    } else {
      await teamRef.set({
        pendingApproval: admin.firestore.FieldValue.delete()
      }, { merge: true });
      io.emit('approval_status', { teamName, status: 'rejected', message: 'Admin rejected your solution!' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Approve Action Error:", error);
    res.status(500).json({ success: false, message: "Server error during approval" });
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
    if (data.teamName === 'bughunter2026') return; // EXEMPT ADMIN
    
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
        message: `Penalty applied to ${data.teamName} for switching tabs!`
      });
    } catch (error) {
      console.error("Error applying penalty:", error);
    }
  });

  socket.on('end_event', () => {
    io.emit('event_ended');
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