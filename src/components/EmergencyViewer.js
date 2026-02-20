// frontend/src/components/EmergencyViewer.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import umhwApi from '../api/umhwApi';
import './EmergencyViewer.css';

function EmergencyViewer() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmergencyData();
  }, [token]);

  const fetchEmergencyData = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await umhwApi.get(`/qr/public/${token}`);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired QR code');
      console.error('Emergency access error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📑';
    return '📄';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="emergency-viewer-container">
        <div className="emergency-loading">
          <div className="spinner"></div>
          <p>🚨 Loading Emergency Records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="emergency-viewer-container">
        <div className="emergency-viewer-card">
          <div className="emergency-error">
            <div className="emergency-error-icon">⚠️</div>
            <h3>Access Denied</h3>
            <p>{error}</p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              This QR code may have expired or been revoked. Please contact the patient for a new code.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="emergency-viewer-container">
      <div className="emergency-viewer-card">
        {/* Header */}
        <div className="emergency-viewer-header">
          <div className="emergency-icon-large">🚨</div>
          <h2>Emergency Medical Records</h2>
          <p className="emergency-subtitle">Read-Only Access • No Login Required</p>
        </div>

        {/* Access Info Banner */}
        <div className="emergency-alert">
          <strong>Access Info:</strong>
          <span>Level: {data.accessInfo.scope}</span>
          <span>•</span>
          <span>Expires: {new Date(data.accessInfo.expiresAt).toLocaleString()}</span>
          <span>•</span>
          <span>Views: {data.accessInfo.usageCount}{data.accessInfo.maxUses ? ` / ${data.accessInfo.maxUses}` : ''}</span>
        </div>

        <div className="emergency-viewer-content">
          {/* Patient Info */}
          <div className="patient-emergency-info">
            <h2 className="section-title">
              <span>👤</span>
              Patient Information
            </h2>

            <div className="emergency-grid">
              <div className="emergency-field">
                <strong>📧 Email</strong>
                <p>{data.patient.email || 'Not provided'}</p>
              </div>

              <div className="emergency-field">
                <strong>📅 Date of Birth</strong>
                <p>{data.patient.dob || 'Not provided'}</p>
              </div>

              <div className="emergency-field">
                <strong>🩸 Blood Group</strong>
                <p style={{ color: 'var(--danger-color)', fontSize: 'var(--font-size-2xl)' }}>
                  {data.patient.bloodGroup || 'Not provided'}
                </p>
              </div>

              <div className="emergency-field">
                <strong>⚠️ Allergies</strong>
                <p style={{ color: 'var(--warning-text)', fontWeight: 'var(--font-weight-bold)' }}>
                  {data.patient.allergies || 'None reported'}
                </p>
              </div>

              <div className="emergency-field">
                <strong>👤 Emergency Contact</strong>
                <p>{data.patient.emergencyContactName || 'Not provided'}</p>
              </div>

              <div className="emergency-field">
                <strong>📞 Emergency Phone</strong>
                <p>{data.patient.emergencyContactNumber || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Medical Records */}
          <div className="emergency-records">
            <h2 className="section-title">
              <span>📋</span>
              Medical Records ({data.records.length})
            </h2>

            {data.records.length === 0 ? (
              <div className="emergency-empty">
                <div className="emergency-empty-icon">📋</div>
                <p>No medical records available</p>
              </div>
            ) : (
              <div className="records-list">
                {data.records.map(record => (
                  <div key={record.id} className="emergency-record-card">
                    <div className="record-header">
                      <div>
                        <h3 className="record-title">{record.title}</h3>
                        <div className="record-date">
                          📅 {new Date(record.recordDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {record.fileKey && (
                      <div className="record-section" style={{ borderLeftColor: 'var(--info-color)' }}>
                        <strong>📎 Attached File</strong>
                        <p>
                          {getFileIcon(record.fileType)} {record.fileName} ({formatFileSize(record.fileSize)})
                        </p>
                        {record.fileUrl && (
                          
                        <a href={record.fileUrl}
                            target="_blank"
                           rel="noopener noreferrer"
                            className="btn-view"
                           style={{ marginTop: 'var(--spacing-sm)', display: 'inline-flex' }}
                         >
                            <span>📥</span>
                   <span>View/Download</span>
                          </a>
                        )}
                      </div>
                    )}

                    {record.DoctorProfile && (
                      <div className="record-section" style={{ borderLeftColor: 'var(--primary-color)' }}>
                        <strong>👨‍⚕️ Doctor</strong>
                        <p>
                          {record.DoctorProfile.name || 'Unknown'}
                          {record.DoctorProfile.specialty && ` (${record.DoctorProfile.specialty})`}
                        </p>
                      </div>
                    )}

                    <div className="record-content">
                      {record.diagnosis && (
                        <div className="record-section" style={{ borderLeftColor: 'var(--danger-color)' }}>
                          <strong>🩺 Diagnosis</strong>
                          <p>{record.diagnosis}</p>
                        </div>
                      )}

                      {record.prescription && (
                        <div className="record-section" style={{ borderLeftColor: 'var(--success-color)' }}>
                          <strong>💊 Prescription</strong>
                          <p>{record.prescription}</p>
                        </div>
                      )}

                      {record.description && (
                        <div className="record-section">
                          <strong>📄 Description</strong>
                          <p>{record.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: 'var(--gray-100)',
          padding: 'var(--spacing-lg)',
          borderTop: '1px solid var(--gray-300)',
          textAlign: 'center',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ margin: 0 }}>
            🔒 This is a secure, time-limited view of medical records. This page does not store any data.
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmergencyViewer;