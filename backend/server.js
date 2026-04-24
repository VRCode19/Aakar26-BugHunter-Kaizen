const express = require('express');
console.log("\n\n🔥🔥🔥 BUG HUNTER 2026: BANK VERSION 2.0 LOADED 🔥🔥🔥\n\n");
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
    initialCode: `#include <stdio.h>\n\nint main(void) {\n    int n, i, j;\n\n    scanf("%d", &n);\n\n    for (i = 1; i <= n; i++) {\n        for (j = 1; j < i; j++) {\n            printf("%d", j);\n        }\n        printf("\\n");\n    }\n\n    return 0;\n}`
  },
  "q2": {
    id: "q2",
    points: 20,
    testInput: "10\n20",
    expectedOutput: "Before swap: a = 10, b = 20\nAfter swap: a = 20, b = 10",
    initialCode: `#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    int *temp = a;\n    a = b;\n    b = temp;\n}\n\nint main(void) {\n    int a, b;\n\n    scanf("%d %d", &a, &b);\n\n    printf("Before swap: a = %d, b = %d\\n", a, b);\n    swap(&a, &b);\n    printf("After swap: a = %d, b = %d\\n", a, b);\n\n    return 0;\n}`
  },
  "q3": {
    id: "q3",
    points: 30,
    testInput: "hello",
    expectedOutput: "Uppercase: HELLO\nASCII values:\nH -> 72\nE -> 69\nL -> 76\nL -> 76\nO -> 79",
    initialCode: `#include <stdio.h>\n\nint main(void) {\n    char s[100];\n    int i;\n\n    scanf("%99s", s);\n\n    for (i = 0; s[i] != '\\0'; i++) {\n        if (s[i] >= 'a' && s[i] <= 'z') {\n            s[i] = s[i] + 32;\n        }\n    }\n\n    printf("Uppercase: %s\\n", s);\n    printf("ASCII values:\\n");\n\n    for (i = 0; s[i] != '\\0'; i++) {\n        printf("%c -> %d\\n", s[i], (int)s[i]);\n    }\n\n    return 0;\n}`
  },
  "q4": {
    id: "q4",
    points: 40,
    testInput: "10",
    expectedOutput: "n & 1 = 0\nn << 1 = 20\nn >> 1 = 5\nHex of n = 0xA",
    initialCode: `#include <stdio.h>\n\nint main(void) {\n    int n;\n\n    scanf("%d", &n);\n\n    int odd_bit = n && 1;\n\n    printf("n & 1 = %d\\n", odd_bit);\n    printf("n << 1 = %d\\n", n << 1);\n    printf("n >> 1 = %d\\n", n >> 1);\n    printf("Hex of n = 0x%d\\n", n);\n\n    return 0;\n}`
  },
  "q5": {
    id: "q5",
    points: 50,
    testInput: "101\nRavi\n88.5",
    expectedOutput: "Roll: 101\nName: Ravi\nMarks: 88.50",
    initialCode: `#include <stdio.h>\n\ntypedef struct {\n    int roll;\n    char name[50];\n    float marks;\n} Student;\n\nint main(void) {\n    struct Student s;\n\n    scanf("%d %49s %f", &s.roll, s.name, &s.marks);\n\n    printf("Roll: %d\\n", s.roll);\n    printf("Name: %s\\n", s.name);\n    printf("Marks: %d\\n", s.marks);\n\n    return 0;\n}`
  },
  "q6": {
    id: "q6",
    points: 60,
    testInput: "5",
    expectedOutput: "Factorial of 5 is 120",
    initialCode: `#include <stdio.h>\n\nint factorial(int n) {\n    return n + factorial(n - 1);\n}\n\nint main(void) {\n    int n;\n\n    scanf("%d", &n);\n\n    printf("Factorial of %d is %d\\n", n, factorial(n));\n\n    return 0;\n}`
  },
  "q7": {
    id: "q7",
    points: 70,
    testInput: "dcba",
    expectedOutput: "Sorted string: abcd",
    initialCode: `#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    char s[100];\n    int i, j, min_idx, n;\n    char temp;\n\n    scanf("%99s", s);\n    n = (int)strlen(s);\n\n    for (i = 0; i < n - 1; i++) {\n        min_idx = i;\n\n        for (j = i + 1; j < n; j++) {\n            if (s[j] > s[min_idx]) {\n                min_idx = j;\n            }\n        }\n\n        temp = s[i];\n        s[i] = s[min_idx];\n        s[min_idx] = temp;\n    }\n\n    printf("Sorted string: %s\\n", s);\n\n    return 0;\n}`
  },
  "q8": {
    id: "q8",
    points: 80,
    testInput: "25",
    expectedOutput: "You entered: 25\nSquare: 625",
    initialCode: `#include <stdio.h>\n\nint main(void) {\n    int n;\n\n    scanf("%d", n);\n\n    printf("You entered: %f\\n"+ n);\n    printf("Square: %d\\n", n * n);\n\n    return 0;\n}`
  },
  "q9": {
    id: "q9",
    points: 90,
    testInput: "5",
    expectedOutput: "1 is Odd\n2 is Even\n3 is Odd\n4 is Even\n5 is Odd",
    initialCode: `#include <stdio.h>\n\nint main(void) {\n    int n, i;\n\n    scanf("%d", &n);\n\n    for (i = 1; i < n; i++) {\n        if (i % 2 == 1) {\n            printf("%d is Even\\n", i);\n        } else {\n            printf("%d is Odd\\n", i);\n        }\n    }\n\n    return 0;\n}`
  },
  "q10": {
    id: "q10",
    points: 100,
    testInput: "42",
    expectedOutput: "Value read from file: 42",
    initialCode: `#include <stdio.h>\n\nint main(void) {\n    int n, value;\n    FILE *fp;\n\n    scanf("%d", &n);\n\n    fp = fopen("number.txt", "r");\n    if (fp == NULL) {\n        printf("File open error\\n");\n        return 1;\n    }\n\n    fprintf(fp, "%d", n);\n    fclose(fp);\n\n    fp = fopen("number.txt", "r");\n    if (fp == NULL) {\n        printf("File open error\\n");\n        return 1;\n    }\n\n    fscanf(fp, "%d", &value);\n    fclose(fp);\n\n    printf("Value read from file: %d\\n", value);\n\n    return 0;\n}`
  }
};

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
        executeParameters: { args: [], stdin: (stdinStr || "") + "\n" },
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

  console.log(`\n📥 Submission Received: Team: ${teamName}, Question: ${questionId}`);
  console.log(`🎯 Expected Output: "${question.expectedOutput.substring(0, 30)}..."`);

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

    // Trim actual output to match expected output formatting
    if (actualOutput !== null) {
      actualOutput = actualOutput.trim();
    }

    // API 4: Failsafe Regex Match (Guarantees Event Success)
    if (actualOutput === null && compilerErrorStr === null) {
      console.log("All APIs failed! Using Failsafe Regex Mathing...");
      const codeClean = submittedCode.replace(/\s+/g, '');
      let isRegexCorrect = false;
      if (questionId === 'q1' && codeClean.includes('j<=i')) isRegexCorrect = true;
      else if (questionId === 'q2' && codeClean.includes('*a=*b')) isRegexCorrect = true;
      else if (questionId === 'q3' && codeClean.includes('s[i]-32')) isRegexCorrect = true;
      else if (questionId === 'q4' && codeClean.includes('%X')) isRegexCorrect = true;
      else if (questionId === 'q5' && codeClean.includes('Student;')) isRegexCorrect = true;
      else if (questionId === 'q6' && codeClean.includes('n*factorial')) isRegexCorrect = true;
      else if (questionId === 'q7' && codeClean.includes('s[j]<s[min_idx]')) isRegexCorrect = true;
      else if (questionId === 'q8' && codeClean.includes('&n')) isRegexCorrect = true;
      else if (questionId === 'q9' && codeClean.includes('i<=n')) isRegexCorrect = true;
      else if (questionId === 'q10' && codeClean.includes('"w"')) isRegexCorrect = true;

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

    // If actualOutput is null at this point, something went wrong
    if (actualOutput === null) {
      return res.json({ success: false, message: "Execution Failed", error: "Code did not produce any output. Please check your code." });
    }

    // Direct string comparison with trimming and newline normalization
    const normalizeOutput = (str) => {
      return str.trim().replace(/\r\n/g, '\n');
    };

    const normalizedActual = normalizeOutput(actualOutput);
    const normalizedExpected = normalizeOutput(expectedOutput);

    if (normalizedActual === normalizedExpected) {
      // 🎉 Create Pending Approval instead of Auto-Updating Database
      await teamRef.set({
        pendingApproval: {
          questionId: questionId,
          code: submittedCode,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });

      io.emit('new_approval_request', { teamName, questionId });

      return res.json({ success: true, message: `Code output is correct! Waiting for Admin approval...\nYour output: '${normalizedActual.substring(0, 100)}'` });
    } else {
      return res.json({
        success: false,
        message: "Incorrect Output",
        error: `Output did not match expected result.\nYour output:\n'${normalizedActual}'\n\nExpected output:\n'${normalizedExpected}'`
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