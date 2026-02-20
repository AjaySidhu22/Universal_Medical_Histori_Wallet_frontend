// frontend/src/components/ShareTokenGenerator.js

import React, { useState } from 'react';
import umhwApi from '../api/umhwApi';
import './ShareTokenGenerator.css';

function ShareTokenGenerator() {
  const [duration, setDuration] = useState('7d');
  const [sharedWithEmail, setSharedWithEmail] = useState('');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setResult(null);
    setLoading(true);

    try {
      const res = await umhwApi.post('/share', {
        duration,
        sharedWithEmail: sharedWithEmail || undefined
      });
      setMessage('✅ ' + res.data.message);
      setResult(res.data);
    } catch (err) {
      console.error("Token generation failed:", err.response?.data || err.message);
      setMessage(`❌ Error: ${err.response?.data?.message || 'Failed to generate share link.'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.shareUrl) {
      navigator.clipboard.writeText(result.shareUrl);
      setMessage('✅ Link copied to clipboard!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="token-generator-container">
      <div className="token-header">
        <h3>
          <span>🔗</span>
          Share Your Medical Records
        </h3>
        <p className="token-subtitle">
          Generate a secure link to share your records with healthcare providers
        </p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="token-form">
        <div className="form-section">
          <h4>🔒 Share Settings</h4>
          
          <div className="form-group">
            <label>
              <span>⏰</span> Sharing Duration
            </label>
            <select 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)}
              disabled={loading}
            >
              <option value="1h">1 Hour</option>
              <option value="1d">1 Day</option>
              <option value="7d">7 Days (Recommended)</option>
              <option value="30d">30 Days</option>
            </select>
            <p className="helper-text">
              💡 How long the share link will remain active
            </p>
          </div>

          <div className="form-group">
            <label>
              <span>📧</span> Share With Email (Optional)
            </label>
            <input
              type="email"
              value={sharedWithEmail}
              onChange={(e) => setSharedWithEmail(e.target.value)}
              placeholder="doctor@example.com"
              disabled={loading}
            />
            <p className="helper-text">
              💡 Track who you shared records with (optional)
            </p>
          </div>
        </div>

        <div className="token-actions">
          <button 
            type="submit" 
            className="btn-generate"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner spinner-sm"></span>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>🔗</span>
                <span>Generate Secure Share Link</span>
              </>
            )}
          </button>
        </div>
      </form>

      {result && (
        <div className="generated-token">
          <h4>
            <span>✅</span>
            Share Link Generated!
          </h4>
          
          <div className="token-url">
            {result.shareUrl}
          </div>

          <button 
            onClick={copyToClipboard}
            className="token-copy-btn"
          >
            <span>📋</span>
            <span>Copy Link to Clipboard</span>
          </button>

          <p style={{ 
            fontSize: 'var(--font-size-sm)', 
            color: 'var(--success-text)', 
            marginTop: 'var(--spacing-md)',
            marginBottom: 0,
            textAlign: 'center'
          }}>
            ⏳ Expires: {new Date(result.expiresAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default ShareTokenGenerator;