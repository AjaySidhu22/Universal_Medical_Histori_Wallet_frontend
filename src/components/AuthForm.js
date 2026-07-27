// frontend/src/components/AuthForm.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Heart,
  Mail,
  Lock,
  User,
  CheckCircle,
  XCircle,
  Loader,
  LogIn,
  UserPlus,
  Send,
  KeyRound,
  ArrowLeft,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import umhwApi from '../api/umhwApi';
import './AuthForm.css';

function AuthForm() {
  const [formType, setFormType] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [role, setRole] = useState('patient');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('resetSuccess')) {
      setMessage('Password reset successful. Please log in with your new password.');
      setMessageType('success');
    }
    if (location.state?.verificationSuccess) {
      setMessage('Email verified successfully. Please log in.');
      setMessageType('success');
    }
  }, [location]);

  useEffect(() => {
    if (formType !== 'register' || !username || username.length < 3) {
      setUsernameStatus(null);
      setUsernameSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setUsernameStatus('checking');
      try {
        const res = await umhwApi.get(`/auth/check-username?username=${username}`);
        if (res.data.available) {
          setUsernameStatus('available');
          setUsernameSuggestions([]);
        } else {
          setUsernameStatus('taken');
          setUsernameSuggestions(res.data.suggestions || []);
        }
      } catch {
        setUsernameStatus('error');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username, formType]);

  const setError = (msg) => { setMessage(msg); setMessageType('error'); };
  const setSuccess = (msg) => { setMessage(msg); setMessageType('success'); };

  const toggle = () => {
    setFormType(f => f === 'login' ? 'register' : 'login');
    setMessage('');
    setUsername('');
    setUsernameStatus(null);
    setUsernameSuggestions([]);
  };

  const validatePassword = (pw) => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])/.test(pw)) return 'Password must contain a lowercase letter';
    if (!/(?=.*[A-Z])/.test(pw)) return 'Password must contain an uppercase letter';
    if (!/(?=.*\d)/.test(pw)) return 'Password must contain a number';
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      if (formType === 'register') {
        if (!username || username.length < 3) {
          setError('Username must be at least 3 characters');
          return;
        }
        if (usernameStatus === 'taken') {
          setError('Username is already taken');
          return;
        }
        const pwError = validatePassword(password);
        if (pwError) { setError(pwError); return; }

        const res = await umhwApi.post('/auth/register', {
          email, password, role,
          username: username.toLowerCase()
        });
        navigate('/verify-email', { state: { email, message: res.data.message } });

      } else if (formType === 'login') {
        const res = await umhwApi.post('/auth/login', { email, password });
        if (res.data.requires2FA) {
          navigate('/2fa-login', { state: { userId: res.data.userId, email: res.data.email } });
          return;
        }
        sessionStorage.setItem('accessToken', res.data.accessToken);
        sessionStorage.setItem('userEmail', res.data.user.email);
        window.dispatchEvent(new Event('storage'));
        navigate('/dashboard');

      } else if (formType === 'forgot') {
        const res = await umhwApi.post('/auth/request-password-reset', { email });
        setSuccess(res.data.message || 'If this email exists, a reset link has been sent.');

      } else if (formType === 'reset') {
        const pwError = validatePassword(password);
        if (pwError) { setError(pwError); return; }
        const res = await umhwApi.post('/auth/reset-password', { token, password });
        setSuccess(res.data.message);
        setTimeout(() => setFormType('login'), 2000);
      }

    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'An error occurred. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const titles = {
    login: 'Sign in to your account',
    register: 'Create a new account',
    forgot: 'Reset your password',
    reset: 'Set a new password'
  };

  const submitIcons = {
    login: LogIn,
    register: UserPlus,
    forgot: Send,
    reset: KeyRound
  };

  const submitLabels = {
    login: 'Sign In',
    register: 'Create Account',
    forgot: 'Send Reset Link',
    reset: 'Reset Password'
  };

  const SubmitIcon = submitIcons[formType];

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <Heart size={20} strokeWidth={2.5} />
          </div>
          <span className="auth-brand-name">MediWallet</span>
        </div>

        {/* Title */}
        <h1 className="auth-title">{titles[formType]}</h1>
        <p className="auth-subtitle">
          {formType === 'login' && 'Welcome back. Enter your credentials to continue.'}
          {formType === 'register' && 'Join MediWallet to manage your health records securely.'}
          {formType === 'forgot' && 'Enter your email and we will send a reset link.'}
          {formType === 'reset' && 'Enter your new password below.'}
        </p>

        <form onSubmit={submit}>

          {/* Email */}
          {(formType === 'login' || formType === 'register' || formType === 'forgot') && (
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                className="auth-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
          )}

          {/* Username */}
          {formType === 'register' && (
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="username">
                Username
                <small>Used to identify you on the platform</small>
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="username"
                  className="auth-input"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase())}
                  required
                  minLength={3}
                  maxLength={30}
                  placeholder="e.g., john_smith"
                  disabled={isSubmitting}
                  style={{
                    paddingRight: '40px',
                    borderColor: usernameStatus === 'available'
                      ? 'var(--color-success)'
                      : usernameStatus === 'taken'
                      ? 'var(--color-danger)'
                      : undefined
                  }}
                />
                <span className="auth-input-icon">
                  {usernameStatus === 'checking' && <Loader size={16} className="spinning" style={{ color: 'var(--color-text-muted)' }} />}
                  {usernameStatus === 'available' && <Check size={16} style={{ color: 'var(--color-success)' }} />}
                  {usernameStatus === 'taken' && <X size={16} style={{ color: 'var(--color-danger)' }} />}
                </span>
              </div>
              {usernameStatus === 'available' && (
                <p className="username-status-available">
                  <Check size={12} /> Username is available
                </p>
              )}
              {usernameStatus === 'taken' && (
                <div>
                  <p className="username-status-taken">
                    <X size={12} /> Username is already taken
                  </p>
                  {usernameSuggestions.length > 0 && (
                    <div className="username-suggestions">
                      {usernameSuggestions.map(s => (
                        <button
                          key={s}
                          type="button"
                          className="username-suggestion-btn"
                          onClick={() => setUsername(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Password */}
          {(formType === 'login' || formType === 'register' || formType === 'reset') && (
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="password">
                Password
                {formType === 'register' && (
                  <small>8+ characters with uppercase, lowercase, and number</small>
                )}
              </label>
              <input
                id="password"
                className="auth-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                disabled={isSubmitting}
                autoComplete={formType === 'register' ? 'new-password' : 'current-password'}
              />
            </div>
          )}

          {/* Account Type */}
          {formType === 'register' && (
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="role">Account Type</label>
              <select
                id="role"
                className="auth-select"
                value={role}
                onChange={e => setRole(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="patient">Patient — Access my health records</option>
                <option value="doctor">Doctor — Manage patient records</option>
              </select>
            </div>
          )}

          {/* Reset Token */}
          {formType === 'reset' && (
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="token">Reset Token</label>
              <input
                id="token"
                className="auth-input"
                value={token}
                onChange={e => setToken(e.target.value)}
                required
                placeholder="Enter token from email"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit"
            disabled={isSubmitting || (formType === 'register' && usernameStatus === 'taken')}
          >
            {isSubmitting
              ? <><Loader size={16} className="spinning" /> Processing...</>
              : <><SubmitIcon size={16} /> {submitLabels[formType]}</>
            }
          </button>
        </form>

        {/* Message */}
        {message && (
          <div className={`auth-message ${messageType === 'success' ? 'auth-message-success' : 'auth-message-error'}`}>
            {messageType === 'success'
              ? <CheckCircle size={16} />
              : <AlertCircle size={16} />
            }
            {message}
          </div>
        )}

        {/* Links */}
        <div className="auth-links">
          {formType === 'login' && (
            <>
              <button className="auth-link-btn" onClick={() => { setFormType('forgot'); setMessage(''); }}>
                Forgot your password?
              </button>
              <button className="auth-link-btn" onClick={toggle}>
                Don't have an account? Sign up
              </button>
            </>
          )}
          {formType === 'register' && (
            <button className="auth-link-btn" onClick={toggle}>
              Already have an account? Sign in
            </button>
          )}
          {formType === 'forgot' && (
            <button className="auth-link-btn" onClick={() => { setFormType('login'); setMessage(''); }}>
              <ArrowLeft size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Back to Sign In
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default AuthForm;