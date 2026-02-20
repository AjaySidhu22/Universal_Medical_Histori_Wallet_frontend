// frontend/src/components/TwoFactorLogin.js

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import umhwApi from '../api/umhwApi';
import './TwoFactorLogin.css';

function TwoFactorLogin() {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [message, setMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get user data from navigation state
  const { userId, email } = location.state || {};

  // Redirect if no user data
  React.useEffect(() => {
    if (!userId || !email) {
      navigate('/');
    }
  }, [userId, email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!code) {
      setMessage('❌ Please enter a code');
      return;
    }

    if (!useBackupCode && code.length !== 6) {
      setMessage('❌ Code must be 6 digits');
      return;
    }

    setIsVerifying(true);

    try {
      const res = await umhwApi.post('/auth/2fa/verify-login', {
        userId,
        token: code,
        isBackupCode: useBackupCode
      });

      // Save token and navigate
      sessionStorage.setItem('accessToken', res.data.accessToken);
      window.dispatchEvent(new Event('storage'));
      
      setMessage('✅ Verification successful!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (err) {
      console.error('2FA verification error:', err);
      setMessage(err.response?.data?.message || '❌ Invalid code. Please try again.');
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/');
  };

  return (
    <div className="two-factor-login-container">
      <div className="two-factor-login-card">
        <div className="login-icon">🔐</div>
        
        <h2>Two-Factor Authentication</h2>
        <p className="login-subtitle">
          Enter the {useBackupCode ? 'backup code' : '6-digit code'} from your authenticator app
        </p>

        <p className="user-email">{email}</p>

        <form onSubmit={handleVerify}>
          <div className="code-input-container">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
              placeholder={useBackupCode ? 'Backup Code' : '000000'}
              className="code-input"
              maxLength={useBackupCode ? 8 : 6}
              autoFocus
              disabled={isVerifying}
            />
          </div>

          <button 
            type="submit" 
            className="verify-btn"
            disabled={isVerifying || !code}
          >
            {isVerifying ? '⏳ Verifying...' : '✅ Verify & Login'}
          </button>
        </form>

        {message && (
          <p className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>
            {message}
          </p>
        )}

        <div className="login-options">
          <button 
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
              setMessage('');
            }}
            className="link-btn"
          >
            {useBackupCode ? '📱 Use Authenticator Code' : '🔑 Use Backup Code'}
          </button>

          <button 
            onClick={handleBackToLogin}
            className="link-btn"
          >
            ← Back to Login
          </button>
        </div>

        <div className="help-text">
          <p>
            <strong>Lost your device?</strong> Use one of your backup codes to login.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TwoFactorLogin;