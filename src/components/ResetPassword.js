// frontend/src/components/ResetPassword.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import umhwApi from '../api/umhwApi';
import './AuthForm.css';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const location = useLocation();
  const { token: urlToken } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (urlToken) {
      setToken(urlToken);
      setMessage('');
    } else {
      setMessage('❌ Invalid or missing reset token.');
    }
  }, [urlToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!token) {
      setMessage('❌ Invalid or missing reset token.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('❌ Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setMessage('❌ Password must be at least 8 characters long');
      return;
    }

    if (!/(?=.*[a-z])/.test(password)) {
      setMessage('❌ Password must contain at least one lowercase letter');
      return;
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      setMessage('❌ Password must contain at least one uppercase letter');
      return;
    }

    if (!/(?=.*\d)/.test(password)) {
      setMessage('❌ Password must contain at least one number');
      return;
    }

    try {
      const res = await umhwApi.post('/auth/reset-password', { token, password });
      setMessage(res.data.message || '✅ Password reset successful');

      setTimeout(() => navigate('/?resetSuccess=true'), 2000);
    } catch (err) {
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map(e => e.message).join(', ');
        setMessage(`❌ ${errorMessages}`);
      } else if (err.response?.data?.message) {
        setMessage(`❌ ${err.response.data.message}`);
      } else {
        setMessage('❌ Error resetting password. Please try again.');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>🔑 Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              New Password
              <small>
                Must be 8+ characters with uppercase, lowercase, and number
              </small>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="e.g., MyNewPass123"
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Re-enter your password"
            />
          </div>

          <button type="submit" disabled={!token}>
            🔄 Reset Password
          </button>
        </form>

        {message && (
          <div className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {!token && (
          <div className="auth-links">
            <p>
              <button onClick={() => navigate('/')}>
                ← Back to Login
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;