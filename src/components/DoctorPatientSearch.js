// frontend/src/components/DoctorPatientSearch.js

import React, { useState } from 'react';
import umhwApi from '../api/umhwApi';
import MedicalRecordForm from './MedicalRecordForm';
import './DoctorPatientSearch.css';

function DoctorPatientSearch() {
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const [requestType, setRequestType] = useState('both');
  const [reason, setReason] = useState('');
  const [requestDuration, setRequestDuration] = useState(48);
  const [message, setMessage] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loading, setLoading] = useState(false);
 
  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!patientIdentifier.trim()) {
      setMessage('❌ Please enter a patient username or email');
      return;
    }

    setLoading(true);

    try {
      const res = await umhwApi.post('/access-requests', {
        patientIdentifier: patientIdentifier.trim(),
        requestType,
        reason: reason.trim() || 'Medical consultation',
        durationHours: requestDuration
      });

      setMessage(`✅ ${res.data.message}`);
      setPatientIdentifier('');
      setReason('');
      setRequestDuration(48);

      if (showMyRequests) {
        fetchMyRequests();
      }
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Failed to send access request'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
  setLoading(true);
  try {
    const res = await umhwApi.get('/access-requests/my-requests?page=1&limit=50'); // Get 50 for modal
    setMyRequests(res.data.data || []); // ✅ CHANGED: Use res.data.data
    setShowMyRequests(true);
  } catch (err) {
    setMessage('❌ Failed to load your requests');
    setMyRequests([]); // ✅ Set empty array on error
  } finally {
    setLoading(false);
  }
}; 

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Cancel this access request?')) return;

    try {
      await umhwApi.delete(`/access-requests/${requestId}`);
      setMessage('✅ Request cancelled');
      fetchMyRequests();
    } catch (err) {
      setMessage('❌ Failed to cancel request');
    }
  };

  const getStatusBadge = (status, expiresAt) => {
    const isExpired = new Date() > new Date(expiresAt);

    if (isExpired && status === 'pending') {
      return <span className="status-badge status-rejected">⏱️ EXPIRED</span>;
    }

    const statusMap = {
      pending: <span className="status-badge status-pending">⏳ PENDING</span>,
      approved: <span className="status-badge status-approved">✅ APPROVED</span>,
      denied: <span className="status-badge status-rejected">❌ DENIED</span>
    };

    return statusMap[status] || null;
  };

  const getDurationLabel = (hours) => {
    if (hours === 0.5) return '30 Minutes';
    if (hours === 1) return '1 Hour';
    if (hours === 24) return '24 Hours (1 Day)';
    if (hours === 48) return '48 Hours (2 Days)';
    if (hours === 72) return '72 Hours (3 Days)';
    if (hours === 168) return '1 Week';
    if (hours === 336) return '2 Weeks';
    if (hours === 720) return '30 Days';
    return `${hours} Hours`;
  };

  return (
    <div className="doctor-search-container">
      <div className="search-header">
        <h3>
          <span>🔍</span>
          Request Patient Access
        </h3>
        <p className="search-subtitle">
          Search for patients and request access to their medical records
        </p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleRequestAccess} className="request-form">
        <div className="form-group full-width">
          <label>
            <span>🔍</span>
            Patient Username or Email
            <span style={{ color: 'var(--danger-color)' }}>*</span>
          </label>
          <input
            type="text"
            value={patientIdentifier}
            onChange={(e) => setPatientIdentifier(e.target.value)}
            placeholder="e.g., @john_smith or patient@email.com"
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--border-radius)',
              border: '2px solid var(--gray-300)',
              fontSize: 'var(--font-size-base)'
            }}
          />
          <p className="helper-text info">
            💡 Search by username (e.g., @john_smith) or email address
          </p>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              <span>📋</span>
              Access Type
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              disabled={loading}
            >
              <option value="view">View Only</option>
              <option value="create">Create Records Only</option>
              <option value="both">View & Create (Recommended)</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <span>⏰</span>
              Access Duration
            </label>
            <select
              value={requestDuration}
              onChange={(e) => setRequestDuration(Number(e.target.value))}
              disabled={loading}
            >
              <option value={0.5}>30 Minutes</option>
              <option value={1}>1 Hour</option>
              <option value={24}>24 Hours (1 Day)</option>
              <option value={48}>48 Hours (2 Days) - Default</option>
              <option value={72}>72 Hours (3 Days)</option>
              <option value={168}>1 Week</option>
              <option value={336}>2 Weeks</option>
              <option value={720}>30 Days (Maximum)</option>
            </select>
          </div>
        </div>

        <div className="form-group full-width">
          <label>
            <span>💬</span>
            Reason for Access
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Routine consultation, Follow-up treatment..."
            maxLength={500}
            disabled={loading}
          />
          <p className="helper-text">
            {reason.length}/500 characters
          </p>
        </div>

        <button
          type="submit"
          className="btn-submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner spinner-sm"></span>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>📤</span>
              <span>Send Access Request</span>
            </>
          )}
        </button>
      </form>

      {/* View My Requests Button */}
      <div style={{ textAlign: 'center', margin: 'var(--spacing-2xl) 0' }}>
        <button
          onClick={fetchMyRequests}
          className="search-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner spinner-sm"></span>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>View My Requests</span>
            </>
          )}
        </button>
      </div>

      {/* ✅ NEW: Requests Modal */}
      {showMyRequests && (
        <div className="modal-overlay" onClick={() => {
          setShowMyRequests(false);
          setShowCreateForm(false);
          setSelectedPatientId(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px' }}>
            <div className="modal-header">
              <h3>
                <span>📋</span> My Access Requests ({myRequests.length})
              </h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowMyRequests(false);
                  setShowCreateForm(false);
                  setSelectedPatientId(null);
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <button
                onClick={fetchMyRequests}
                className="search-button"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? (
                  <>
                    <span className="spinner spinner-sm"></span>
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Refresh Requests</span>
                  </>
                )}
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>No requests sent yet</p>
              </div>
            ) : (
              <>
                <div className="patient-list">
                  {myRequests.map(req => {
                    const isExpired = new Date() > new Date(req.expiresAt);

                    return (
                      <div key={req.id} className="patient-card">
                        <div className="patient-header">
                          <div className="patient-info">
                            <div className="patient-email">
                              👤 {req.PatientProfile?.User?.email}
                            </div>
                            <div className="patient-id">
                              @{req.PatientProfile?.User?.username || 'No username'}
                            </div>
                          </div>
                          {getStatusBadge(req.status, req.expiresAt)}
                        </div>

                        <div className="patient-meta">
                          <div className="meta-item">
                            <span className="meta-icon">📋</span>
                            <span>Type: {req.requestType}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-icon">⏰</span>
                            <span>Duration: {getDurationLabel(req.requestedDuration)}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-icon">📅</span>
                            <span>Sent: {new Date(req.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-icon">⏳</span>
                            <span>Expires: {new Date(req.expiresAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {req.approvedDuration && req.status === 'approved' && (
                          <div className="alert alert-success" style={{ marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
                            ✅ Approved for: {getDurationLabel(req.approvedDuration)}
                          </div>
                        )}

                        {req.status === 'pending' && !isExpired && (
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            className="btn-cancel"
                            style={{ marginTop: 'var(--spacing-md)' }}
                          >
                            <span>❌</span>
                            <span>Cancel Request</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {myRequests.some(req =>
                  req.status === 'approved' &&
                  new Date(req.expiresAt) > new Date() &&
                  ['create', 'both'].includes(req.requestType)
                ) && (
                  <div className="create-record-section" style={{ marginTop: 'var(--spacing-2xl)' }}>
                    <h4 className="create-record-title">
                      <span>✏️</span> Create Record for Approved Patient
                    </h4>
                    <p className="create-record-subtitle">
                      Select an approved patient to create a medical record
                    </p>

                    <div className="form-group">
                      <select
                        value={selectedPatientId || ''}
                        onChange={(e) => {
                          setSelectedPatientId(e.target.value);
                        }}
                        className="patient-selector"
                      >
                        <option value="">-- Select Patient --</option>
                        {myRequests
                          .filter(req =>
                            req.status === 'approved' &&
                            new Date(req.expiresAt) > new Date() &&
                            ['create', 'both'].includes(req.requestType)
                          )
                          .map(req => (
                            <option key={req.id} value={req.patientId}>
                              @{req.PatientProfile?.User?.username || req.PatientProfile?.User?.email} - Expires: {new Date(req.expiresAt).toLocaleDateString()}
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    {selectedPatientId && (
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="btn-submit"
                        style={{ marginTop: 'var(--spacing-md)', width: '100%' }}
                      >
                        <span>✏️</span>
                        <span>Create New Record</span>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ✅ Create Record Modal */}
      {showCreateForm && selectedPatientId && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Create New Medical Record</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateForm(false)}
              >
                ✕
              </button>
            </div>
            <MedicalRecordForm
              patientId={selectedPatientId}
              onSuccess={() => {
                setShowCreateForm(false);
                setSelectedPatientId(null);
                setMessage('✅ Medical record created successfully!');
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorPatientSearch;