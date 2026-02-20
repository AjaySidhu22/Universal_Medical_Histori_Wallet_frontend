// frontend/src/components/EmergencyQR.js

import React, { useState, useEffect } from 'react';
import umhwApi from '../api/umhwApi';
import './EmergencyQR.css';

function EmergencyQR() {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTokens, setActiveTokens] = useState([]);
  const [duration, setDuration] = useState(24);
  const [accessScope, setAccessScope] = useState('emergency');

  useEffect(() => {
    fetchActiveTokens();
  }, []);

  const fetchActiveTokens = async () => {
    try {
      const res = await umhwApi.get('/qr/my-codes');
      setActiveTokens(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch QR codes:', err);
    }
  };

  const generateQR = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await umhwApi.post('/qr/generate', {
        durationHours: duration,
        accessScope: accessScope
      });

      setQrData(res.data.data);
      fetchActiveTokens();
      setError('');

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate QR code');
      console.error('QR generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const revokeToken = async (tokenId) => {
    if (!window.confirm('Are you sure you want to revoke this QR code? It will no longer work.')) {
      return;
    }

    try {
      await umhwApi.delete(`/qr/${tokenId}`);
      setActiveTokens(activeTokens.filter(t => t.id !== tokenId));
      if (qrData && qrData.id === tokenId) {
        setQrData(null);
      }
    } catch (err) {
      setError('Failed to revoke QR code');
    }
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert('✅ Link copied to clipboard!');
  };

  const downloadQR = () => {
    if (!qrData) return;

    const link = document.createElement('a');
    link.download = `emergency-qr-${new Date().toISOString().split('T')[0]}.png`;
    link.href = qrData.qrCodeDataUrl;
    link.click();
  };

  return (
    <div className="emergency-qr-container">
      <div className="emergency-header">
        <h3>
          <span className="emergency-icon">🚨</span>
          Emergency QR Code
        </h3>
        <p className="emergency-subtitle">
          Generate a secure QR code for emergency medical access
        </p>
      </div>

      <div className="emergency-alert">
        <span className="alert-icon">⚠️</span>
        <div className="alert-content">
          <strong>Important: Emergency Access Only</strong>
          <p>
            Anyone with this QR code can view your medical records without logging in.
            Only share during emergencies (ambulance, hospital, etc.).
            The code expires automatically after the set duration.
          </p>
        </div>
      </div>

      {error && (
        <div className="emergency-error">
          <div className="emergency-error-icon">❌</div>
          <h4>Error</h4>
          <p>{error}</p>
        </div>
      )}

      {!qrData && !loading && (
        <div className="record-form">
          <div className="form-group">
            <label>
              <span>⏰</span>
              How long should the QR code work?
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value={1}>1 Hour</option>
              <option value={6}>6 Hours</option>
              <option value={12}>12 Hours</option>
              <option value={24}>24 Hours (Recommended)</option>
              <option value={48}>48 Hours</option>
              <option value={72}>72 Hours</option>
              <option value={168}>7 Days</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <span>📋</span>
              What information should be shared?
            </label>
            <select
              value={accessScope}
              onChange={(e) => setAccessScope(e.target.value)}
            >
              <option value="emergency">Emergency Info (Allergies, Blood Group, Recent Records)</option>
              <option value="summary">Summary (Last 5 Records Only)</option>
              <option value="all">All Records (Complete Medical History)</option>
            </select>
          </div>

          <div className="emergency-actions">
            <button
              onClick={generateQR}
              disabled={loading}
              className="action-btn btn-download"
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>🚨</span>
                  <span>Generate Emergency QR Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {loading && !qrData && (
        <div className="emergency-loading">
          <div className="spinner"></div>
          <p>Generating secure QR code...</p>
        </div>
      )}

      {qrData && (
        <div className="qr-code-display">
          <h4 style={{ color: 'var(--success-color)', marginBottom: 'var(--spacing-md)' }}>
            ✅ QR Code Generated!
          </h4>

          <div className="qr-code-wrapper">
            <img
              src={qrData.qrCodeDataUrl}
              alt="Emergency QR Code"
            />
          </div>
          <p className="qr-code-label">Scan with any QR code reader</p>

          <div className="token-display">
            <div className="token-label">Share Link</div>
            <div className="token-value">{qrData.shareUrl}</div>
            <button
              onClick={() => copyLink(qrData.shareUrl)}
              className="action-btn btn-share"
              style={{ marginTop: 'var(--spacing-md)', width: '100%' }}
            >
              <span>📋</span>
              <span>Copy Link</span>
            </button>
          </div>

          <div className="emergency-instructions">
            <h4>
              <span>📅</span>
              QR Code Details
            </h4>
            <ol>
              <li><strong>Expires:</strong> {new Date(qrData.expiresAt).toLocaleString()}</li>
              <li><strong>Duration:</strong> {qrData.durationHours} hours</li>
              <li><strong>Access Level:</strong> {qrData.accessScope}</li>
            </ol>
          </div>

          <div className="emergency-actions">
            <button
              onClick={downloadQR}
              className="action-btn btn-download"
            >
              <span>💾</span>
              <span>Download QR Code</span>
            </button>

            <button
              onClick={() => window.print()}
              className="action-btn btn-print"
            >
              <span>🖨️</span>
              <span>Print QR Code</span>
            </button>

            <button
              onClick={() => setQrData(null)}
              className="action-btn btn-secondary"
            >
              <span>✕</span>
              <span>Close</span>
            </button>
          </div>
        </div>
      )}

      {activeTokens.length > 0 && (
        <div style={{ marginTop: 'var(--spacing-2xl)' }}>
          <h4 style={{ marginBottom: 'var(--spacing-lg)' }}>
            Active Emergency QR Codes ({activeTokens.length})
          </h4>
          {activeTokens.map(token => (
            <div
              key={token.id}
              className="card"
              style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-lg)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 'var(--spacing-md)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: 'var(--font-size-sm)' }}>
                    <strong>Created:</strong> {new Date(token.createdAt).toLocaleString()}
                  </p>
                  <p style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: 'var(--font-size-sm)' }}>
                    <strong>Expires:</strong> {new Date(token.expiresAt).toLocaleString()}
                  </p>
                  <p style={{ margin: '0', fontSize: 'var(--font-size-sm)' }}>
                    <strong>Used:</strong> {token.usageCount} times
                  </p>
                </div>
                <button
                  onClick={() => revokeToken(token.id)}
                  className="btn-delete"
                  style={{ flexShrink: 0 }}
                >
                  <span>🗑️</span>
                  <span>Revoke</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmergencyQR;