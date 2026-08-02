// frontend/src/components/DoctorPatientSearch.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Send, Clock, ChevronDown, User, Activity,
  MessageSquare, CheckCircle, AlertCircle, X,
  RefreshCw, Eye, Edit2, FileText, Timer
} from 'lucide-react';
import umhwApi from '../api/umhwApi';
import MedicalRecordForm from './MedicalRecordForm';
import './DoctorPatientSearch.css';

const ACCESS_TYPES = [
  { value: 'view',   label: 'View Only' },
  { value: 'create', label: 'Create Records Only' },
  { value: 'both',   label: 'View & Create (Recommended)' },
];

const DURATION_OPTIONS = [
  { value: 0.5,  label: '30 Minutes' },
  { value: 1,    label: '1 Hour' },
  { value: 24,   label: '24 Hours (1 Day)' },
  { value: 48,   label: '48 Hours (2 Days) — Default' },
  { value: 72,   label: '72 Hours (3 Days)' },
  { value: 168,  label: '1 Week' },
  { value: 336,  label: '2 Weeks' },
  { value: 720,  label: '30 Days (Maximum)' },
];

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

const isExpired = (expiresAt) => new Date() > new Date(expiresAt);

const getStatusInfo = (status, expiresAt) => {
  if (isExpired(expiresAt) && (status === 'approved' || status === 'pending')) {
    return { label: 'Expired', className: 'status-expired' };
  }
  switch (status) {
    case 'approved': return { label: 'Approved', className: 'status-approved' };
    case 'denied':   return { label: 'Denied',   className: 'status-denied'   };
    default:         return { label: 'Pending',  className: 'status-pending'  };
  }
};

function DoctorPatientSearch() {
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const [requestType, setRequestType] = useState('both');
  const [durationHours, setDurationHours] = useState(48);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const setSuccess = (msg) => { setMessage(msg); setMessageType('success'); };
  const setError = (msg) => { setMessage(msg); setMessageType('error'); };

  const fetchMyRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await umhwApi.get('/access-requests/my-requests?page=1&limit=50');
      setMyRequests(res.data.data || []);
    } catch {
      setError('Failed to load access requests.');
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientIdentifier.trim()) {
      setError('Please enter a patient username or email.');
      return;
    }
    setIsSubmitting(true);
    setMessage('');
    try {
      await umhwApi.post('/access-requests', {
        patientIdentifier: patientIdentifier.trim(),
        requestType,
        reason,
        durationHours: Number(durationHours)
      });
      setSuccess('Access request sent. The patient has been notified via email.');
      setPatientIdentifier('');
      setReason('');
      await fetchMyRequests();
      setShowRequests(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send access request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await umhwApi.delete(`/access-requests/${requestId}`);
      setSuccess('Request cancelled.');
      await fetchMyRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request.');
    }
  };

  const approvedActive = myRequests.filter(
    r => r.status === 'approved' && !isExpired(r.expiresAt)
  );

  return (
    <div className="dps-wrapper">

      {/* Access Request Form */}
      <div className="dps-card">
        <div className="dps-card-header">
          <Search size={18} />
          <h3>Request Patient Access</h3>
        </div>

        <form onSubmit={handleSubmit} className="dps-form">
          {message && (
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'}`}>
              {messageType === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {message}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="patient-id">
              Patient Username or Email *
            </label>
            <div className="dps-input-wrapper">
              <User size={15} className="dps-input-icon" />
              <input
                id="patient-id"
                className="form-input dps-input"
                type="text"
                value={patientIdentifier}
                onChange={e => setPatientIdentifier(e.target.value)}
                placeholder="e.g., @john_smith or patient@email.com"
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="dps-form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="access-type">
                <Activity size={13} /> Access Type
              </label>
              <select
                id="access-type"
                className="form-select"
                value={requestType}
                onChange={e => setRequestType(e.target.value)}
                disabled={isSubmitting}
              >
                {ACCESS_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="duration">
                <Clock size={13} /> Access Duration
              </label>
              <select
                id="duration"
                className="form-select"
                value={durationHours}
                onChange={e => setDurationHours(e.target.value)}
                disabled={isSubmitting}
              >
                {DURATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reason">
              <MessageSquare size={13} /> Reason for Access
            </label>
            <textarea
              id="reason"
              className="form-textarea"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., Routine consultation, Follow-up treatment..."
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
            />
            <p className="form-helper">{reason.length}/500 characters</p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting
              ? <><div className="spinner spinner-sm" /> Sending...</>
              : <><Send size={15} /> Send Access Request</>
            }
          </button>
        </form>
      </div>

      {/* My Requests */}
      <div className="dps-card">
        <div className="dps-card-header dps-requests-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FileText size={18} />
            <h3>
              My Access Requests
              {myRequests.length > 0 && (
                <span className="badge badge-primary" style={{ marginLeft: 'var(--space-2)' }}>
                  {myRequests.length}
                </span>
              )}
            </h3>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setShowRequests(!showRequests); fetchMyRequests(); }}
          >
            <RefreshCw size={14} />
            {showRequests ? 'Hide' : 'Show'}
          </button>
        </div>

        {showRequests && (
          <div className="dps-requests-body">
            {loadingRequests ? (
              <div className="dps-loading">
                <div className="spinner spinner-sm" /> Loading...
              </div>
            ) : myRequests.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <FileText size={32} className="empty-state-icon" />
                <p>No access requests sent yet.</p>
              </div>
            ) : (
              <div className="dps-requests-list">
                {myRequests.map(request => {
                  const statusInfo = getStatusInfo(request.status, request.expiresAt);
                  const canCancel = request.status === 'pending' && !isExpired(request.expiresAt);
                  const canCreate = request.status === 'approved' &&
                    !isExpired(request.expiresAt) &&
                    ['create', 'both'].includes(request.requestType);

                  return (
                    <div key={request.id} className={`dps-request-item ${statusInfo.className}`}>
                      <div className="dps-request-info">
                        <div className="dps-request-patient">
                          <User size={14} />
                          <span>{request.PatientProfile?.User?.email || 'Patient'}</span>
                          <span className="dps-request-username">
                            @{request.PatientProfile?.User?.username}
                          </span>
                        </div>
                        <div className="dps-request-meta">
                          <span className={`badge ${
                            statusInfo.className === 'status-approved' ? 'badge-success' :
                            statusInfo.className === 'status-denied'   ? 'badge-danger'  :
                            statusInfo.className === 'status-expired'  ? 'badge-muted'   :
                            'badge-warning'
                          }`}>
                            {statusInfo.label}
                          </span>
                          <span className="dps-meta-item">
                            <Activity size={12} />
                            {request.requestType === 'both' ? 'View & Create'
                              : request.requestType === 'view' ? 'View Only'
                              : 'Create Only'}
                          </span>
                          <span className="dps-meta-item">
                            <Timer size={12} />
                            {request.requestedDuration < 24
                              ? `${request.requestedDuration}h`
                              : `${request.requestedDuration / 24}d`}
                          </span>
                          <span className="dps-meta-item">
                            <Clock size={12} />
                            Sent: {formatDate(request.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="dps-request-actions">
                        {canCreate && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedPatientId(request.PatientProfile?.id);
                              setShowCreateForm(true);
                            }}
                          >
                            <Edit2 size={13} /> Create Record
                          </button>
                        )}
                        {canCancel && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancelRequest(request.id)}
                          >
                            <X size={13} /> Cancel
                          </button>
                        )}
                        {request.status === 'approved' && !isExpired(request.expiresAt) && (
                          <span className="dps-expires-text">
                            <Timer size={11} />
                            Expires: {formatDate(request.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Record Modal */}
      {showCreateForm && selectedPatientId && (
        <div className="dps-modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="dps-modal" onClick={e => e.stopPropagation()}>
            <div className="dps-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Edit2 size={18} />
                <h3>Create Medical Record</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateForm(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="dps-modal-body">
              <MedicalRecordForm
                patientId={selectedPatientId}
                onSuccess={() => {
                  setShowCreateForm(false);
                  setSelectedPatientId(null);
                  setSuccess('Medical record created successfully.');
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default DoctorPatientSearch;