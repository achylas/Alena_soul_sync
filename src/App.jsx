import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'

const Login        = lazy(() => import('./pages/Login'))
const Signup       = lazy(() => import('./pages/Signup'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Dashboard    = lazy(() => import('./pages/Dashboard'))
const Profile      = lazy(() => import('./pages/Profile'))
const Tests        = lazy(() => import('./pages/Tests'))
const Settings     = lazy(() => import('./pages/Settings'))
const Results      = lazy(() => import('./pages/Results'))
const Report       = lazy(() => import('./pages/Report'))
const Tracking     = lazy(() => import('./pages/Tracking'))
const History      = lazy(() => import('./pages/History'))
const TestsHub     = lazy(() => import('./pages/TestHub'))
const OCDTest      = lazy(() => import('./pages/OCDTest'))
const OCDResults   = lazy(() => import('./pages/OCDResults'))
const AIInsights   = lazy(() => import('./pages/AIInsights'))
const GAD7Test     = lazy(() => import('./pages/GAD7Test'))

function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="muted" style={{ padding: 20 }}>Loading…</div>}>
        <Routes>
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index             element={<Dashboard />} />
            <Route path="dashboard"  element={<Dashboard />} />
            <Route path="profile"    element={<Profile />} />
            <Route path="tests"      element={<Tests />} />
            <Route path="results/:id" element={<Results />} />
            <Route path="tracking"   element={<Tracking />} />
            <Route path="testhub"    element={<TestsHub />} />
            <Route path="history"    element={<History />} />
            <Route path="settings"   element={<Settings />} />
            <Route path="report"     element={<Report />} />
            {/* NEW ROUTES */}
            <Route path="ocd"              element={<OCDTest />} />
            <Route path="ocd-results/:id"  element={<OCDResults />} />
            <Route path="ai"               element={<AIInsights />} />
            <Route path="gad7"             element={<GAD7Test />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
