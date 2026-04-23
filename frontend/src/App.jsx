<<<<<<< HEAD
import { useState, useEffect } from 'react'
import io from 'socket.io-client'
import axios from 'axios'
=======
import { useEffect, useState } from 'react'
>>>>>>> 54e500dc6852579346e8359993305dbccdb88044
import './App.css'
import sharinganImage from './assets/sharingan-3-tomoe.jpg'

function App() {
<<<<<<< HEAD
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
=======
  const [loaderHidden, setLoaderHidden] = useState(false)
  const [mainShow, setMainShow] = useState(false)
  const [buttonText, setButtonText] = useState('\u25B6 Activate Sharingan')

  useEffect(() => {
    const loaderTimer = setTimeout(() => {
      setLoaderHidden(true)

      const mainTimer = setTimeout(() => {
        setMainShow(true)
      }, 1600)

      return () => clearTimeout(mainTimer)
    }, 5000)

    return () => clearTimeout(loaderTimer)
  }, [])

  const handleActivate = () => {
    setButtonText('... Connecting')

    setTimeout(() => {
      setButtonText('\u25B6 Activate Sharingan')
    }, 1200)
  }

  const particles = [
    { width: '3px', height: '3px', left: '8%', bottom: 0, '--dur': '7s', '--delay': '0s' },
    { width: '2px', height: '2px', left: '22%', bottom: 0, '--dur': '9s', '--delay': '1.5s' },
    { width: '4px', height: '4px', left: '40%', bottom: 0, '--dur': '6s', '--delay': '0.8s' },
    { width: '2px', height: '2px', left: '58%', bottom: 0, '--dur': '8s', '--delay': '2.2s' },
    { width: '3px', height: '3px', left: '74%', bottom: 0, '--dur': '7.5s', '--delay': '0.4s' },
    { width: '2px', height: '2px', left: '88%', bottom: 0, '--dur': '10s', '--delay': '3s' },
    { width: '3px', height: '3px', left: '33%', bottom: 0, '--dur': '8.5s', '--delay': '1.2s' },
    { width: '2px', height: '2px', left: '65%', bottom: 0, '--dur': '6.5s', '--delay': '2.8s' },
  ]

  return (
    <>
      {particles.map((style, index) => (
        <div key={index} className="particle" style={style} />
      ))}

      <div id="loader" className={loaderHidden ? 'hide' : ''} style={{ display: mainShow ? 'none' : 'flex' }}>
        <div className="eye-wrap">
          <div className="eye-frame loader-eye-frame">
            <img src={sharinganImage} alt="Sharingan" className="sharingan-image loader-eye-image" />
          </div>
        </div>

        <div className="loader-bar-wrap">
          <div className="loader-bar-fill"></div>
        </div>
        <div className="loader-label">Awakening Sharingan...</div>
      </div>

      <div className="watermark">
        <div className="eye-frame watermark-frame">
          <img src={sharinganImage} alt="" className="sharingan-image watermark-image" />
        </div>
      </div>

      <div id="main" className={mainShow ? 'show' : ''}>
        <div className="event-banner">
          <div className="college-tag">AJIET · Dept. of CSE · Aakar 26</div>
          <div className="event-name">Bug Hunter : Kaizen</div>
          <div className="event-tagline">// Awakened eyes see every flaw in the code //</div>
          <div className="divider"></div>
        </div>

        <div className="login-card">
          <div className="card-eye">
            <div className="eye-frame card-eye-frame">
              <img src={sharinganImage} alt="Sharingan" className="sharingan-image card-eye-image" />
            </div>
          </div>

          <button className="login-btn" onClick={handleActivate}>
            <span>{buttonText}</span>
          </button>

          <div className="card-footer">All participants must be pre-registered · AJIET Aakar26</div>
        </div>
      </div>
    </>
>>>>>>> 54e500dc6852579346e8359993305dbccdb88044
  )
}

export default App
