export function sessionKey(email) {
  return `mh_sessions_${String(email).toLowerCase()}`
}

export function loadSessions(email) {
  try {
    const raw = localStorage.getItem(sessionKey(email))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSessions(email, sessions) {
  localStorage.setItem(sessionKey(email), JSON.stringify(sessions))
}

export function addSession(email, session) {
  const sessions = loadSessions(email)
  sessions.push(session)
  saveSessions(email, sessions)
  return session
}

export function getSession(email, id) {
  const sessions = loadSessions(email)
  return sessions.find(s => s.id === id) || null
}

export function clearSessions(email) {
  localStorage.removeItem(sessionKey(email))
}
