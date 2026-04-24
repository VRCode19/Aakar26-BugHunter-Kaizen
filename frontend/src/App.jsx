import { useEffect, useMemo, useState } from 'react'
import io from 'socket.io-client'
import axios from 'axios'
import './App.css'
import sharinganImage from './assets/sharingan-3-tomoe.jpg'

const DEFAULT_DURATION_MINUTES = 240
const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:5000' : 'https://aakar26-bughunter-kaizen.onrender.com'

function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds)
  const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(safeSeconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

const QUESTIONS = {
  "q1": {
    id: "q1",
    title: "Bug 1: Number Pattern",
    text: `Instruction:
This program is intentionally buggy.
Find and fix the bug so it prints the correct number pattern.

Input:
One positive integer n.

Expected output for n = 5:
1
12
123
1234
12345

Debug task:
Check the inner loop condition carefully. The pattern is missing one value in each row.`,
    starterCode: `#include <stdio.h>

int main(void) {
    int n, i, j;

    scanf("%d", &n);

    for (i = 1; i <= n; i++) {
        for (j = 1; j < i; j++) {
            printf("%d", j);
        }
        printf("\\n");
    }

    return 0;
}`,
  },
  "q2": {
    id: "q2",
    title: "Bug 2: Loop Sum",
    text: "Question 2: Loop Sum\nFix the loop to sum numbers 1 to 5.",
    starterCode: `#include <stdio.h>\nint main() { int s=0; for(int i=0; i<5; i++) s+=i; printf("%d", s); return 0; }`,
  }
};
// Auto-generate placeholders for q3 to q10
for(let i = 3; i <= 10; i++) {
  QUESTIONS[`q${i}`] = {
    id: `q${i}`,
    title: `Bug ${i}: Placeholder`,
    text: `Question ${i}:\nPlaceholder prompt. Overwrite this in App.jsx when you have the real question.`,
    starterCode: `// Placeholder starter code for Question ${i}\n`
  };
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
  const [lockdownTimeLeft, setLockdownTimeLeft] = useState(0)
  const [eventEnded, setEventEnded] = useState(false)
  
  const [currentQuestionId, setCurrentQuestionId] = useState('q1')
  const [editedCode, setEditedCode] = useState(QUESTIONS['q1'].starterCode)
  
  const [consoleOutput, setConsoleOutput] = useState(
    'System panel reserved. Submit code to see output.',
  )
  const [runOutput, setRunOutput] = useState('Code output will appear here...')
  const [customInput, setCustomInput] = useState('')
  const [visibilityWarnings, setVisibilityWarnings] = useState({})
  const [fullscreenWarnings, setFullscreenWarnings] = useState({})
  const [disqualifiedTeams, setDisqualifiedTeams] = useState([])
  const [systemWarning, setSystemWarning] = useState('')
  const [leaderboard, setLeaderboard] = useState([])
  const [approvals, setApprovals] = useState([])
  const [socket, setSocket] = useState(null)

  const fetchApprovals = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/approvals`)
      if (response.data.success) {
        setApprovals(response.data.approvals)
      }
    } catch (error) {
      console.error('Error fetching approvals:', error)
    }
  }

  // Initialize Socket.io and Leaderboard
  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/leaderboard`)
      if (response.data.success) {
        setLeaderboard(response.data.leaderboard.map(t => ({
          id: t.name,
          name: t.name,
          solved: t.solved
        })))
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
    fetchApprovals()
    const newSocket = io(BACKEND_URL)
    setSocket(newSocket)

    newSocket.on('score_updated', (data) => {
      fetchLeaderboard()
      if (data && data.message) {
        setSystemWarning(data.message)
      }
    })

    newSocket.on('team_joined', () => {
      fetchLeaderboard()
    })

    newSocket.on('event_ended', () => {
      setEventEnded(true)
    })

    newSocket.on('new_approval_request', () => {
      fetchApprovals()
    })

    // Auto-poll approvals every 5s as backup for socket events
    const approvalPoll = setInterval(() => {
      fetchApprovals()
      fetchLeaderboard()
    }, 5000)

    return () => {
      newSocket.disconnect()
      clearInterval(approvalPoll)
    }
  }, [])

  useEffect(() => {
    if (!socket || !session) return;
    
    const handleApprovalStatus = (data) => {
      fetchApprovals()
      fetchLeaderboard()
      if (session.id === data.teamName) {
         setConsoleOutput(`Approval Status: ${data.status.toUpperCase()}\n${data.message}`)
      }
    }
    
    socket.on('approval_status', handleApprovalStatus)
    return () => socket.off('approval_status', handleApprovalStatus)
  }, [socket, session])

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
    let timer;
    if (lockdownTimeLeft > 0) {
      timer = setInterval(() => {
        setLockdownTimeLeft((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [lockdownTimeLeft])

  useEffect(() => {
    if (!session || session.role !== 'team') {
      return undefined
    }

    const handleVisibility = () => {
      if (!document.hidden) {
        return
      }

      if (socket) {
        socket.emit('tab_switch_violation', { teamName: session.id })
      }

      setVisibilityWarnings((current) => {
        const nextCount = (current[session.id] ?? 0) + 1

        if (nextCount >= 3) {
          setDisqualifiedTeams((teams) =>
            teams.includes(session.id) ? teams : [...teams, session.id],
          )
          setSystemWarning(`${session.id} has been disqualified after 3 tab switches. 1 Minute Lockdown applied.`)
          setLockdownTimeLeft(60)
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
    return filtered.map((team, index) => ({
      ...team,
      rank: index + 1,
    }))
  }, [leaderboard, disqualifiedTeams])

  const handleTeamLogin = async () => {
    if (!teamId.trim() || !teamPassword.trim()) {
      setLoginErr('! Enter Team ID and Password.')
      return
    }

    const normalizedId = teamId.trim()
    setButtonText('... Connecting')
    setLoginErr('')

    try {
      const response = await axios.post(`${BACKEND_URL}/api/login`, {
        teamName: normalizedId,
        password: teamPassword
      })

      if (response.data.success) {
        setSession({
          id: normalizedId,
          role: 'team',
        })
        setButtonText('> Activate Sharingan')
        setSystemWarning('')
        fetchLeaderboard()
      }
    } catch (error) {
      setLoginErr(error.response?.data?.message || 'Login failed')
      setButtonText('> Activate Sharingan')
    }
  }

  const handleAdminLogin = () => {
    if (adminId.trim() !== 'bughunter2026' || adminPassword.trim() !== 'vrishab&pratham') {
      setLoginErr('! Incorrect Admin ID or Password.')
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

  const handleMockSubmit = async () => {
    setConsoleOutput('Submitting code to compiler...')
    try {
      const response = await axios.post(`${BACKEND_URL}/api/submit`, {
        teamName: session.id,
        questionId: currentQuestionId, // Use currently selected question
        submittedCode: editedCode
      })

      if (response.data.success) {
        setConsoleOutput(`Success! Output matches expected.\n${response.data.message}`)
      } else {
        setConsoleOutput(`Failed: ${response.data.message}\n${response.data.error || ''}`)
      }
    } catch (error) {
      setConsoleOutput(error.response?.data?.error || 'Submission failed')
    }
  }

  const handleRunCode = async () => {
    setRunOutput('Running code...')
    try {
      const response = await axios.post(`${BACKEND_URL}/api/run`, {
        teamName: session.id,
        questionId: currentQuestionId,
        submittedCode: editedCode,
        customInput: customInput
      })

      if (response.data.success) {
        setRunOutput(response.data.output || 'No output')
        if (response.data.message === 'Compilation Error') {
           setConsoleOutput('Compilation Error occurred. See program output.')
        } else {
           setConsoleOutput('Code execution completed successfully.')
        }
      } else {
        setRunOutput(`Failed: ${response.data.error || ''}`)
        setConsoleOutput('Execution failed.')
      }
    } catch (error) {
      setRunOutput(error.response?.data?.error || 'Run failed')
      setConsoleOutput('Error occurred while running code.')
    }
  }

  const handleApprove = async (teamName, questionId, action) => {
    try {
      await axios.post(`${BACKEND_URL}/api/approve`, {
        teamName, questionId, action
      })
      fetchApprovals()
    } catch (error) {
      console.error('Error approving:', error)
    }
  }

  const handleQuestionChange = (e) => {
    const newId = e.target.value
    setCurrentQuestionId(newId)
    setEditedCode(QUESTIONS[newId].starterCode)
    setConsoleOutput('System panel reserved. Submit code to see output.')
    setRunOutput('Code output will appear here...')
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
                {session.role === 'team' ? (
                  <>
                    <section className="panel question-panel">
                      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Question</span>
                        <select 
                          value={currentQuestionId} 
                          onChange={handleQuestionChange}
                          style={{ background: '#111', color: '#ea1717', border: '1px solid #7d1717', padding: '4px', fontFamily: 'monospace', outline: 'none' }}
                        >
                          {Object.values(QUESTIONS).map(q => (
                            <option key={q.id} value={q.id}>{q.title}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        className="question-area"
                        value={QUESTIONS[currentQuestionId].text}
                        readOnly
                        spellCheck="false"
                      />
                    </section>

                    <section className="panel editor-panel">
                      <div className="section-title">Code Editor</div>
                      <textarea
                        className="code-editor"
                        value={editedCode}
                        onChange={(event) => setEditedCode(event.target.value)}
                        spellCheck="false"
                        onCopy={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        onPaste={(e) => e.preventDefault()}
                      />
                      <div className="section-title" style={{ marginTop: '14px', fontSize: '0.75rem', color: '#ea1717' }}>Custom Test Input (Optional)</div>
                      <textarea
                        className="code-editor"
                        style={{ minHeight: '60px', marginTop: '8px', padding: '10px' }}
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Enter custom input for testing..."
                        spellCheck="false"
                      />
                      <div className="editor-actions" style={{ gap: '10px', marginTop: '14px' }}>
                        <button type="button" className="login-btn ghost-btn" onClick={handleRunCode} style={{ width: 'auto' }}>
                          <span>Run Code</span>
                        </button>
                        <button type="button" className="login-btn submit-btn" onClick={handleMockSubmit} style={{ width: 'auto' }}>
                          <span>Submit Fix</span>
                        </button>
                      </div>
                      <div className="output-section">
                        <div className="section-title" style={{ marginTop: '14px', fontSize: '0.75rem', color: '#ea1717' }}>Program Output</div>
                        <pre className="console-output" style={{ marginTop: '8px', minHeight: '80px', color: '#f0d3d3' }}>{runOutput}</pre>
                      </div>
                      <div className="output-section">
                        <div className="section-title" style={{ marginTop: '14px', fontSize: '0.75rem', color: '#ea1717' }}>System Console</div>
                        <pre className="console-output" style={{ marginTop: '8px', minHeight: '60px' }}>{consoleOutput}</pre>
                      </div>
                    </section>
                  </>
                ) : (
                  <section className="panel approvals-panel" style={{height: '100%', minHeight: '600px'}}>
                    <div className="section-title">Pending Submissions</div>
                    <div className="approvals-list" style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px'}}>
                      {approvals.length === 0 ? (
                        <div className="empty-state">No pending submissions.</div>
                      ) : (
                        approvals.map((appr) => (
                          <div key={appr.teamName + appr.questionId} className="admin-row" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                            <div style={{marginBottom: '10px'}}>
                              <strong style={{fontSize: '1.1rem'}}>{appr.teamName}</strong> submitted <span style={{color: 'gold'}}>{QUESTIONS[appr.questionId]?.title || appr.questionId}</span>
                            </div>
                            <textarea
                              readOnly
                              value={appr.code}
                              style={{width: '100%', minHeight: '150px', background: '#000', color: '#fff', fontFamily: 'monospace', padding: '10px', marginBottom: '10px', border: '1px solid rgba(180, 20, 20, 0.5)', outline: 'none'}}
                            />
                            <div style={{display: 'flex', gap: '10px'}}>
                              <button className="login-btn submit-btn" onClick={() => handleApprove(appr.teamName, appr.questionId, 'accept')} style={{padding: '8px 16px', background: '#1a5c1a', color: '#fff', borderColor: '#1a5c1a'}}>Accept</button>
                              <button className="ghost-btn danger-btn" onClick={() => handleApprove(appr.teamName, appr.questionId, 'reject')} style={{padding: '8px 16px'}}>Reject</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                )}
              </div>

              <div className="side-column">
                <section className="panel scoreboard-panel">
                  <div className="section-title">Scoreboard</div>
                  <div className="scoreboard-head">
                    <span>Team</span>
                    <span>Solved</span>
                  </div>

                  <div className="scoreboard-list">
                    {visibleLeaderboard.length === 0 ? (
                      <div className="empty-state">Teams will appear here as they log in.</div>
                    ) : (
                      visibleLeaderboard.map((team) => (
                        <div key={team.id} className={`score-row ${team.rank === 1 ? 'rank-1' : team.rank === 2 ? 'rank-2' : team.rank === 3 ? 'rank-3' : ''}`}>
                          <strong>
                            {team.rank === 1 && <span className="crown" style={{ display: 'inline-block', marginRight: '4px' }}>👑</span>}
                            {team.name}
                          </strong>
                          <span>{team.solved}</span>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {session.role === 'admin' && (
                  <section className="panel admin-panel">
                    <div className="section-title" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span>Admin Monitor</span>
                      <button type="button" className="ghost-btn danger-btn" onClick={() => socket && socket.emit('end_event')} style={{padding: '6px 12px', fontSize: '0.7rem'}}>End Event</button>
                    </div>
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
                                <span>Problem: {team.solved + 1}</span>
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

      {session && session.role === 'team' && lockdownTimeLeft > 0 && (
        <div className="lockdown-overlay">
          <div className="lockdown-content">
            <div className="eye-frame" style={{ width: '100px', height: '100px', margin: '0 auto 20px' }}>
               <img src={sharinganImage} alt="Sharingan" className="sharingan-image loader-eye-image" />
            </div>
            <h2>SYSTEM LOCKDOWN</h2>
            <p>Multiple tab switches detected. Please wait.</p>
            <div className="lockdown-timer">{lockdownTimeLeft}s</div>
          </div>
        </div>
      )}
      {eventEnded && (
        <div className="lockdown-overlay event-ended-overlay">
          <div className="celebration-content">
            <h1 className="event-name end-title">EVENT ENDED</h1>
            <h2 className="section-title end-subtitle">Top Bug Hunters</h2>
            <div className="winners-podium">
              {visibleLeaderboard.slice(0, 3).map(team => (
                <div key={team.id} className={`podium-rank rank-${team.rank}`}>
                  <div className="crown-icon">{team.rank === 1 ? '👑' : ''}</div>
                  <h3 className="podium-name">{team.name}</h3>
                  <p className="podium-solved">Solved: {team.solved}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
