import { useEffect, useMemo, useState } from 'react'
import io from 'socket.io-client'
import axios from 'axios'
import './App.css'
import sharinganImage from './assets/sharingan-3-tomoe.jpg'

const DEFAULT_DURATION_MINUTES = 240
const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:5000' : 'https://aakar26-bughunter-kaizen.onrender.com';

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
    title: "Bug 2: Pointer Swap",
    text: `Instruction:
This program is intentionally buggy.
Find and fix the bug so it correctly swaps two numbers using pointers.

Input:
Two integers a and b.

Debug task:
The swap function uses pointers, but values are not changing in main.
Check whether pointer addresses are being swapped or actual values are being swapped.`,
    starterCode: `#include <stdio.h>

void swap(int *a, int *b) {
    int *temp = a;
    a = b;
    b = temp;
}

int main(void) {
    int a, b;

    scanf("%d %d", &a, &b);

    printf("Before swap: a = %d, b = %d\\n", a, b);
    swap(&a, &b);
    printf("After swap: a = %d, b = %d\\n", a, b);

    return 0;
}`,
  },
  "q3": {
    id: "q3",
    title: "Bug 3: String ASCII",
    text: `Instruction:
This program is intentionally buggy.
Find and fix the bug so it converts a lowercase string to uppercase using ASCII values.
Then print each character with its ASCII value.

Input:
A single lowercase word (no spaces), for example: hello

Debug task:
The conversion logic is wrong. Check the ASCII operation used for lowercase letters.`,
    starterCode: `#include <stdio.h>

int main(void) {
    char s[100];
    int i;

    scanf("%99s", s);

    for (i = 0; s[i] != '\\0'; i++) {
        if (s[i] >= 'a' && s[i] <= 'z') {
            s[i] = s[i] + 32;
        }
    }

    printf("Uppercase: %s\\n", s);
    printf("ASCII values:\\n");

    for (i = 0; s[i] != '\\0'; i++) {
        printf("%c -> %d\\n", s[i], (int)s[i]);
    }

    return 0;
}`,
  },
  "q4": {
    id: "q4",
    title: "Bug 4: Bitwise & Hex",
    text: `Instruction:
This program is intentionally buggy.
Find and fix the bug so it correctly uses bitwise operators and format specifiers.

Input:
One integer n.

Debug task:
1) One expression uses a logical operator instead of a bitwise operator.
2) The hex output line uses the wrong format specifier.`,
    starterCode: `#include <stdio.h>

int main(void) {
    int n;

    scanf("%d", &n);

    int odd_bit = n && 1;

    printf("n & 1 = %d\\n", odd_bit);
    printf("n << 1 = %d\\n", n << 1);
    printf("n >> 1 = %d\\n", n >> 1);
    printf("Hex of n = 0x%d\\n", n);

    return 0;
}`,
  },
  "q5": {
    id: "q5",
    title: "Bug 5: Struct Typedef",
    text: `Instruction:
This program is intentionally buggy.
Find and fix the bug so it correctly uses typedef with a structure and prints student data.

Input:
One student record in this format:
roll name marks
Example: 101 Ravi 88.5

Debug task:
1) Check whether typedef name and structure usage match.
2) Check the format specifier used to print marks.`,
    starterCode: `#include <stdio.h>

typedef struct {
    int roll;
    char name[50];
    float marks;
} Student;

int main(void) {
    struct Student s;

    scanf("%d %49s %f", &s.roll, s.name, &s.marks);

    printf("Roll: %d\\n", s.roll);
    printf("Name: %s\\n", s.name);
    printf("Marks: %d\\n", s.marks);

    return 0;
}`,
  },
  "q6": {
    id: "q6",
    title: "Bug 6: Factorial Recursion",
    text: `Instruction:
This program is intentionally buggy.
Find and fix the bug so it correctly calculates factorial using recursion.

Input:
One non-negative integer n.

Debug task:
1) Check the recursive step carefully.
2) Make sure the base case works correctly.`,
    starterCode: `#include <stdio.h>

int factorial(int n) {
    return n + factorial(n - 1);
}

int main(void) {
    int n;

    scanf("%d", &n);

    printf("Factorial of %d is %d\\n", n, factorial(n));

    return 0;
}`,
  },
  "q7": {
    id: "q7",
    title: "Bug 7: Selection Sort",
    text: `Instruction:
This program is intentionally buggy.
Find and fix the bug so it sorts characters of a string in ascending order
using selection sort.

Input:
A single word (no spaces), for example: dcba

Debug task:
The selection logic is wrong for ascending order.
Check the comparison used while finding the minimum character.`,
    starterCode: `#include <stdio.h>
#include <string.h>

int main(void) {
    char s[100];
    int i, j, min_idx, n;
    char temp;

    scanf("%99s", s);
    n = (int)strlen(s);

    for (i = 0; i < n - 1; i++) {
        min_idx = i;

        for (j = i + 1; j < n; j++) {
            if (s[j] > s[min_idx]) {
                min_idx = j;
            }
        }

        temp = s[i];
        s[i] = s[min_idx];
        s[min_idx] = temp;
    }

    printf("Sorted string: %s\\n", s);

    return 0;
}`,
  },
  "q8": {
    id: "q8",
    title: "Bug 8: Basic I/O",
    text: `Instruction:
This program is intentionally buggy.
Find and fix the boilerplate and printf/scanf issues.

Input:
One integer number.

Debug task:
1) Check scanf usage.
2) Check printf format specifiers.
3) Keep proper C boilerplate structure.`,
    starterCode: `#include <stdio.h>

int main(void) {
    int n;

    scanf("%d", n);

    printf("You entered: %f\\n"+ n);
    printf("Square: %d\\n", n * n);

    return 0;
}`,
  },
  "q9": {
    id: "q9",
    title: "Bug 9: Loop & Logic",
    text: `Instruction:
This program is intentionally buggy.
Find and fix the if-else and loop issues.

Input:
One positive integer n.

Debug task:
1) Check the loop range.
2) Check the if-else condition for even/odd.`,
    starterCode: `#include <stdio.h>

int main(void) {
    int n, i;

    scanf("%d", &n);

    for (i = 1; i < n; i++) {
        if (i % 2 == 1) {
            printf("%d is Even\\n", i);
        } else {
            printf("%d is Odd\\n", i);
        }
    }

    return 0;
}`,
  },
  "q10": {
    id: "q10",
    title: "Bug 10: File Handling",
    text: `Instruction:
This program is intentionally buggy.
Find and fix the bug so it writes a number to a file and reads it back.

Input:
One integer n.

Debug task:
1) Check the file open mode used for writing.
2) Ensure data is written correctly before reading.`,
    starterCode: `#include <stdio.h>\n\nint main(void) {
    int n, value;
    FILE *fp;

    scanf("%d", &n);

    fp = fopen("number.txt", "r");
    if (fp == NULL) {
        printf("File open error\\n");
        return 1;
    }

    fprintf(fp, "%d", n);
    fclose(fp);

    fp = fopen("number.txt", "r");
    if (fp == NULL) {
        printf("File open error\\n");
        return 1;
    }

    fscanf(fp, "%d", &value);
    fclose(fp);

    printf("Value read from file: %d\\n", value);

    return 0;
}`,
  }
};

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
  const [submissionHistory, setSubmissionHistory] = useState([])
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

  const fetchSubmissionHistory = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/submission-history`)
      if (response.data.success) {
        setSubmissionHistory(response.data.history)
      }
    } catch (error) {
      console.error('Error fetching submission history:', error)
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
    fetchSubmissionHistory()
    const newSocket = io(BACKEND_URL)
    setSocket(newSocket)

    newSocket.on('score_updated', (data) => {
      fetchLeaderboard()
      fetchSubmissionHistory()
      if (data && data.message) {
        setSystemWarning(data.message)
      }
    })

    newSocket.on('leaderboard_update', (data) => {
      if (data && data.leaderboard) {
        setLeaderboard(data.leaderboard.map(t => ({
          ...t,
          lastFixed: new Date(t.lastFixed)
        })))
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

    return () => {
      newSocket.disconnect()
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
    return filtered
      .sort((a, b) => {
        if (b.solved !== a.solved) return b.solved - a.solved
        return (new Date(a.lastFixed) || 0) - (new Date(b.lastFixed) || 0)
      })
      .map((team, index) => ({
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
    setConsoleOutput('Submitting code for admin review...')
    try {
      const response = await axios.post(`${BACKEND_URL}/api/submit`, {
        teamName: session.id,
        questionId: currentQuestionId,
        submittedCode: editedCode
      })

      if (response.data.success) {
        setConsoleOutput(`Submission Successful: ${response.data.message}`)
      } else {
        setConsoleOutput(`${response.data.message || 'Failed'}\n${response.data.error || ''}`)
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
      fetchSubmissionHistory()
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
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            const textarea = e.target;
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const newCode = editedCode.substring(0, start) + '\t' + editedCode.substring(end);
                            setEditedCode(newCode);
                            setTimeout(() => {
                              textarea.selectionStart = textarea.selectionEnd = start + 1;
                            }, 0);
                          }
                        }}
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
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            const textarea = e.target;
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const newInput = customInput.substring(0, start) + '\t' + customInput.substring(end);
                            setCustomInput(newInput);
                            setTimeout(() => {
                              textarea.selectionStart = textarea.selectionEnd = start + 1;
                            }, 0);
                          }
                        }}
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
                              <div style={{fontSize: '0.85rem', color: '#aaa', marginTop: '4px'}}>
                                Submitted: {appr.submissionTime ? new Date(appr.submissionTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Unknown time'}
                              </div>
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
                  <>
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

                    <section className="panel admin-panel" style={{ marginTop: '20px' }}>
                      <div className="section-title">Submission History (Approved)</div>
                      <div className="admin-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {submissionHistory.length === 0 ? (
                          <div className="empty-state">No approved submissions yet.</div>
                        ) : (
                          submissionHistory.map((entry, idx) => (
                            <div key={idx} className="admin-row" style={{ fontSize: '0.85rem' }}>
                              <div className="admin-row-main">
                                <strong>{entry.teamName}</strong>
                                <span>{QUESTIONS[entry.questionId]?.title || entry.questionId}</span>
                                <span style={{ color: '#aaa' }}>
                                  {entry.completionTime ? new Date(entry.completionTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </>
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
