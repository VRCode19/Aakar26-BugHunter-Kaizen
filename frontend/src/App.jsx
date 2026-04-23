import { useState, useEffect } from 'react'
import io from 'socket.io-client'
import axios from 'axios'
import './App.css'

function App() {
  const [leaderboard, setLeaderboard] = useState([])
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    // Connect to Socket.io
    const newSocket = io('https://aakar26-bughunter-kaizen.onrender.com/')
    setSocket(newSocket)

    // Listen for score updates
    newSocket.on('score_updated', (data) => {
      console.log('Score updated:', data)
      fetchLeaderboard()
    })

    newSocket.on('event_status_change', (data) => {
      console.log('Event status:', data)
    })

    return () => newSocket.close()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('https://aakar26-bughunter-kaizen.onrender.com/api/leaderboard')
      setLeaderboard(response.data)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  const submitCode = async () => {
    try {
      const response = await axios.post('https://aakar26-bughunter-kaizen.onrender.com/api/submit', {
        teamName: 'TestTeam',
        questionId: 'q1',
        submittedCode: 'printf("Hello World");'
      })
      console.log(response.data)
    } catch (error) {
      console.error('Error submitting code:', error)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  return (
    <div>
      <h1>BugHunter Frontend</h1>
      <button onClick={submitCode}>Submit Code</button>
      <h2>Leaderboard</h2>
      <ul>
        {leaderboard.map((team, index) => (
          <li key={index}>{team.name}: {team.score} points</li>
        ))}
      </ul>
    </div>
  )
}

export default App
