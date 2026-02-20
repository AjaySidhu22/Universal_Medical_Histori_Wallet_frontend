// frontend/src/components/SharedRecordsViewer.js

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import umhwApi from '../api/umhwApi';
import './SharedRecordsViewer.css';

function SharedRecordsViewer() {
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareInfo, setShareInfo] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get('token');

    if (!token) {
      setError('Missing share token. The link may be incomplete.');
      setLoading(false);
      return;
    }

    const fetchSharedRecords = async () => {
      try {
        const res = await umhwApi.get(`/share/${token}`);
        setRecords(res.data.records);
        setPatient(res.data.patient);
        setShareInfo(res.data.shareInfo);
        setError('');
      } catch (err) {
        console.error("Shared record fetch failed:", err.response?.data || err.message);
        setError(err.response?.data?.message || 'Invalid or expired share link.');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedRecords();
  }, [location]);

  const getFileIcon = (fileName) => {
    if (!fileName) return '📄';
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (ext === 'pdf') return '📑';
    return '📄';
  };

  if (loading) {
    return (
      <div className="shared-viewer-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading shared medical records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-viewer-container">
        <div className="error-container">
          <div className="error-icon">🔒</div>
          <h3>Access Denied</h3>
          <p>{error}</p>
          <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-md)' }}>
            Please check the URL or contact the patient who provided the link.
          </p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="shared-viewer-container">
        <div className="empty-container">
          <div className="empty-icon">📋</div>
          <p>No data found for this link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-viewer-container">
      <div className="shared-viewer-header">
        <h2>
          <span>🔗</span>
          Shared Medical Records
        </h2>
        <p className="shared-subtitle">Read-Only Access • Secure Share Link</p>
      </div>

      {shareInfo && (
        <div className="share-info-banner">
          <div className="share-info-grid">
            <div className="share-info-item">
              <span>📅</span>
              <strong>Created:</strong>
              <span>{new Date(shareInfo.createdAt).toLocaleDateString()}</span>
            </div>
            {shareInfo.expiresAt && (
              <div className="share-info-item">
                <span>⏳</span>
                <strong>Expires:</strong>
                <span>{new Date(shareInfo.expiresAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="share-info-item">
              <span>👁️</span>
              <strong>Access Type:</strong>
              <span>Read-Only</span>
            </div>
          </div>
        </div>
      )}

      <div className="shared-record-card">
        <div className="record-card-header">
          <h3 className="record-title">
            <span>👤</span>
            Patient Information
          </h3>
        </div>

        <div className="record-content">
          <div className="record-field">
            <strong>📧 Patient Email</strong>
            <p>{patient.User?.email || 'Not provided'}</p>
          </div>

          <div className="record-field" style={{ borderLeftColor: 'var(--danger-color)' }}>
            <strong>🩸 Blood Group</strong>
            <p style={{ color: 'var(--danger-color)', fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-xl)' }}>
              {patient.bloodGroup || 'Not provided'}
            </p>
          </div>

          <div className="record-field" style={{ borderLeftColor: 'var(--warning-color)' }}>
            <strong>⚠️ Allergies</strong>
            <p style={{ color: 'var(--warning-text)', fontWeight: 'var(--font-weight-bold)' }}>
              {patient.allergies || 'None listed'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--spacing-2xl)' }}>
        <h3 style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          📋 Shared Records ({records.length})
        </h3>

        {records.length === 0 ? (
          <div className="empty-container">
            <div className="empty-icon">📋</div>
            <p>No records shared</p>
          </div>
        ) : (
          <div className="shared-records-list">
            {records.map(record => (
              <div key={record.id} className="shared-record-card">
                <div className="record-card-header">
                  <div>
                    <h4 className="record-title">
                      <span>📄</span>
                      {record.title}
                    </h4>
                    <div className="record-date">
                      <span>📅</span>
                      {new Date(record.recordDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="record-content">
                  {record.description && (
                    <div className="record-field">
                      <strong>📋 Description</strong>
                      <p>{record.description}</p>
                    </div>
                  )}

                  {record.diagnosis && (
                    <div className="record-field" style={{ borderLeftColor: 'var(--danger-color)' }}>
                      <strong>🩺 Diagnosis</strong>
                      <p>{record.diagnosis}</p>
                    </div>
                  )}

                  {record.prescription && (
                    <div className="record-field" style={{ borderLeftColor: 'var(--success-color)' }}>
                      <strong>💊 Prescription</strong>
                      <p>{record.prescription}</p>
                    </div>
                  )}

                  {record.notes && (
                    <div className="record-field">
                      <strong>📝 Notes</strong>
                      <p>{record.notes}</p>
                    </div>
                  )}

                  {record.DoctorProfile && (
                    <div className="record-field" style={{ borderLeftColor: 'var(--primary-color)' }}>
                      <strong>👨‍⚕️ Record Added By</strong>
                      <p>
                        Dr. {record.DoctorProfile.User?.email || 'Unknown'}
                        {record.DoctorProfile.specialty && ` (${record.DoctorProfile.specialty})`}
                      </p>
                    </div>
                  )}

                  {record.filePath && (
                    <div className="file-attachment">
                      <div className="file-info">
                        <div className="file-name">
                          {getFileIcon(record.fileName)}
                          {record.fileName || 'Attached File'}
                        </div>
                        {record.fileSize && (
                          <div className="file-size">
                            Size: {(record.fileSize / 1024 / 1024).toFixed(2)} MB
                          </div>
                        )}
                      </div>
                      
                      <a  href={`${process.env.REACT_APP_API_URL || 'https://localhost:5000'}${record.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-download"
                      >
                        <span>📥</span>
                        <span>Download</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SharedRecordsViewer;