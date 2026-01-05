const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function submitTest(payload) {
  return request('/api/tests/submit', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function getResult(id) {
  return request(`/api/results/${id}`, { method: 'GET' })
}
