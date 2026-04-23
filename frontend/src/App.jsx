import { useState, useEffect } from 'react'
import io from 'socket.io-client'
import axios from 'axios'
import './App.css'

const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:5000' : 'https://aakar26-bughunter-kaizen.onrender.com'

function App() {
  const [leaderboard, setLeaderboard] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [teamName, setTeamName] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [socket, setSocket] = useState(null)

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io(BACKEND_URL)
    setSocket(newSocket)

    newSocket.on('score_updated', () => {
      fetchLeaderboard()
      setStatusMessage('Leaderboard updated!')
    })

    newSocket.on('team_joined', (data) => {
      setStatusMessage(`${data.teamName} joined the game!`)
      fetchLeaderboard()
    })

    newSocket.on('event_status_change', (data) => {
      console.log('Event status:', data)
    })

    return () => newSocket.disconnect()
  }, [])

  // Fetch leaderboard on mount
  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/leaderboard`
      )
      if (response.data.success) {
        setLeaderboard(response.data.leaderboard)
        setStatusMessage('Leaderboard loaded')
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setStatusMessage('Failed to load leaderboard')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!teamName.trim() || !password.trim()) {
      setStatusMessage('Please enter team name and password')
      return
    }

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/login`,
        { teamName, password }
      )
      
      if (response.data.success) {
        setIsLoggedIn(true)
        setStatusMessage(`Welcome ${response.data.team.name}!`)
        fetchLeaderboard()
      }
    } catch (error) {
      setStatusMessage(error.response?.data?.message || 'Login failed')
    }
  }

  const handleSubmitCode = async () => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/submit`,
        {
          teamName,
          questionId: 'q1',
          submittedCode: '#include <stdio.h>\nint main() { printf("Hello World"); return 0; }'
        }
      )
      setStatusMessage(response.data.message || 'Code submitted')
      fetchLeaderboard()
    } catch (error) {
      setStatusMessage('Submission failed')
    }
  }

  return (
    <div className="app-container">
      <header>
        <h1>🐛 BugHunter: Kaizen</h1>
        <p>Connected to Render backend</p>
      </header>

      {statusMessage && (
        <div className="status-banner">{statusMessage}</div>
      )}

      {!isLoggedIn ? (
        <div className="login-section">
          <h2>Team Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Login</button>
          </form>
        </div>
      ) : (
        <div className="game-section">
          <h2>Welcome {teamName}</h2>
          <button onClick={handleSubmitCode}>Submit Code</button>
          <button onClick={fetchLeaderboard}>Refresh Leaderboard</button>
        </div>
      )}

      <section className="leaderboard-section">
        <h2>Leaderboard</h2>
        <ul>
          {leaderboard.length > 0 ? (
            leaderboard.map((team, index) => (
              <li key={index}>
                #{index + 1} {team.name}: {team.score || 0} points
              </li>
            ))
          ) : (
            <li>No teams logged in yet</li>
          )}
        </ul>
      </section>
    </div>
  )
}

export default App
