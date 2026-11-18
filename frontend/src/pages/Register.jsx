import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, UserPlus, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password rule tests
  const rules = {
    length: password.length >= 12,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]{4,30}$/;
    if (!usernameRegex.test(username.trim())) {
      setError('Username must be 4-30 characters and contain only letters, numbers, and underscores.');
      return;
    }

    // Password validation
    if (!isPasswordValid) {
      setError('Please satisfy all password complexity requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-header">
          <div className="auth-logo">
            <Check size={28} strokeWidth={3} />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Get started with your private task manager</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. alex_dev99"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={4}
              maxLength={30}
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
              4-30 characters, letters, numbers, and underscores only.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Minimum 12 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="password-requirements">
              <span style={{ fontWeight: 600 }}>Password Requirements:</span>
              <ul>
                <li className={`req-item ${rules.length ? 'valid' : ''}`}>
                  {rules.length ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>12+ characters</span>
                </li>
                <li className={`req-item ${rules.upper ? 'valid' : ''}`}>
                  {rules.upper ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>Uppercase letter</span>
                </li>
                <li className={`req-item ${rules.lower ? 'valid' : ''}`}>
                  {rules.lower ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>Lowercase letter</span>
                </li>
                <li className={`req-item ${rules.number ? 'valid' : ''}`}>
                  {rules.number ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>Number (0-9)</span>
                </li>
                <li className={`req-item ${rules.special ? 'valid' : ''}`}>
                  {rules.special ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>Special character</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '14px', padding: '12px' }}
            disabled={loading}
          >
            <UserPlus size={18} />
            <span>{loading ? 'Creating Account...' : 'Register'}</span>
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
