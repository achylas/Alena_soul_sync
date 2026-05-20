/**
 * OCD ML Model Service
 * Calls the Hugging Face Spaces API for:
 * 1. OCD Detection (binary: present/not)
 * 2. Severity Classification (Subclinical/Mild/Moderate/Severe/Extreme)
 *
 * Falls back to rule-based Y-BOCS scoring if API is unavailable.
 */

const HF_API_URL = import.meta.env.VITE_HF_OCD_API || ''

/**
 * Call the Hugging Face model API
 * @param {number[]} answers - array of 10 answers (0-4 each)
 * @returns {Promise<{ocd_detected, ocd_confidence, severity, severity_probabilities, obs_total, comp_total, total_score}>}
 */
export async function predictOCD(answers) {
  if (!HF_API_URL) {
    // Fallback: rule-based scoring (same as before)
    return fallbackPredict(answers)
  }

  try {
    const res = await fetch(`${HF_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()
    return { ...data, source: 'ml_model' }
  } catch (e) {
    console.warn('HF API unavailable, using fallback scoring:', e.message)
    return fallbackPredict(answers)
  }
}

/**
 * Rule-based fallback (Y-BOCS clinical thresholds)
 * Used when HF API is not configured or unreachable
 */
function fallbackPredict(answers) {
  const obs_total  = answers.slice(0, 5).reduce((s, v) => s + (v || 0), 0)
  const comp_total = answers.slice(5).reduce((s, v) => s + (v || 0), 0)
  const total_score = obs_total + comp_total

  const ocd_detected = total_score > 7

  let severity
  if (total_score <= 7)       severity = 'Subclinical'
  else if (total_score <= 15) severity = 'Mild'
  else if (total_score <= 23) severity = 'Moderate'
  else if (total_score <= 31) severity = 'Severe'
  else                        severity = 'Extreme'

  // Simulate probability distribution around the predicted class
  const classes = ['Subclinical', 'Mild', 'Moderate', 'Severe', 'Extreme']
  const idx = classes.indexOf(severity)
  const probs = classes.reduce((acc, c, i) => {
    const dist = Math.abs(i - idx)
    acc[c] = dist === 0 ? 75 : dist === 1 ? 15 : dist === 2 ? 7 : 2
    return acc
  }, {})

  return {
    ocd_detected,
    ocd_confidence: ocd_detected ? 82 : 78,
    severity,
    severity_probabilities: probs,
    obs_total,
    comp_total,
    total_score,
    source: 'rule_based'
  }
}

const API_KEY = import.meta.env.VITE_GEMINI_KEY || ''
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`

async function ask(prompt) {
  if (!API_KEY) throw new Error('No Gemini API key. Add VITE_GEMINI_KEY to your .env file.')
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
    })
  })
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.'
}

/**
 * Generate a personalized dashboard insight from recent sessions.
 * @param {object} user - { displayName, email }
 * @param {Array}  sessions - last 5 sessions with score, severity, details
 */
export async function getDashboardInsight(user, sessions) {
  if (!sessions.length) return 'Complete at least one assessment to receive AI insights.'

  const summary = sessions.slice(-5).map((s, i) => {
    const d = s.details || {}
    return `Session ${i + 1} (${new Date(s.date).toLocaleDateString()}): ` +
      `Test=${s.test}, Score=${s.score}, Severity=${s.severity}, ` +
      `Stress=${d.stress ?? 'N/A'}/10, Sleep=${d.sleepHours ?? 'N/A'}h, ` +
      `Activity=${d.activity ?? 'N/A'}/10, ScreenTime=${d.screenTime ?? 'N/A'}h`
  }).join('\n')

  const prompt = `You are a compassionate mental health assistant. Analyze this user's recent assessment data and provide a brief, warm, personalized insight (3-4 sentences max). Focus on trends, what's going well, and one actionable suggestion. Do NOT diagnose. Be supportive and specific to their data.

User: ${user.displayName || user.email}
Recent sessions:
${summary}

Provide insight:`

  return ask(prompt)
}

/**
 * Generate AI interpretation of an OCD (Y-BOCS) result.
 * @param {number} score - total Y-BOCS score
 * @param {number} obsessionScore - subscale 1 score (0-20)
 * @param {number} compulsionScore - subscale 2 score (0-20)
 * @param {string} severity - Mild/Moderate/Severe/Extreme
 * @param {Array}  answers - array of 10 answer values
 */
export async function getOCDInsight(score, obsessionScore, compulsionScore, severity, answers) {
  const prompt = `You are a compassionate mental health assistant. A user just completed the Yale-Brown Obsessive Compulsive Scale (Y-BOCS).

Results:
- Total Score: ${score}/40 (${severity})
- Obsession Subscale: ${obsessionScore}/20
- Compulsion Subscale: ${compulsionScore}/20
- Individual answers (0=None, 4=Extreme): ${answers.join(', ')}

Provide a brief, warm, non-diagnostic interpretation (4-5 sentences). Explain what these scores generally indicate, note whether obsessions or compulsions appear more prominent, and suggest one helpful next step. Remind them this is a screening tool, not a diagnosis. Be supportive.`

  return ask(prompt)
}

/**
 * Generate AI interpretation of a PHQ-9 depression result.
 */
export async function getPHQ9Insight(score, severity, details) {
  const d = details || {}
  const prompt = `You are a compassionate mental health assistant. A user completed the PHQ-9 depression screening.

Results:
- PHQ-9 Score: ${score}/27 (${severity})
- Stress: ${d.stress ?? 'N/A'}/10
- Sleep: ${d.sleepHours ?? 'N/A'} hours
- Activity: ${d.activity ?? 'N/A'}/10
- Screen time: ${d.screenTime ?? 'N/A'} hours
- Notes: "${d.notes || 'none'}"

Provide a brief, warm, supportive interpretation (4-5 sentences). Note what the score indicates, highlight any lifestyle factors that may be contributing, and suggest one concrete action. Remind them this is a screening tool, not a diagnosis.`

  return ask(prompt)
}

/**
 * Answer a user question about their mental health data.
 */
export async function chatWithAI(question, sessionContext) {
  const ctx = sessionContext
    ? `User's recent data: ${sessionContext}`
    : 'No session data available.'

  const prompt = `You are a compassionate, knowledgeable mental health assistant for the SoulSync app. Answer the user's question helpfully and supportively. Do not diagnose. Recommend professional help when appropriate.

${ctx}

User question: ${question}

Answer:`

  return ask(prompt)
}

/**
 * Compute a composite Mental Wellness Index (0-100) from all sessions.
 * Higher = better wellness.
 */
export function computeWellnessIndex(sessions) {
  if (!sessions.length) return null

  const recent = sessions.slice(-10)

  // PHQ-9 component (lower score = better, max 27)
  const phqSessions = recent.filter(s => s.test?.includes('PHQ') || s.test?.includes('Assessment') || s.test?.includes('Depression'))
  const avgPHQ = phqSessions.length
    ? phqSessions.reduce((a, b) => a + (Number(b.score) || 0), 0) / phqSessions.length
    : 13.5 // neutral if no data

  // OCD component (lower = better, max 40)
  const ocdSessions = recent.filter(s => s.test?.includes('OCD') || s.test?.includes('Y-BOCS'))
  const avgOCD = ocdSessions.length
    ? ocdSessions.reduce((a, b) => a + (Number(b.score) || 0), 0) / ocdSessions.length
    : 20 // neutral

  // Lifestyle component from details
  const withDetails = recent.filter(s => s.details)
  const avgStress = withDetails.length
    ? withDetails.reduce((a, b) => a + (b.details.stress || 5), 0) / withDetails.length
    : 5
  const avgSleep = withDetails.length
    ? withDetails.reduce((a, b) => a + (b.details.sleepHours || 7), 0) / withDetails.length
    : 7
  const avgActivity = withDetails.length
    ? withDetails.reduce((a, b) => a + (b.details.activity || 5), 0) / withDetails.length
    : 5

  // Normalize each to 0-1 (1 = best)
  const phqNorm     = 1 - (avgPHQ / 27)          // lower PHQ = better
  const ocdNorm     = 1 - (avgOCD / 40)           // lower OCD = better
  const stressNorm  = 1 - (avgStress / 10)        // lower stress = better
  const sleepNorm   = Math.min(avgSleep / 8, 1)   // 8h = perfect
  const activityNorm = Math.min(avgActivity / 8, 1) // 8/10 = perfect

  // Weighted composite
  const index = (
    phqNorm     * 0.35 +
    ocdNorm     * 0.25 +
    stressNorm  * 0.20 +
    sleepNorm   * 0.12 +
    activityNorm * 0.08
  ) * 100

  return Math.round(Math.max(0, Math.min(100, index)))
}

/**
 * Simple linear regression trend on score history.
 * Returns: 'improving' | 'worsening' | 'stable' | 'insufficient'
 */
export function scoreTrend(sessions) {
  const scored = sessions
    .filter(s => typeof s.score === 'number')
    .slice(-8)

  if (scored.length < 3) return 'insufficient'

  const n = scored.length
  const xs = scored.map((_, i) => i)
  const ys = scored.map(s => s.score)

  const sumX  = xs.reduce((a, b) => a + b, 0)
  const sumY  = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0)
  const sumX2 = xs.reduce((a, x) => a + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

  if (slope < -0.3) return 'improving'   // score going down = better for PHQ/OCD
  if (slope >  0.3) return 'worsening'
  return 'stable'
}
