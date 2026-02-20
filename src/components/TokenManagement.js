// frontend/src/components/TokenManagement.js

import React, { useState, useEffect } from 'react';
import umhwApi from '../api/umhwApi';
import './TokenManagement.css';

function TokenManagement() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const fetchTokens = async () => {
    setLoading(true);
    setStatusMessage('');
    try {
      const res = await umhwApi.get('/share/manage');
      setTokens(res.data.tokens);
      setError('');
    } catch (err) {
      console.error("Failed to fetch tokens:", err.response?.data || err.message);
      setError('Failed to load active share tokens.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (tokenId) => {
    if (!window.confirm('Are you sure you want to revoke this token immediately?')) return;

    setStatusMessage('Revoking token...');
    try {
      await umhwApi.delete(`/share/manage/${tokenId}`);
      setStatusMessage('✅ Token successfully revoked.');
      fetchTokens();
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error("Revocation failed:", err.response?.data || err.message);
      setStatusMessage(`❌ Error revoking token: ${err.response?.data?.message || 'Unauthorized or failed.'}`);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setStatusMessage('✅ Link copied to clipboard!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  if (loading) {
    return (
      <div className="token-management-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading token management...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="token-management-container">
        <div className="message error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="token-management-container">
      <div className="token-management-header">
        <h3>
          <span>🔐</span>
          Active Share Tokens
        </h3>
        <p className="token-subtitle">
          Manage and revoke access to your shared medical records
        </p>
      </div>

      {statusMessage && (
        <div className={`message ${statusMessage.includes('✅') ? 'success' : 'error'}`}>
          {statusMessage}
        </div>
      )}

      <div style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'right' }}>
        <button onClick={fetchTokens} className="refresh-button">
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {tokens.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <p>You have no active share tokens.</p>
        </div>
      ) : (
        <div className="tokens-list">
          {tokens.map(token => {
            const isExpired = new Date() > new Date(token.expiresAt);
            
            return (
              <div 
                key={token.id} 
                className={`token-card ${isExpired ? 'expired' : 'active'}`}
              >
                <div className="token-card-header">
                  <div className="token-info">
                    <div className="token-id">
                      🆔 Token ID: {token.id.substring(0, 16)}...
                    </div>
                  </div>
                  <div className={`token-status ${isExpired ? 'expired' : 'active'}`}>
                    {isExpired ? '❌ EXPIRED' : '✅ ACTIVE'}
                  </div>
                </div>

                <div className="token-details">
                  <div className="token-detail-item">
                    <div className="token-detail-label">📧 Shared With</div>
                    <div className="token-detail-value">
                      {token.sharedWithEmail || 'Not specified'}
                    </div>
                  </div>

                  <div className="token-detail-item">
                    <div className="token-detail-label">📅 Created</div>
                    <div className="token-detail-value">
                      {new Date(token.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="token-detail-item">
                    <div className="token-detail-label">⏳ Expires</div>
                    <div className="token-detail-value" style={{ 
                      color: isExpired ? 'var(--danger-color)' : 'var(--success-color)',
                      fontWeight: 'var(--font-weight-bold)'
                    }}>
                      {new Date(token.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {token.shareUrl && !isExpired && (
                  <div className="token-url-container">
                    <div className="token-url">
                      {token.shareUrl}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(token.shareUrl)}
                      className="btn-copy"
                    >
                      <span>📋</span>
                      <span>Copy</span>
                    </button>
                  </div>
                )}

                <div className="token-actions">
                  <button
                    onClick={() => handleRevoke(token.id)}
                    disabled={isExpired}
                    className="btn-revoke"
                  >
                    {isExpired ? (
                      <>
                        <span>🔒</span>
                        <span>Already Expired</span>
                      </>
                    ) : (
                      <>
                        <span>🗑️</span>
                        <span>Revoke Access Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TokenManagement;