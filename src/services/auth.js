const USERS_KEY = 'mh_users'

function toHex(buffer) {
  const bytes = new Uint8Array(buffer)
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0')
  return s
}

export async function hash(text) {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return toHex(buf)
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getUserByEmail(email) {
  const users = loadUsers()
  return users.find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null
}

export async function signup({ email, password, displayName, question, answer }) {
  const users = loadUsers()
  const existing = users.find(u => u.email.toLowerCase() === String(email).toLowerCase())
  if (existing) throw new Error('Account already exists')
  const passwordHash = await hash(password)
  const answerHash = await hash(answer)
  const user = { email, passwordHash, displayName: displayName || '', question, answerHash, createdAt: new Date().toISOString() }
  users.push(user)
  saveUsers(users)
  return user
}

export async function login(email, password) {
  const users = loadUsers()
  let u = users.find(x => x.email.toLowerCase() === String(email).toLowerCase())
  if (!u) {
    const passwordHash = await hash(password || '')
    u = { email, passwordHash, displayName: '', createdAt: new Date().toISOString() }
    users.push(u)
    saveUsers(users)
  }
  return { email: u.email, displayName: u.displayName }
}

export async function resetPassword(email, answer, newPassword) {
  const users = loadUsers()
  const idx = users.findIndex(x => x.email.toLowerCase() === String(email).toLowerCase())
  if (idx === -1) throw new Error('Account not found')
  const answerHash = await hash(answer)
  if (users[idx].answerHash !== answerHash) throw new Error('Answer mismatch')
  const newHash = await hash(newPassword)
  users[idx].passwordHash = newHash
  saveUsers(users)
  return { email: users[idx].email, displayName: users[idx].displayName }
}

export async function updateProfile(email, { displayName, question, answer }) {
  const users = loadUsers()
  const idx = users.findIndex(x => x.email.toLowerCase() === String(email).toLowerCase())
  if (idx === -1) throw new Error('Account not found')
  if (typeof displayName === 'string') users[idx].displayName = displayName
  if (typeof question === 'string') users[idx].question = question
  if (typeof answer === 'string') users[idx].answerHash = await hash(answer)
  saveUsers(users)
  return users[idx]
}

export async function deleteAccount(email) {
  const users = loadUsers()
  const idx = users.findIndex(x => x.email.toLowerCase() === String(email).toLowerCase())
  if (idx === -1) throw new Error('Account not found')
  users.splice(idx, 1)
  saveUsers(users)
  return true
}
