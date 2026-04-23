import { API_BASE } from './config'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : {}
}

export function loginTeam(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchQuestions() {
  return request('/questions')
}

export function fetchLeaderboard() {
  return request('/leaderboard')
}

export function fetchEventState() {
  return request('/event/state')
}

export function submitAttempt(payload) {
  return request('/submissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function broadcastAnnouncement(payload) {
  return request('/admin/announcement', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function closeEvent() {
  return request('/admin/close', {
    method: 'POST',
  })
}

export function publishWinners(payload) {
  return request('/admin/winners', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
