// frontend/src/components/EmergencyQR.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  QrCode, Shield, Clock, Eye, Download, Printer,
  Trash2, Copy, CheckCircle, AlertTriangle, RefreshCw,
  Link, Info, X
} from 'lucide-react';
import umhwApi from '../api/umhwApi';
import './EmergencyQR.css';

const DURATION_OPTIONS = [
  { value: 1,   label: '1 Hour'  },
  { value: 6,   label: '6 Hours' },
  { value: 12,  label: '12 Hours' },
  { value: 24,  label: '24 Hours (Recommended)' },
  { value: 48,  label: '48 Hours' },
  { value: 72,  label: '72 Hours' },
  { value: 168, label: '7 Days' },
];

const ACCESS_OPTIONS = [
  { value: 'emergency', label: 'Emergency Info (Allergies, Blood Group, Recent Records)' },
  { value: 'summary',   label: 'Summary (Last 5 Records Only)' },
  { value: 'all',       label: 'All Records (Complete Medical History)' },
];

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

const isExpired = (expiresAt) => new Date() > new Date(expiresAt);

function EmergencyQR() {
  const [activeCodes, setActiveCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [duration, setDuration] = useState(24);
  const [accessScope, setAccessScope] = useState('emergency');
  const [generatedQR, setGeneratedQR] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchCodes = useCallback(async () => {
    try {
      const res = await umhwApi.get('/qr/my-codes');
      setActiveCodes(res.data.tokens || []);
    } catch {
      setError('Failed to load QR codes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setGeneratedQR(null);
    try {
      const res = await umhwApi.post('/qr/generate', { durationHours: duration, accessScope });
      setGeneratedQR(res.data);
      await fetchCodes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate QR code.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (tokenId) => {
    if (!window.confirm('Revoke this QR code? Anyone using this link will lose access.')) return;
    try {
      await umhwApi.delete(`/qr/${tokenId}`);
      setActiveCodes(prev => prev.filter(t => t.id !== tokenId));
      if (generatedQR?.id === tokenId) setGeneratedQR(null);
    } catch {
      setError('Failed to revoke QR code.');
    }
  };

  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy link.');
    }
  };

  const handleDownload = () => {
    if (!generatedQR?.qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = generatedQR.qrCodeDataUrl;
    link.download = 'emergency-qr.png';
    link.click();
  };

  const handlePrint = () => {
    if (!generatedQR?.qrCodeDataUrl) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Emergency QR Code</title></head>
      <body style="text-align:center;padding:40px;font-family:sans-serif;">
        <h2>Emergency Medical QR Code</h2>
        <p>Scan to access emergency medical information</p>
        <img src="${generatedQR.qrCodeDataUrl}" style="width:300px;height:300px;" />
        <p style="margin-top:20px;font-size:12px;color:#666;">
          This QR code grants read-only access to medical records.<br/>
          Valid until: ${formatDate(generatedQR.expiresAt)}
        </p>
      </body></html>
    `);
    win.print();
  };

  return (
    <div className="qr-section">

      {/* Warning banner */}
      <div className="qr-warning">
        <AlertTriangle size={16} />
        <div>
          <strong>Emergency Access Only</strong>
          <p>
            Anyone with this QR code can view your medical records without logging in.
            Only share during emergencies (ambulance, hospital, etc.).
            The code expires automatically after the set duration.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Generator card */}
      <div className="qr-generator-card">
        <div className="qr-generator-header">
          <QrCode size={18} />
          <h3>Generate Emergency QR Code</h3>
        </div>

        <div className="qr-generator-body">
          <div className="form-group">
            <label className="form-label">
              <Clock size={14} /> How long should the QR code be valid?
            </label>
            <select
              className="form-select"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              disabled={generating}
            >
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Eye size={14} /> What information should be shared?
            </label>
            <select
              className="form-select"
              value={accessScope}
              onChange={e => setAccessScope(e.target.value)}
              disabled={generating}
            >
              {ACCESS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating}
            style={{ width: '100%' }}
          >
            {generating
              ? <><div className="spinner spinner-sm" /> Generating...</>
              : <><QrCode size={16} /> Generate Emergency QR Code</>
            }
          </button>
        </div>
      </div>

      {/* Generated QR result */}
      {generatedQR && (
        <div className="qr-result-card">
          <div className="qr-result-header">
            <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
            <h3>QR Code Generated</h3>
            <button className="btn btn-ghost btn-sm qr-close-btn" onClick={() => setGeneratedQR(null)}>
              <X size={16} />
            </button>
          </div>

          <div className="qr-result-body">
            <div className="qr-image-container">
              <img src={generatedQR.qrCodeDataUrl} alt="Emergency QR Code" className="qr-image" />
            </div>

            <div className="qr-result-details">
              <div className="qr-detail-row">
                <Clock size={14} />
                <span>Expires: {formatDate(generatedQR.expiresAt)}</span>
              </div>
              <div className="qr-detail-row">
                <Eye size={14} />
                <span>Access: {ACCESS_OPTIONS.find(o => o.value === generatedQR.accessScope)?.label}</span>
              </div>
              <div className="qr-detail-row">
                <Shield size={14} />
                <span>Duration: {generatedQR.durationHours} hour{generatedQR.durationHours > 1 ? 's' : ''}</span>
              </div>

              <div className="qr-share-link">
                <Link size={13} />
                <span className="qr-share-url">{generatedQR.shareUrl}</span>
              </div>

              <div className="qr-result-actions">
                <button
                  className={`btn btn-secondary btn-sm ${copied ? 'btn-success-state' : ''}`}
                  onClick={() => handleCopy(generatedQR.shareUrl)}
                >
                  {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
                  <Download size={13} /> Download
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handlePrint}>
                  <Printer size={13} /> Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active codes list */}
      <div className="qr-active-section">
        <div className="qr-active-header">
          <h3>
            Active QR Codes
            {activeCodes.filter(t => !isExpired(t.expiresAt)).length > 0 && (
              <span className="badge badge-primary" style={{ marginLeft: 'var(--space-2)' }}>
                {activeCodes.filter(t => !isExpired(t.expiresAt)).length}
              </span>
            )}
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={fetchCodes}>
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            <div className="spinner spinner-sm" /> Loading...
          </div>
        ) : activeCodes.length === 0 ? (
          <div className="qr-empty">
            <QrCode size={32} />
            <p>No active QR codes. Generate one above.</p>
          </div>
        ) : (
          <div className="qr-codes-list">
            {activeCodes.map(token => {
              const expired = isExpired(token.expiresAt);
              return (
                <div key={token.id} className={`qr-code-item ${expired ? 'qr-code-expired' : ''}`}>
                  <div className="qr-code-info">
                    <div className="qr-code-status-dot" style={{
                      background: expired ? 'var(--color-text-muted)' : 'var(--color-success)'
                    }} />
                    <div>
                      <div className="qr-code-dates">
                        <span>Created: {formatDate(token.createdAt)}</span>
                        <span>·</span>
                        <span className={expired ? 'qr-expired-text' : ''}>
                          {expired ? 'Expired' : `Expires: ${formatDate(token.expiresAt)}`}
                        </span>
                      </div>
                      <div className="qr-code-uses">
                        <Eye size={12} /> Used {token.useCount || 0} time{(token.useCount || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  {!expired && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRevoke(token.id)}
                    >
                      <Trash2 size={13} /> Revoke
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default EmergencyQR;