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

// question bank 
const questionBank = {
  "q1": {
    id: "q1",
    points: 10,
    expectedOutput: "Hello World",
    initialCode: "#include <stdio.h>\nint main() { printf(\"Hello Wordl\"); return 0; }" 
  },
  "q2": {
    id: "q2",
    points: 20,
    expectedOutput: "15",
    initialCode: "// Fix the loop to sum numbers 1 to 5\n#include <stdio.h>\nint main() { int s=0; for(int i=0; i<5; i++) s+=i; printf(\"%d\", s); return 0; }"
  }
  // Add 10-15 more here...
};
//submit rate limiter
const rateLimit = require('express-rate-limit');

const submitLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds
  max: 1, // Limit each IP to 1 submission per window
  message: { error: "Wait 5 seconds between attempts!" }
});

app.use('/api/submit', submitLimiter);


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
// Submit Route (Real Piston API Compiler)
app.post('/api/submit', async (req, res) => {
  const { teamName, questionId, submittedCode } = req.body;
  
  // 1. Validate the incoming request
  if (!teamName || !questionId || !submittedCode) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const question = questionBank[questionId];
  if (!question) {
    return res.status(404).json({ error: "Question not found" });
  }

  try {
    // 2. Send the code to Piston API for C execution
    const pistonResponse = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: 'c',
      version: '*', // This grabs the latest C compiler (GCC) available on Piston
      files: [
        {
          name: "main.c",
          content: submittedCode
        }
      ]
    });

    const { run, compile } = pistonResponse.data;

    // 3. Check for Compilation Errors first
    if (compile && compile.code !== 0) {
      return res.json({ 
        success: false, 
        message: "Compilation Error", 
        error: compile.stderr 
      });
    }

    // 4. If it compiled, check the actual output
    if (run && run.stdout !== undefined) {
      // Trim removes extra hidden spaces or newlines that might cause a false failure
      const actualOutput = run.stdout.trim(); 
      const expectedOutput = question.expectedOutput.trim();

      if (actualOutput === expectedOutput) {
        // 🎉 BUG FIXED! Update Firebase Database
        const teamRef = db.collection('teams').doc(teamName);
        
        await teamRef.set({
          score: admin.firestore.FieldValue.increment(question.points),
          solvedQuestions: admin.firestore.FieldValue.arrayUnion(questionId),
          lastFixed: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Broadcast the update to all 50 teams instantly
        io.emit('score_updated', { teamName, points: question.points });
        
        return res.json({ 
          success: true, 
          message: "Bug Fixed! Points updated." 
        });
      } else {
        // ❌ INCORRECT OUTPUT
        return res.json({ 
          success: false, 
          message: "Incorrect Output", 
          error: `Expected: '${expectedOutput}', but got: '${actualOutput}'` 
        });
      }
    }

    // Fallback if Piston acts weird
    res.status(500).json({ error: "Execution failed. No output returned." });

  } catch (error) {
    console.error("Piston API Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Compiler Server is currently busy. Try again in 5 seconds." });
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