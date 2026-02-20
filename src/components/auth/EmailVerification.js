// frontend/src/components/auth/EmailVerification.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import umhwApi from '../../api/umhwApi';
import './EmailVerification.css';

function EmailVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from navigation state (passed from registration)
    const emailFromState = location.state?.email;
    if (emailFromState) {
      setEmail(emailFromState);
      setMessage(`✅ Verification code sent to ${emailFromState}`);
    } else {
      setMessage('⚠️ Please enter your email address');
    }
  }, [location]);

  // Handle OTP input with auto-focus
  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      document.getElementById('otp-5').focus();
    }
  };

  // Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setMessage('❌ Please enter all 6 digits');
      return;
    }

    if (!email) {
      setMessage('❌ Email address is required');
      return;
    }

    setIsVerifying(true);
    setMessage('');

    try {
      const res = await umhwApi.post('/auth/verify-email', {
        email,
        otp: otpString
      });

      setMessage('✅ ' + res.data.message);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/', { state: { verificationSuccess: true } });
      }, 2000);

    } catch (err) {
      console.error('Verification error:', err);
      
      if (err.response?.data?.message) {
        setMessage('❌ ' + err.response.data.message);
      } else {
        setMessage('❌ Verification failed. Please try again.');
      }
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0').focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!email) {
      setMessage('❌ Please enter your email address');
      return;
    }

    setIsResending(true);
    setMessage('');

    try {
      const res = await umhwApi.post('/auth/resend-otp', { email });
      
      setMessage('✅ ' + res.data.message);
      setAttemptsRemaining(res.data.attemptsRemaining || 2);
      
      // Clear OTP fields
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0').focus();

    } catch (err) {
      console.error('Resend error:', err);
      
      if (err.response?.data?.message) {
        setMessage('❌ ' + err.response.data.message);
      } else {
        setMessage('❌ Failed to resend code. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="email-verification-container">
      <div className="verification-card">
        <div className="verification-icon">📧</div>
        
        <h2>Verify Your Email</h2>
        <p className="verification-subtitle">
          Enter the 6-digit code sent to your email
        </p>

        {!location.state?.email && (
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>
        )}

        {email && (
          <p className="email-display">
            <strong>{email}</strong>
          </p>
        )}

        <form onSubmit={handleVerify}>
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                autoComplete="off"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button 
            type="submit" 
            className="verify-btn"
            disabled={isVerifying || otp.join('').length !== 6}
          >
            {isVerifying ? '⏳ Verifying...' : '✅ Verify Email'}
          </button>
        </form>

        <p className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>
          {message}
        </p>

        <div className="resend-section">
          <p>Didn't receive the code?</p>
          <button 
            onClick={handleResend}
            className="resend-btn"
            disabled={isResending || attemptsRemaining <= 0}
          >
            {isResending ? '⏳ Sending...' : '🔄 Resend Code'}
          </button>
          {attemptsRemaining <= 2 && (
            <p className="attempts-remaining">
              {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
            </p>
          )}
        </div>

        <div className="back-to-login">
          <button onClick={() => navigate('/')}>
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailVerification;