// frontend/src/components/TwoFactorSettings.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ShieldCheck, ShieldOff, Key, RefreshCw,
  Smartphone, CheckCircle, AlertCircle, Lock, Copy,
  ChevronLeft, Eye, EyeOff
} from 'lucide-react';
import umhwApi from '../api/umhwApi';
import './TwoFactorSettings.css';

function TwoFactorSettings() {
  const navigate = useNavigate();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('status');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await umhwApi.get('/profile/profile');
        setIs2FAEnabled(res.data.user?.twoFactorEnabled || false);
      } catch {
        setMessage('Failed to load 2FA status.');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const setSuccess = (msg) => { setMessage(msg); setMessageType('success'); };
  const setError = (msg) => { setMessage(msg); setMessageType('error'); };

  const handleEnable = async () => {
    setIsSubmitting(true);
    setMessage('');
    try {
      const res = await umhwApi.post('/auth/2fa/enable');
      setQrCodeUrl(res.data.qrCode);
      setStep('scan');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate 2FA setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    setIsSubmitting(true);
    setMessage('');
    try {
      const res = await umhwApi.post('/auth/2fa/verify', { token: verifyCode });
      setBackupCodes(res.data.backupCodes || []);
      setIs2FAEnabled(true);
      setStep('backup');
      setSuccess('Two-factor authentication enabled successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (!password) { setError('Please enter your password.'); return; }
    setIsSubmitting(true);
    setMessage('');
    try {
      await umhwApi.post('/auth/2fa/disable', { password });
      setIs2FAEnabled(false);
      setStep('status');
      setPassword('');
      setSuccess('Two-factor authentication disabled.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable 2FA.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerate = async () => {
    if (!password) { setError('Please enter your password.'); return; }
    setIsSubmitting(true);
    setMessage('');
    try {
      const res = await umhwApi.post('/auth/2fa/regenerate-backup', { password });
      setBackupCodes(res.data.backupCodes || []);
      setStep('backup');
      setPassword('');
      setSuccess('New backup codes generated. Save them securely.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate backup codes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      setSuccess('Backup codes copied to clipboard.');
    } catch {
      setError('Failed to copy codes.');
    }
  };

  if (loading) {
    return (
      <div className="tfa-page page-content">
        <div className="container">
          <div className="page-loading">
            <div className="spinner spinner-lg" />
            <p>Loading 2FA settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tfa-page page-content">
      <div className="container">

        {/* Back button */}
        <button
          className="btn btn-ghost btn-sm tfa-back-btn"
          onClick={() => navigate('/dashboard')}
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        <div className="tfa-card">

          {/* Header */}
          <div className="tfa-card-header">
            <div className="tfa-header-icon">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="tfa-title">Two-Factor Authentication</h1>
              <p className="tfa-subtitle">
                Add an extra layer of security to your account.
              </p>
            </div>
            <span className={`badge ${is2FAEnabled ? 'badge-success' : 'badge-danger'}`}>
              {is2FAEnabled ? <><ShieldCheck size={11} /> Enabled</> : <><ShieldOff size={11} /> Disabled</>}
            </span>
          </div>

          {/* Message */}
          {message && (
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} tfa-message`}>
              {messageType === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {message}
            </div>
          )}

          {/* Step: Status */}
          {step === 'status' && (
            <div className="tfa-card-body">
              {!is2FAEnabled ? (
                <div className="tfa-enable-section">
                  <div className="tfa-info-box">
                    <Smartphone size={18} />
                    <div>
                      <strong>How it works</strong>
                      <p>
                        After enabling 2FA, you will need to enter a 6-digit code from your
                        authenticator app (Google Authenticator, Authy, etc.) every time you sign in.
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleEnable}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? <><div className="spinner spinner-sm" /> Setting up...</>
                      : <><Shield size={16} /> Enable Two-Factor Authentication</>
                    }
                  </button>
                </div>
              ) : (
                <div className="tfa-manage-section">
                  <div className="tfa-info-box tfa-info-success">
                    <ShieldCheck size={18} />
                    <div>
                      <strong>Your account is protected</strong>
                      <p>
                        Two-factor authentication is active. You will be prompted for
                        a verification code on each login.
                      </p>
                    </div>
                  </div>

                  <div className="tfa-actions-grid">
                    {/* Regenerate backup codes */}
                    <div className="tfa-action-card">
                      <div className="tfa-action-header">
                        <Key size={16} />
                        <h3>Regenerate Backup Codes</h3>
                      </div>
                      <p className="tfa-action-desc">
                        Generate new backup codes. Old codes will be invalidated.
                      </p>
                      <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <div className="tfa-password-wrapper">
                          <input
                            className="form-input"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            className="tfa-password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleRegenerate}
                        disabled={isSubmitting || !password}
                      >
                        <RefreshCw size={13} /> Regenerate Codes
                      </button>
                    </div>

                    {/* Disable 2FA */}
                    <div className="tfa-action-card tfa-action-danger">
                      <div className="tfa-action-header">
                        <ShieldOff size={16} />
                        <h3>Disable 2FA</h3>
                      </div>
                      <p className="tfa-action-desc">
                        Remove two-factor authentication from your account.
                        This will make your account less secure.
                      </p>
                      <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <div className="tfa-password-wrapper">
                          <input
                            className="form-input"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter your password to confirm"
                            autoComplete="current-password"
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            className="tfa-password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={handleDisable}
                        disabled={isSubmitting || !password}
                      >
                        <ShieldOff size={13} /> Disable 2FA
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Scan QR */}
          {step === 'scan' && (
            <div className="tfa-card-body">
              <div className="tfa-scan-section">
                <div className="tfa-step-label">Step 1 — Scan QR Code</div>
                <p className="tfa-step-desc">
                  Open your authenticator app (Google Authenticator, Authy, Microsoft Authenticator)
                  and scan the QR code below.
                </p>
                {qrCodeUrl && (
                  <div className="tfa-qr-container">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="tfa-qr-image" />
                  </div>
                )}

                <div className="tfa-step-label" style={{ marginTop: 'var(--space-6)' }}>
                  Step 2 — Enter Verification Code
                </div>
                <p className="tfa-step-desc">
                  Enter the 6-digit code from your authenticator app.
                </p>
                <div className="form-group tfa-code-group">
                  <input
                    className="form-input tfa-code-input"
                    type="text"
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    disabled={isSubmitting}
                    autoComplete="one-time-code"
                  />
                </div>

                <div className="tfa-scan-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleVerify}
                    disabled={isSubmitting || verifyCode.length !== 6}
                  >
                    {isSubmitting
                      ? <><div className="spinner spinner-sm" /> Verifying...</>
                      : <><CheckCircle size={16} /> Verify & Enable</>
                    }
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => { setStep('status'); setVerifyCode(''); setQrCodeUrl(''); }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step: Backup codes */}
          {step === 'backup' && (
            <div className="tfa-card-body">
              <div className="tfa-backup-section">
                <div className="alert alert-warning" style={{ marginBottom: 'var(--space-5)' }}>
                  <AlertCircle size={15} />
                  <div>
                    <strong>Save these codes securely</strong>
                    <p style={{ margin: 0, marginTop: 'var(--space-1)' }}>
                      These backup codes can be used to access your account if you lose your
                      authenticator device. Each code can only be used once.
                    </p>
                  </div>
                </div>

                <div className="tfa-backup-codes">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="tfa-backup-code">
                      <span className="tfa-backup-code-num">{String(i + 1).padStart(2, '0')}</span>
                      <code className="tfa-backup-code-value">{code}</code>
                    </div>
                  ))}
                </div>

                <div className="tfa-backup-actions">
                  <button className="btn btn-secondary" onClick={handleCopyBackupCodes}>
                    <Copy size={15} /> Copy All Codes
                  </button>
                  <button className="btn btn-primary" onClick={() => setStep('status')}>
                    <CheckCircle size={15} /> Done
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default TwoFactorSettings;