// frontend/src/components/TwoFactorSettings.js

import React, { useState, useEffect } from 'react';
import umhwApi from '../api/umhwApi';
import './TwoFactorSettings.css';

function TwoFactorSettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1); // 1: QR, 2: Verify, 3: Backup Codes

  // Check 2FA status on component mount
  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
  try {
    const res = await umhwApi.get('/profile/profile');
    // ✅ FIXED: Check user object directly, not nested
    const userTwoFactorEnabled = res.data.user?.twoFactorEnabled || false;
    console.log('2FA Status:', userTwoFactorEnabled); // Debug log
    setTwoFactorEnabled(userTwoFactorEnabled);
    setIsLoading(false);
  } catch (err) {
    console.error('Failed to check 2FA status:', err);
    setIsLoading(false);
  }
};

  // Enable 2FA - Get QR Code
  const handleEnable2FA = async () => {
    setMessage('');
    setIsLoading(true);

    try {
      const res = await umhwApi.post('/auth/2fa/enable');
      
      setQrCodeUrl(res.data.qrCodeUrl);
      setBackupCodes(res.data.backupCodes);
      setShowSetup(true);
      setStep(1);
      setMessage('');
      
    } catch (err) {
      console.error('Enable 2FA error:', err);
      setMessage(err.response?.data?.message || '❌ Failed to enable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify 2FA Setup
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setMessage('');

    if (verificationCode.length !== 6) {
      setMessage('❌ Code must be 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      const res = await umhwApi.post('/auth/2fa/verify', {
        token: verificationCode
      });

      setMessage('✅ ' + res.data.message);
      setStep(3); // Show backup codes
      setVerificationCode('');
      
    } catch (err) {
      console.error('Verify 2FA error:', err);
      setMessage(err.response?.data?.message || '❌ Invalid verification code');
      setVerificationCode('');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete Setup
  const handleCompleteSetup = () => {
    setTwoFactorEnabled(true);
    setShowSetup(false);
    setStep(1);
    setQrCodeUrl('');
    setBackupCodes([]);
    setMessage('✅ 2FA enabled successfully!');
  };

  // Disable 2FA
  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!password) {
      setMessage('❌ Password is required');
      return;
    }

    setIsLoading(true);

    try {
      const res = await umhwApi.post('/auth/2fa/disable', { password });
      
      setTwoFactorEnabled(false);
      setPassword('');
      setMessage('✅ ' + res.data.message);
      
    } catch (err) {
      console.error('Disable 2FA error:', err);
      setMessage(err.response?.data?.message || '❌ Failed to disable 2FA');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate Backup Codes
  const handleRegenerateBackupCodes = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!password) {
      setMessage('❌ Password is required');
      return;
    }

    setIsLoading(true);

    try {
      const res = await umhwApi.post('/auth/2fa/regenerate-backup-codes', { password });
      
      setBackupCodes(res.data.backupCodes);
      setPassword('');
      setStep(3); // Show new backup codes
      setShowSetup(true);
      setMessage('✅ ' + res.data.message);
      
    } catch (err) {
      console.error('Regenerate codes error:', err);
      setMessage(err.response?.data?.message || '❌ Failed to regenerate backup codes');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  // Download Backup Codes
  const handleDownloadBackupCodes = () => {
    const content = `Universal Medical Wallet - 2FA Backup Codes\n\n` +
                    `Generated: ${new Date().toLocaleString()}\n\n` +
                    `IMPORTANT: Store these codes in a safe place!\n` +
                    `Each code can only be used once.\n\n` +
                    `Backup Codes:\n` +
                    backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `2fa-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && !showSetup) {
    return <div className="two-factor-loading">Loading 2FA settings...</div>;
  }

  return (
    <div className="two-factor-settings">
      <h2>🔐 Two-Factor Authentication</h2>
      
      {!showSetup && (
        <div className="two-factor-status">
          <div className={`status-badge ${twoFactorEnabled ? 'enabled' : 'disabled'}`}>
            {twoFactorEnabled ? '✅ Enabled' : '❌ Disabled'}
          </div>
          
          <p className="status-description">
            {twoFactorEnabled 
              ? 'Your account is protected with two-factor authentication.'
              : 'Add an extra layer of security to your account.'}
          </p>

          {!twoFactorEnabled ? (
            <div className="enable-section">
              <h3>Enable 2FA</h3>
              <p>
                Two-factor authentication adds an extra layer of security by requiring 
                a code from your phone in addition to your password.
              </p>
              <button 
                onClick={handleEnable2FA}
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? '⏳ Setting up...' : '🔒 Enable 2FA'}
              </button>
            </div>
          ) : (
            <div className="manage-section">
              <h3>Manage 2FA</h3>
              
              {/* Regenerate Backup Codes */}
              <div className="action-card">
                <h4>🔄 Regenerate Backup Codes</h4>
                <p>Generate new backup codes (old codes will be invalidated)</p>
                <form onSubmit={handleRegenerateBackupCodes}>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="submit" disabled={isLoading}>
                    {isLoading ? '⏳ Regenerating...' : 'Regenerate Codes'}
                  </button>
                </form>
              </div>

              {/* Disable 2FA */}
              <div className="action-card danger">
                <h4>🚫 Disable 2FA</h4>
                <p>Remove two-factor authentication from your account</p>
                <form onSubmit={handleDisable2FA}>
                  <input
                    type="password"
                    placeholder="Enter your password to confirm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-danger" disabled={isLoading}>
                    {isLoading ? '⏳ Disabling...' : 'Disable 2FA'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {showSetup && (
        <div className="two-factor-setup">
          {/* Step 1: Scan QR Code */}
          {step === 1 && (
            <div className="setup-step">
              <h3>Step 1: Scan QR Code</h3>
              <p>Use Google Authenticator or Authy to scan this QR code:</p>
              
              {qrCodeUrl && (
                <div className="qr-code-container">
                  <img src={qrCodeUrl} alt="2FA QR Code" />
                </div>
              )}

              <button 
                onClick={() => setStep(2)}
                className="btn-primary"
              >
                Next: Verify Code →
              </button>

              <button 
                onClick={() => setShowSetup(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Step 2: Verify Code */}
          {step === 2 && (
            <div className="setup-step">
              <h3>Step 2: Verify Code</h3>
              <p>Enter the 6-digit code from your authenticator app:</p>
              
              <form onSubmit={handleVerify2FA}>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="verification-input"
                  autoFocus
                  required
                />
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? '⏳ Verifying...' : 'Verify & Enable'}
                </button>
              </form>

              <button 
                onClick={() => setStep(1)}
                className="btn-secondary"
              >
                ← Back
              </button>
            </div>
          )}

          {/* Step 3: Backup Codes */}
          {step === 3 && backupCodes.length > 0 && (
            <div className="setup-step">
              <h3>⚠️ Save Your Backup Codes</h3>
              <p className="warning-text">
                Store these codes in a safe place! Each code can only be used once.
              </p>
              
              <div className="backup-codes-grid">
                {backupCodes.map((code, index) => (
                  <div key={index} className="backup-code">
                    {code}
                  </div>
                ))}
              </div>

              <div className="backup-actions">
                <button 
                  onClick={handleDownloadBackupCodes}
                  className="btn-secondary"
                >
                  📥 Download Codes
                </button>
                <button 
                  onClick={handleCompleteSetup}
                  className="btn-primary"
                >
                  ✅ I've Saved My Codes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {message && (
        <p className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default TwoFactorSettings;