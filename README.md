# BugHunter 2026

BugHunter 2026 is a college debugging contest platform for Aakar26. It is a full-stack web app for a C debugging competition. The repository contains a Node.js backend for game logic, Firebase-backed persistence, and code execution, plus a React/Vite frontend for the participant and admin experience.

## Repository structure

- backend/: Express server, Firebase integration, Socket.io real-time events, and API routes for login, running code, submissions, and approvals.
- frontend/: Vite + React app with the competition UI, login screens, editor, leaderboard, and admin review flows.
- generateTeams.js: helper script for creating team records in Firestore.
- render.yaml and vercel.json: deployment configuration files.

## Main features

- Team login and automatic team registration
- C debugging challenge flow with code editing and execution
- Run and submit actions for each question
- Live leaderboard and approval workflow for submissions
- Real-time updates over Socket.io

## Tech stack

### Backend
- Node.js
- Express
- Socket.io
- Firebase Admin SDK / Firestore
- Axios
- dotenv

### Frontend
- React
- Vite
- Axios
- Socket.io client

## Getting started

### 1. Backend

1. Change into the backend folder.
2. Install dependencies:
   - npm install
3. Start the server:
   - npm start

The backend expects Firebase credentials. You can provide them either through a Firebase service account JSON file named firebaseServiceAccount.json in the backend folder or through the FIREBASE_SERVICE_ACCOUNT environment variable.

### 2. Frontend

1. Change into the frontend folder.
2. Install dependencies:
   - npm install
3. Start the development server:
   - npm run dev

## Notes

- The backend uses the Godbolt compiler API to execute submitted C code.
- The project includes deployment configuration for Render and Vercel.
- The helper script in the repository root can be used to create starter team documents for the competition data store.
