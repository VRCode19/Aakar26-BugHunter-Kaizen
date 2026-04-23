import { useState, useEffect } from 'react'
import io from 'socket.io-client'
import axios from 'axios'
import './App.css'

function App() {
  const [leaderboard, setLeaderboard] = useState([])
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    const socket = io('https://aakar26-bughunter-kaizen.onrender.com')

    socket.on('score_updated', () => {
      fetchLeaderboard()
      setStatusMessage('Leaderboard updated from server')
    })

    socket.on('event_status_change', (data) => {
      console.log('Event status changed:', data)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('https://aakar26-bughunter-kaizen.onrender.com/api/leaderboard')
      setLeaderboard(response.data)
      setStatusMessage('Leaderboard loaded successfully')
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setStatusMessage('Unable to load leaderboard')
    }
  }

  const submitCode = async () => {
    try {
      const response = await axios.post('https://aakar26-bughunter-kaizen.onrender.com/api/submit', {
        teamName: 'TestTeam',
        questionId: 'q1',
        submittedCode: 'printf("Hello World");'
      })
      setStatusMessage(response.data.message || 'Submission complete')
      fetchLeaderboard()
    } catch (error) {
      console.error('Error submitting code:', error)
      setStatusMessage('Submission failed')
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  return (
    <div className="app-container">
      <header>
        <h1>BugHunter Frontend</h1>
        <p>Connected to Render backend at aakar26-bughunter-kaizen.onrender.com</p>
      </header>

      <div className="actions">
        <button onClick={submitCode}>Submit Test Code</button>
        <button onClick={fetchLeaderboard}>Refresh Leaderboard</button>
      </div>

      {statusMessage && <div className="status-message">{statusMessage}</div>}

      <section className="leaderboard">
        <h2>Leaderboard</h2>
        <ul>
          {leaderboard.length > 0 ? (
            leaderboard.map((team, index) => (
              <li key={index}>{team.name}: {team.score} points</li>
            ))
          ) : (
            <li>No leaderboard data available</li>
          )}
        </ul>
      </section>
    </div>
  )
}

export default App
