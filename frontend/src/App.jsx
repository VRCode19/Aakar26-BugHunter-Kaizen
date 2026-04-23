import { useEffect, useMemo, useState } from 'react'
import './App.css'
import sharinganImage from './assets/sharingan-3-tomoe.jpg'

const DEFAULT_DURATION_MINUTES = 240

function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds)
  const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(safeSeconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function App() {
  const [loaderHidden, setLoaderHidden] = useState(false)
  const [mainShow, setMainShow] = useState(false)
  const [loginMode, setLoginMode] = useState('team')
  const [teamId, setTeamId] = useState('')
  const [teamPassword, setTeamPassword] = useState('')
  const [adminId, setAdminId] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [buttonText, setButtonText] = useState('> Activate Sharingan')
  const [session, setSession] = useState(null)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION_MINUTES * 60)
  const [questionText, setQuestionText] = useState(
    'Question statement will be added here by your team. Keep this area reserved for the official debugging prompt.',
  )
  const [starterCode, setStarterCode] = useState(
    '#include <stdio.h>\n\nint main(void) {\n    // Official debugging code will be added here.\n    return 0;\n}\n',
  )
  const [consoleOutput, setConsoleOutput] = useState(
    'Compiler panel reserved. Connect this to backend later.',
  )
  const [visibilityWarnings, setVisibilityWarnings] = useState({})
  const [fullscreenWarnings, setFullscreenWarnings] = useState({})
  const [disqualifiedTeams, setDisqualifiedTeams] = useState([])
  const [systemWarning, setSystemWarning] = useState('')
  const [leaderboard, setLeaderboard] = useState([])

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

  useEffect(() => {
    if (!session) {
      return undefined
    }

    const timer = setInterval(() => {
      setTimeLeft((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [session])

  useEffect(() => {
    if (!session || session.role !== 'team') {
      return undefined
    }

    const handleVisibility = () => {
      if (!document.hidden) {
        return
      }

      setVisibilityWarnings((current) => {
        const nextCount = (current[session.id] ?? 0) + 1

        if (nextCount >= 3) {
          setDisqualifiedTeams((teams) =>
            teams.includes(session.id) ? teams : [...teams, session.id],
          )
          setSystemWarning(`${session.id} has been disqualified after 3 tab switches.`)
        } else {
          setSystemWarning(`Warning: ${session.id} changed tabs. Count ${nextCount}/3.`)
        }

        return {
          ...current,
          [session.id]: nextCount,
        }
      })
    }

    const handleFullscreen = () => {
      if (document.fullscreenElement) {
        return
      }

      setFullscreenWarnings((current) => ({
        ...current,
        [session.id]: (current[session.id] ?? 0) + 1,
      }))
      setSystemWarning('Fullscreen exited. Admin can review this on the monitor panel.')
    }

    document.addEventListener('visibilitychange', handleVisibility)
    document.addEventListener('fullscreenchange', handleFullscreen)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('fullscreenchange', handleFullscreen)
    }
  }, [session])

  const visibleLeaderboard = useMemo(() => {
    const filtered = leaderboard.filter((team) => !disqualifiedTeams.includes(team.id))
    return filtered
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points
        }

        return b.solved - a.solved
      })
      .map((team, index) => ({
        ...team,
        rank: index + 1,
      }))
  }, [leaderboard, disqualifiedTeams])

  const handleTeamLogin = () => {
    if (!teamId.trim() || !teamPassword.trim()) {
      setLoginErr('! Enter Team ID and Password.')
      return
    }

    const normalizedId = teamId.trim()
    setButtonText('... Connecting')
    setLoginErr('')

    const existing = leaderboard.find((team) => team.id === normalizedId)

    if (!existing) {
      setLeaderboard((current) => [
        ...current,
        { id: normalizedId, name: normalizedId, points: 0, solved: 0 },
      ])
    }

    setTimeout(() => {
      setSession({
        id: normalizedId,
        role: 'team',
      })
      setButtonText('> Activate Sharingan')
      setSystemWarning('')
    }, 600)
  }

  const handleAdminLogin = () => {
    if (!adminId.trim() || !adminPassword.trim()) {
      setLoginErr('! Enter Admin ID and Password.')
      return
    }

    setLoginErr('')
    setButtonText('... Connecting')

    setTimeout(() => {
      setSession({
        id: adminId.trim(),
        role: 'admin',
      })
      setButtonText('> Activate Sharingan')
      setSystemWarning('')
    }, 600)
  }

  const handleActivate = () => {
    if (loginMode === 'admin') {
      handleAdminLogin()
      return
    }

    handleTeamLogin()
  }

  const handleDisqualify = (teamIdToRemove) => {
    setDisqualifiedTeams((current) =>
      current.includes(teamIdToRemove) ? current : [...current, teamIdToRemove],
    )
  }

  const handleRestore = (teamIdToRestore) => {
    setDisqualifiedTeams((current) => current.filter((team) => team !== teamIdToRestore))
  }

  const handleMockSubmit = () => {
    setConsoleOutput(
      [
        'Submission queued in frontend preview.',
        `Team: ${session?.id ?? 'Unknown'}`,
        'Backend compiler is not connected yet.',
        'When your backend is ready, this panel can show compile output here.',
      ].join('\n'),
    )
  }

  const particles = [
    { width: '3px', height: '3px', left: '8%', bottom: 0, '--dur': '7s', '--delay': '0s' },
    { width: '2px', height: '2px', left: '22%', bottom: 0, '--dur': '9s', '--delay': '1.5s' },
    { width: '4px', height: '4px', left: '40%', bottom: 0, '--dur': '6s', '--delay': '0.8s' },
    { width: '2px', height: '2px', left: '58%', bottom: 0, '--dur': '8s', '--delay': '2.2s' },
    { width: '3px', height: '3px', left: '74%', bottom: 0, '--dur': '7.5s', '--delay': '0.4s' },
    { width: '2px', height: '2px', left: '88%', bottom: 0, '--dur': '10s', '--delay': '3s' },
  ]

  const currentVisibilityCount = session ? visibilityWarnings[session.id] ?? 0 : 0
  const currentFullscreenCount = session ? fullscreenWarnings[session.id] ?? 0 : 0

  return (
    <>
      {particles.map((style, index) => (
        <div key={index} className="particle" style={style} />
      ))}

      <div id="loader" className={loaderHidden ? 'hide' : ''} style={{ display: mainShow ? 'none' : 'flex' }}>
        <div className="eye-wrap">
          <div className="eye-frame">
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
          <div className="college-tag">AJIET - Aakar 2026</div>
          <div className="event-name">Bug Hunter : Kaizen</div>
          <div className="event-tagline">// Debug. Fix. Climb. //</div>
          <div className="divider"></div>
        </div>

        {!session ? (
          <div className="login-card">
            <div className="card-eye">
              <div className="eye-frame card-eye-frame">
                <img src={sharinganImage} alt="Sharingan" className="sharingan-image card-eye-image" />
              </div>
            </div>

            <div className="mode-switch">
              <button
                type="button"
                className={`mode-btn ${loginMode === 'team' ? 'active' : ''}`}
                onClick={() => setLoginMode('team')}
              >
                Team Login
              </button>
              <button
                type="button"
                className={`mode-btn ${loginMode === 'admin' ? 'active' : ''}`}
                onClick={() => setLoginMode('admin')}
              >
                Admin Login
              </button>
            </div>

            {loginMode === 'team' ? (
              <>
                <div className="field">
                  <label>Team ID</label>
                  <input
                    type="text"
                    value={teamId}
                    onChange={(event) => setTeamId(event.target.value)}
                    placeholder="e.g. BHK-07"
                    autoComplete="off"
                  />
                </div>

                <div className="field">
                  <label>Password</label>
                  <input
                    type="password"
                    value={teamPassword}
                    onChange={(event) => setTeamPassword(event.target.value)}
                    placeholder="Enter team password"
                    autoComplete="off"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="field">
                  <label>Admin ID</label>
                  <input
                    type="text"
                    value={adminId}
                    onChange={(event) => setAdminId(event.target.value)}
                    placeholder="Enter admin ID"
                    autoComplete="off"
                  />
                </div>

                <div className="field">
                  <label>Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    placeholder="Enter admin password"
                    autoComplete="off"
                  />
                </div>
              </>
            )}

            <button className="login-btn" onClick={handleActivate}>
              <span>{buttonText}</span>
            </button>

            <div className={`login-err ${loginErr ? 'show' : ''}`}>{loginErr}</div>
          </div>
        ) : (
          <div className="competition-shell">
            <section className="status-row panel">
              <div className="status-block">
                <span className="status-label">Logged In As</span>
                <strong>{session.id}</strong>
              </div>
              <div className="status-block">
                <span className="status-label">Mode</span>
                <strong>{session.role === 'admin' ? 'Admin Monitor' : 'Team Arena'}</strong>
              </div>
              <div className="status-block">
                <span className="status-label">Timer</span>
                <strong>{formatCountdown(timeLeft)}</strong>
              </div>
              {session.role === 'team' && (
                <>
                  <div className="status-block">
                    <span className="status-label">Tab Warnings</span>
                    <strong>{currentVisibilityCount}/3</strong>
                  </div>
                  <div className="status-block">
                    <span className="status-label">Fullscreen Exits</span>
                    <strong>{currentFullscreenCount}</strong>
                  </div>
                </>
              )}
            </section>

            {systemWarning && <div className="system-warning panel">{systemWarning}</div>}

            <div className="main-grid">
              <div className="workspace-column">
                <section className="panel question-panel">
                  <div className="section-title">Question</div>
                  <textarea
                    className="question-area"
                    value={questionText}
                    onChange={(event) => setQuestionText(event.target.value)}
                    spellCheck="false"
                  />
                </section>

                <section className="panel editor-panel">
                  <div className="section-title">Code Editor</div>
                  <textarea
                    className="code-editor"
                    value={starterCode}
                    onChange={(event) => setStarterCode(event.target.value)}
                    spellCheck="false"
                  />
                  <div className="editor-actions">
                    <button type="button" className="login-btn submit-btn" onClick={handleMockSubmit}>
                      <span>Submit Fix</span>
                    </button>
                  </div>
                  <pre className="console-output">{consoleOutput}</pre>
                </section>
              </div>

              <div className="side-column">
                <section className="panel scoreboard-panel">
                  <div className="section-title">Scoreboard</div>
                  <div className="scoreboard-head">
                    <span>Rank</span>
                    <span>Team</span>
                    <span>Solved</span>
                    <span>Points</span>
                  </div>

                  <div className="scoreboard-list">
                    {visibleLeaderboard.length === 0 ? (
                      <div className="empty-state">Teams will appear here as they log in.</div>
                    ) : (
                      visibleLeaderboard.map((team) => (
                        <div key={team.id} className="score-row">
                          <span>#{team.rank}</span>
                          <strong>{team.name}</strong>
                          <span>{team.solved}</span>
                          <span>{team.points}</span>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {session.role === 'admin' && (
                  <section className="panel admin-panel">
                    <div className="section-title">Admin Monitor</div>
                    <div className="admin-list">
                      {leaderboard.length === 0 ? (
                        <div className="empty-state">No teams logged in yet.</div>
                      ) : (
                        leaderboard.map((team) => {
                          const tabCount = visibilityWarnings[team.id] ?? 0
                          const fullscreenCount = fullscreenWarnings[team.id] ?? 0
                          const removed = disqualifiedTeams.includes(team.id)

                          return (
                            <div key={team.id} className="admin-row">
                              <div className="admin-row-main">
                                <strong>{team.name}</strong>
                                <span>Tab: {tabCount}</span>
                                <span>Fullscreen: {fullscreenCount}</span>
                                <span>Status: {removed ? 'Disqualified' : 'Active'}</span>
                              </div>

                              <div className="admin-actions">
                                {removed ? (
                                  <button
                                    type="button"
                                    className="ghost-btn"
                                    onClick={() => handleRestore(team.id)}
                                  >
                                    Restore
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="ghost-btn danger-btn"
                                    onClick={() => handleDisqualify(team.id)}
                                  >
                                    Disqualify
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default App
