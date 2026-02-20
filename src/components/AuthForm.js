// frontend/src/components/AuthForm.js

import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import umhwApi from '../api/umhwApi';
import './AuthForm.css';

function AuthForm() {
  const [formType, setFormType] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');  // ✅ NEW
  const [usernameStatus, setUsernameStatus] = useState(null);  // ✅ NEW: null | 'checking' | 'available' | 'taken'
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);  // ✅ NEW
  const [role, setRole] = useState('patient');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('resetSuccess')) {
      setMessage('✅ Password reset successful. Please log in with your new password.');
    }
    if (location.state?.verificationSuccess) {
      setMessage('✅ Email verified successfully! Please log in.');
    }
  }, [location]);

  // ✅ NEW: Real-time username availability check
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
      } catch (err) {
        setUsernameStatus('error');
        setUsernameSuggestions([]);
      }
    }, 500); // Debounce: wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [username, formType]);

  const toggle = () => {
    if (formType === 'login') setFormType('register');
    else if (formType === 'register') setFormType('login');
    setMessage('');
    setUsername('');
    setUsernameStatus(null);
    setUsernameSuggestions([]);
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      if (formType === 'register') {
        // Validate username
        if (!username || username.length < 3) {
          setMessage('❌ Username is required (minimum 3 characters)');
          setIsSubmitting(false);
          return;
        }

        if (usernameStatus === 'taken') {
          setMessage('❌ Username is already taken. Please choose another.');
          setIsSubmitting(false);
          return;
        }

        // Frontend validation for password
        if (password.length < 8) {
          setMessage('❌ Password must be at least 8 characters long');
          setIsSubmitting(false);
          return;
        }
        if (!/(?=.*[a-z])/.test(password)) {
          setMessage('❌ Password must contain at least one lowercase letter');
          setIsSubmitting(false);
          return;
        }
        if (!/(?=.*[A-Z])/.test(password)) {
          setMessage('❌ Password must contain at least one uppercase letter');
          setIsSubmitting(false);
          return;
        }
        if (!/(?=.*\d)/.test(password)) {
          setMessage('❌ Password must contain at least one number');
          setIsSubmitting(false);
          return;
        }

        const res = await umhwApi.post('/auth/register', { 
          email, 
          password, 
          role,
          username: username.toLowerCase()  // ✅ SEND USERNAME
        });

        // Redirect to email verification page
        navigate('/verify-email', {
          state: {
            email: email,
            message: res.data.message
          }
        });
      }
      else if (formType === 'login') {
        const res = await umhwApi.post('/auth/login', { email, password });

        // Check if 2FA is required
        if (res.data.requires2FA) {
          navigate('/2fa-login', {
            state: {
              userId: res.data.userId,
              email: res.data.email
            }
          });
          return;
        }

        // Normal login
        sessionStorage.setItem('accessToken', res.data.accessToken);
        window.dispatchEvent(new Event("storage"));
        navigate('/dashboard');
      }
      else if (formType === 'forgot') {
        const res = await umhwApi.post('/auth/request-password-reset', { email });
        setMessage(res.data.message || '✅ If this email exists, a password reset link has been sent.');
      }
      else if (formType === 'reset') {
        // Frontend validation for reset password
        if (password.length < 8) {
          setMessage('❌ Password must be at least 8 characters long');
          setIsSubmitting(false);
          return;
        }
        if (!/(?=.*[a-z])/.test(password)) {
          setMessage('❌ Password must contain at least one lowercase letter');
          setIsSubmitting(false);
          return;
        }
        if (!/(?=.*[A-Z])/.test(password)) {
          setMessage('❌ Password must contain at least one uppercase letter');
          setIsSubmitting(false);
          return;
        }
        if (!/(?=.*\d)/.test(password)) {
          setMessage('❌ Password must contain at least one number');
          setIsSubmitting(false);
          return;
        }

        const res = await umhwApi.post('/auth/reset-password', { token, password });
        setMessage(res.data.message);
        setTimeout(() => {
          setFormType('login');
        }, 2000);
      }
    } catch (err) {
      console.error("❌ Error:", err.response?.data || err.message);

      if (err.response?.status === 429) {
        setMessage(`❌ ${err.response?.data || 'Too many attempts. Please try again in 15 minutes.'}`);
      }
      else if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map(e => e.message).join(', ');
        setMessage(`❌ ${errorMessages}`);
      } else if (err.response?.data?.message) {
        setMessage(`❌ ${err.response.data.message}`);
      } else {
        setMessage('❌ An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>
          {formType === 'login' && '🔐 Login'}
          {formType === 'register' && '📝 Register'}
          {formType === 'forgot' && '🔑 Forgot Password'}
          {formType === 'reset' && '🔄 Reset Password'}
        </h2>

        <form onSubmit={submit}>
          {(formType === 'login' || formType === 'register' || formType === 'forgot') && (
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* ✅ NEW: USERNAME FIELD (REGISTER ONLY) */}
          {formType === 'register' && (
            <div className="form-group">
              <label>
                Username
                <small>Unique identifier (e.g., john_smith)</small>
              </label>
              <div style={{ position: 'relative' }}>
                <input
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
                    borderColor: usernameStatus === 'available' ? 'var(--success-color)' : 
                                 usernameStatus === 'taken' ? 'var(--danger-color)' : undefined
                  }}
                />
                {usernameStatus === 'checking' && (
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    ⏳
                  </span>
                )}
                {usernameStatus === 'available' && (
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--success-color)' }}>
                    ✓
                  </span>
                )}
                {usernameStatus === 'taken' && (
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--danger-color)' }}>
                    ✗
                  </span>
                )}
              </div>
              
              {usernameStatus === 'available' && (
                <p className="helper-text success">
                  ✓ Username is available!
                </p>
              )}
              
              {usernameStatus === 'taken' && (
                <div>
                  <p className="helper-text error">
                    ✗ Username is already taken
                  </p>
                  {usernameSuggestions.length > 0 && (
                    <div style={{ marginTop: 'var(--spacing-sm)' }}>
                      <small style={{ color: 'var(--text-secondary)' }}>Try these:</small>
                      <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap', marginTop: 'var(--spacing-xs)' }}>
                        {usernameSuggestions.map(suggestion => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setUsername(suggestion)}
                            style={{
                              padding: '4px 12px',
                              background: 'var(--gray-200)',
                              border: '1px solid var(--gray-300)',
                              borderRadius: 'var(--border-radius)',
                              fontSize: 'var(--font-size-xs)',
                              cursor: 'pointer'
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {(formType === 'login' || formType === 'register' || formType === 'reset') && (
            <div className="form-group">
              <label>
                Password
                {formType === 'register' && (
                  <small>
                    Must be 8+ characters with uppercase, lowercase, and number
                  </small>
                )}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder={formType === 'register' ? 'e.g., MyPass123' : '••••••••'}
                disabled={isSubmitting}
              />
            </div>
          )}

          {formType === 'register' && (
            <div className="form-group">
              <label>Account Type</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="patient">Patient - Access my health records</option>
                <option value="doctor">Doctor - Manage patient records</option>
              </select>
            </div>
          )}

          {formType === 'reset' && (
            <div className="form-group">
              <label>Reset Token</label>
              <input
                value={token}
                onChange={e => setToken(e.target.value)}
                required
                placeholder="Enter token from email"
                disabled={isSubmitting}
              />
            </div>
          )}

          <button type="submit" disabled={isSubmitting || (formType === 'register' && usernameStatus === 'taken')}>
            {isSubmitting ? (
              <>⏳ Processing...</>
            ) : (
              <>
                {formType === 'login' && '🚀 Login'}
                {formType === 'register' && '✨ Create Account'}
                {formType === 'forgot' && '📧 Send Reset Link'}
                {formType === 'reset' && '✅ Reset Password'}
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="auth-links">
          {formType === 'login' && (
            <>
              <p>
                <button onClick={() => { setFormType('forgot'); setMessage(''); }}>
                  Forgot Password?
                </button>
              </p>
              <p>
                <button onClick={toggle}>
                  Don't have an account? Create one
                </button>
              </p>
            </>
          )}

          {formType === 'register' && (
            <p>
              <button onClick={toggle}>
                Already have an account? Login
              </button>
            </p>
          )}

          {formType === 'forgot' && (
            <p>
              <button onClick={() => { setFormType('login'); setMessage(''); }}>
                ← Back to Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthForm;