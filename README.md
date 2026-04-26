# BugHunter 2026

BugHunter 2026 is a real time competition platform designed for debugging challenges. It allows participants to register as teams, solve C language debugging problems, and compete on a live leaderboard. The system features an admin approval workflow and anti cheat mechanisms to ensure fair play.

## Project Architecture

The project is divided into two main components:

1. Backend: A Node.js Express server that manages data persistence, real time communication, and code execution.
2. Frontend: A React application built with Vite that provides a dynamic interface for participants and administrators.

## Technical Stack

### Backend Technologies

* Node.js and Express for server logic
* Socket.io for real time bidirectional communication
* Firebase Firestore for data storage and management
* Godbolt API for secure C code compilation and execution
* Express Rate Limit for submission throttling

### Frontend Technologies

* React for component based UI
* Vite for fast development and building
* Socket.io Client for real time updates
* Axios for API requests
* Vanilla CSS for custom styling

## Core Features

### Team Management

* Automatic registration upon first login
* Password protected access using a shared event key
* In memory caching to optimize database read operations

### Debugging Platform

* 10 curated C language debugging questions
* Integrated code editor and execution environment
* Custom input support for testing solutions
* Manual admin review system for final submissions

### Live Leaderboard

* Real time ranking based on bugs fixed and submission time
* Instant updates across all connected clients via WebSockets
* Visual feedback for team joins and score updates

### Security and Anti Cheat

* Tab switching detection with automatic point penalties
* Submission rate limiting to prevent brute force attempts
* Server side validation of team credentials and submission states

## Installation and Setup

### Prerequisites

* Node.js installed on the system
* Firebase project with a service account key
* Internet connection for Godbolt API access

### Backend Configuration

1. Navigate to the backend directory
2. Install dependencies using: npm install
3. Create a .env file with the following variables:
   * PORT=5000
   * FIREBASE_SERVICE_ACCOUNT (Optional if using json file)
4. Place your firebaseServiceAccount.json file in the backend root
5. Start the server with: npm start

### Frontend Configuration

1. Navigate to the frontend directory
2. Install dependencies using: npm install
3. Configure the backend URL in the application source code
4. Start the development server with: npm run dev
5. Build for production using: npm run build

## API Endpoints

### Public Routes

* GET /: Health check endpoint
* POST /api/login: Handles team registration and authentication
* GET /api/leaderboard: Retrieves current rankings

### Submission Routes

* POST /api/run: Compiles and executes code via Godbolt
* POST /api/submit: Registers a submission for admin review

### Admin Routes

* GET /api/approvals: Lists all pending submission requests
* GET /api/submission history: Returns a log of all solved questions
* POST /api/approve: Accepts or rejects a pending submission

## Real Time Events

The system utilizes Socket.io for the following events:

* team_joined: Broadcasts when a new team enters the competition
* score_updated: Notifies clients of point changes or penalties
* leaderboard_update: Syncs the ranking list across all screens
* new_approval_request: Alerts admins of incoming submissions
* approval_status: Informs teams if their fix was accepted or rejected
* event_ended: Signals the conclusion of the competition

## License

This project is developed for internal competition use. All rights reserved.
