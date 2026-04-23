import { useEffect, useState } from 'react'
import './App.css'
import sharinganImage from './assets/sharingan-3-tomoe.jpg'

function App() {
  const [loaderHidden, setLoaderHidden] = useState(false)
  const [mainShow, setMainShow] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamPass, setTeamPass] = useState('')
  const [loginErr, setLoginErr] = useState('')
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

  const handleLogin = () => {
    const name = teamName.trim()
    const pass = teamPass.trim()

    if (!name || !pass) {
      setLoginErr('\u26A0 Please fill in both fields.')
      return
    }

    setLoginErr('')
    setButtonText('... Connecting')

    setTimeout(() => {
      setButtonText('\u25B6 Activate Sharingan')
      setLoginErr('\u26A0 Backend not connected yet - your friend\'s job!')
    }, 1200)
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleLogin()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [teamName, teamPass])

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
          <div className="event-name">Bug Hunter</div>
          <div className="event-tagline">// Awakened eyes see every flaw in the code //</div>
          <div className="divider"></div>
        </div>

        <div className="login-card">
          <div className="card-eye">
            <div className="eye-frame card-eye-frame">
              <img src={sharinganImage} alt="Sharingan" className="sharingan-image card-eye-image" />
            </div>
          </div>

          <div className="card-title">Enter the Arena</div>

          <div className="field">
            <label>Team Name</label>
            <input
              type="text"
              id="teamName"
              placeholder="e.g. NullPointers"
              autoComplete="off"
              spellCheck="false"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Team Password</label>
            <input
              type="password"
              id="teamPass"
              placeholder="••••••••"
              autoComplete="off"
              value={teamPass}
              onChange={(e) => setTeamPass(e.target.value)}
            />
          </div>

          <button className="login-btn" onClick={handleLogin}>
            <span>{buttonText}</span>
          </button>

          <div className={`login-err ${loginErr ? 'show' : ''}`} id="loginErr">
            {loginErr}
          </div>

          <div className="card-footer">
            All participants must be pre-registered · AJIET Aakar26
          </div>
        </div>
      </div>
    </>
  )
}

export default App
