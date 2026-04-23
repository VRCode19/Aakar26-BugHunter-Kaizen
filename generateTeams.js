const admin = require('firebase-admin');

// 1. Connect to your Firebase keys
const serviceAccount = require('./backend/firebaseServiceAccount.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const SHARED_PASSWORD = "kaizen2026"; // Change this to your event password!
const TOTAL_TEAMS = 50;

async function buildArena() {
  console.log(`Generating ${TOTAL_TEAMS} teams...`);
  
  // A "batch" lets us group 50 creations into one single database request
  const batch = db.batch();

  for (let i = 1; i <= TOTAL_TEAMS; i++) {
    // This makes it Team_01, Team_02 instead of Team_1, Team_2
    const teamNumber = i < 10 ? `0${i}` : `${i}`; 
    const teamName = `Team_${teamNumber}`;

    const teamRef = db.collection('teams').doc(teamName);
    
    batch.set(teamRef, {
      password: SHARED_PASSWORD,
      score: 0,
      hasLoggedIn: false,
      solvedQuestions: []
    });
  }

  try {
    await batch.commit();
    console.log(`✅ Success! All ${TOTAL_TEAMS} teams created with password: "${SHARED_PASSWORD}"`);
    process.exit(0); // Closes the script
  } catch (error) {
    console.error("❌ Error creating teams:", error);
    process.exit(1);
  }
}

buildArena();