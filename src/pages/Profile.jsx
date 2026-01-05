import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserByEmail } from '../services/auth';
import { useToast } from '../components/ToastProvider';
import '../styles/profile.css';



export default function Profile() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast() || {};
  const record = user ? getUserByEmail(user.email) : null;

  const fullName = user?.displayName || 'N/A';
  const email = user?.email || 'N/A';
  const username = record?.username || 'Not set';
  const securityQuestion = record?.question || 'Not set';
  const securityAnswer = !!record?.answerHash ? 'Stored' : 'Not set';

  async function onDelete() {
    if (!user) return;
    const ok = window.confirm('Delete account and all local sessions? This cannot be undone.');
    if (!ok) return;
    await deleteAccount();
    showToast && showToast('Account deleted', 'success');
    navigate('/signup');
  }

  return (
    <div className="profile-screen">
      <div className="profile-card">
        <div className="profile-title">My Profile</div>

        <div className="profile-grid">
          {/* Row 1: Full Name + Username */}
          <div className="profile-item">
            <div className="profile-label">Full Name</div>
            <div className="profile-input">
              <span className="profile-icon">👤</span>
              <input value={fullName} disabled />
            </div>
          </div>
          <div className="profile-item">
            <div className="profile-label">Username</div>
            <div className="profile-input">
              <span className="profile-icon">🆔</span>
              <input value={username} disabled />
            </div>
          </div>

          {/* Row 2: Email + Security Question */}
          <div className="profile-item">
            <div className="profile-label">Email</div>
            <div className="profile-input">
              <span className="profile-icon">📧</span>
              <input value={email} disabled />
            </div>
          </div>
          <div className="profile-item">
            <div className="profile-label">Security Question</div>
            <div className="profile-input">
              <span className="profile-icon">❓</span>
              <input value={securityQuestion} disabled />
            </div>
          </div>

          {/* Row 3: Security Answer */}
          <div className="profile-item full-width">
            <div className="profile-label">Security Answer</div>
            <div className="profile-input">
              <span className="profile-icon">🔑</span>
              <input value={securityAnswer} disabled />
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="btn btn-danger" onClick={onDelete}>Delete Account</button>
        </div>
      </div>
    </div>
  );
}
