import { useNavigate } from 'react-router-dom'
import '../styles/test-hub.css'

const TESTS = [
  {
    id: 'phq9',
    route: '/tests',
    title: 'Depression Screening',
    subtitle: 'PHQ-9 Scale',
    description: 'The gold-standard 9-question Patient Health Questionnaire for measuring depression severity.',
    color: 'blue',
    icon: '🧠',
    time: '3–5 min',
    questions: 9,
    maxScore: 27,
    tags: ['Depression', 'Mood', 'PHQ-9'],
  },
  {
    id: 'ocd',
    route: '/ocd',
    title: 'OCD Assessment',
    subtitle: 'Y-BOCS Scale',
    description: 'Yale-Brown Obsessive Compulsive Scale — the clinical standard for measuring OCD symptom severity.',
    color: 'amber',
    icon: '🔄',
    time: '5–8 min',
    questions: 10,
    maxScore: 40,
    tags: ['OCD', 'Obsessions', 'Compulsions', 'Y-BOCS'],
    featured: true,
  },
  {
    id: 'anxiety',
    route: '/gad7',
    title: 'Anxiety Screening',
    subtitle: 'GAD-7 Scale',
    description: 'Generalized Anxiety Disorder 7-item scale for measuring anxiety levels and worry patterns.',
    color: 'purple',
    icon: '⚡',
    time: '2–4 min',
    questions: 7,
    maxScore: 21,
    tags: ['Anxiety', 'GAD-7', 'Worry'],
  },
]

export default function TestsHub() {
  const navigate = useNavigate()

  return (
    <div className="tests-hub">
      <div className="tests-hub-header">
        <h2>Mental Health Assessments</h2>
        <p className="muted">
          Clinically validated screening tools. Answer honestly — your results are private and stored locally.
        </p>
      </div>

      <div className="tests-hub-grid">
        {TESTS.map(test => (
          <div
            key={test.id}
            className={`test-hub-card ${test.color}${test.featured ? ' featured' : ''}`}
            onClick={() => navigate(test.route)}
          >
            {test.featured && <div className="test-hub-featured-badge">⭐ Major Module</div>}

            <div className="test-hub-top">
              <div className="test-hub-icon">{test.icon}</div>
              <div className="test-hub-meta">
                <div className="test-hub-subtitle">{test.subtitle}</div>
                <div className="test-hub-stats">
                  <span>📋 {test.questions} questions</span>
                  <span>⏱ {test.time}</span>
                  <span>Max: {test.maxScore}</span>
                </div>
              </div>
            </div>

            <div className="test-hub-content">
              <h3>{test.title}</h3>
              <p>{test.description}</p>
            </div>

            <div className="test-hub-tags">
              {test.tags.map(t => (
                <span key={t} className="test-hub-tag">{t}</span>
              ))}
            </div>

            <button className="btn primary">Start Assessment →</button>
          </div>
        ))}
      </div>

      {/* Info strip */}
      <div className="tests-hub-info">
        <span>🔒</span>
        <p>All assessments use clinically validated scales. Results are stored locally on your device and are never shared. These tools are for screening purposes only — not a substitute for professional diagnosis.</p>
      </div>
    </div>
  )
}
