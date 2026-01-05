import { useNavigate } from 'react-router-dom'
import '../styles/test-hub.css'

const TESTS = [
  {
    id: 'anxiety',
    title: 'Anxiety Test',
    description: 'Measures worry, restlessness, and nervousness',
    color: 'blue',
    icon: '🧠'
  },
  {
    id: 'depression',
    title: 'Depression Test',
    description: 'Evaluates mood, energy, and hopelessness',
    color: 'purple',
    icon: '🌧️'
  },
  {
    id: 'stress',
    title: 'Stress Assessment',
    description: 'Analyzes daily stress and pressure levels',
    color: 'green',
    icon: '⚡'
  }
]

export default function TestsHub() {
  const navigate = useNavigate()

  return (
    <div className="tests-hub">
      <div className="tests-hub-header">
        <h1>Mental Health Assessments</h1>
        <p className="muted">
          Choose a test. Answer honestly. Your results stay private.
        </p>
      </div>

      <div className="tests-hub-grid">
        {TESTS.map(test => (
          <div
            key={test.id}
            className={`test-hub-card ${test.color}`}
            onClick={() => navigate(`/tests`)}
          >
            <div className="test-hub-icon">{test.icon}</div>

            <div className="test-hub-content">
              <h3>{test.title}</h3>
              <p>{test.description}</p>
            </div>

            <button className="btn primary">Start Test</button>
          </div>
        ))}
      </div>
    </div>
  )
}
