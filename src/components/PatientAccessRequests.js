// frontend/src/components/PatientAccessRequests.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope, Clock, CheckCircle, XCircle, AlertCircle,
  Calendar, Timer, MessageSquare, Activity, Check, X,
  RefreshCw, ChevronDown
} from 'lucide-react';
import umhwApi from '../api/umhwApi';
import './PatientAccessRequests.css';

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Denied'];

const getStatusInfo = (status, expiresAt) => {
  const isExpired = new Date() > new Date(expiresAt);
  if (isExpired && (status === 'approved' || status === 'pending')) {
    return { label: 'Expired', icon: AlertCircle, className: 'status-expired' };
  }
  switch (status) {
    case 'approved': return { label: 'Approved', icon: CheckCircle, className: 'status-approved' };
    case 'denied':   return { label: 'Denied',   icon: XCircle,     className: 'status-denied'   };
    default:         return { label: 'Pending',  icon: Clock,       className: 'status-pending'  };
  }
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

function PatientAccessRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [respondingId, setRespondingId] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await umhwApi.get('/access-requests/my-requests?page=1&limit=50');
      setRequests(res.data.data || []);
    } catch {
      setMessage('Failed to load access requests.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRespond = async (requestId, action) => {
    setRespondingId(requestId);
    try {
      await umhwApi.put(`/access-requests/${requestId}/respond`, { action });
      setMessage(`Request ${action === 'approve' ? 'approved' : 'denied'} successfully.`);
      setMessageType('success');
      await fetchRequests();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to respond to request.');
      setMessageType('error');
    } finally {
      setRespondingId(null);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const filtered = requests.filter(r => {
    if (activeFilter === 'All') return true;
    return r.status?.toLowerCase() === activeFilter.toLowerCase();
  });

  const counts = {
    All: requests.length,
    Pending: requests.filter(r => r.status === 'pending').length,
    Approved: requests.filter(r => r.status === 'approved').length,
    Denied: requests.filter(r => r.status === 'denied').length,
  };

  if (loading) {
    return (
      <div className="access-loading">
        <div className="spinner" />
        <p>Loading access requests...</p>
      </div>
    );
  }

  return (
    <div className="access-requests">

      {/* Header */}
      <div className="access-header">
        <div>
          <h2 className="access-title">Access Requests</h2>
          <p className="access-subtitle">
            Manage which doctors can view and create your medical records.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchRequests}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ marginBottom: 'var(--space-5)' }}>
          {messageType === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {message}
        </div>
      )}

      {/* Filter tabs */}
      <div className="access-filters">
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter}
            className={`access-filter-btn ${activeFilter === filter ? 'access-filter-active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
            {counts[filter] > 0 && (
              <span className="access-filter-count">{counts[filter]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Stethoscope size={40} className="empty-state-icon" />
          <h3>No {activeFilter !== 'All' ? activeFilter.toLowerCase() : ''} requests</h3>
          <p>Doctors will appear here when they request access to your records.</p>
        </div>
      ) : (
        <div className="access-list">
          {filtered.map(request => {
            const statusInfo = getStatusInfo(request.status, request.expiresAt);
            const StatusIcon = statusInfo.icon;
            const isPending = request.status === 'pending' &&
              new Date() < new Date(request.expiresAt);
            const isResponding = respondingId === request.id;

            return (
              <div key={request.id} className={`access-card ${statusInfo.className}`}>

                {/* Card header */}
                <div className="access-card-header">
                  <div className="access-doctor-info">
                    <div className="access-doctor-avatar">
                      <Stethoscope size={16} />
                    </div>
                    <div>
                      <div className="access-doctor-name">
                        {request.DoctorProfile?.name?.startsWith('Dr.')
                          ? request.DoctorProfile.name
                          : `Dr. ${request.DoctorProfile?.name || 'Unknown'}`}
                      </div>
                      <div className="access-doctor-specialty">
                        {request.DoctorProfile?.specialty || 'General Practice'}
                      </div>
                      <div className="access-doctor-email">
                        {request.DoctorProfile?.User?.email}
                      </div>
                    </div>
                  </div>
                  <span className={`access-status-badge ${statusInfo.className}`}>
                    <StatusIcon size={12} />
                    {statusInfo.label}
                  </span>
                </div>

                {/* Card details */}
                <div className="access-card-details">
                  <div className="access-detail">
                    <Activity size={13} />
                    <span className="access-detail-label">Access Type</span>
                    <span className="access-detail-value">
                      {request.requestType === 'both' ? 'View & Create'
                        : request.requestType === 'view' ? 'View Only'
                        : 'Create Only'}
                    </span>
                  </div>
                  <div className="access-detail">
                    <Timer size={13} />
                    <span className="access-detail-label">Duration</span>
                    <span className="access-detail-value">
                      {request.requestedDuration < 24
                        ? `${request.requestedDuration} hour${request.requestedDuration > 1 ? 's' : ''}`
                        : `${request.requestedDuration / 24} day${request.requestedDuration / 24 > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  {request.reason && (
                    <div className="access-detail">
                      <MessageSquare size={13} />
                      <span className="access-detail-label">Reason</span>
                      <span className="access-detail-value">{request.reason}</span>
                    </div>
                  )}
                  <div className="access-detail">
                    <Calendar size={13} />
                    <span className="access-detail-label">Requested</span>
                    <span className="access-detail-value">{formatDate(request.createdAt)}</span>
                  </div>
                  <div className="access-detail">
                    <Clock size={13} />
                    <span className="access-detail-label">Expires</span>
                    <span className="access-detail-value">{formatDate(request.expiresAt)}</span>
                  </div>
                </div>

                {/* Approval actions */}
                {isPending && (
                  <div className="access-card-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleRespond(request.id, 'approve')}
                      disabled={isResponding}
                    >
                      {isResponding
                        ? <><div className="spinner spinner-sm" /> Processing...</>
                        : <><Check size={13} /> Approve</>}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRespond(request.id, 'deny')}
                      disabled={isResponding}
                    >
                      <X size={13} /> Deny
                    </button>
                  </div>
                )}

                {/* Responded note */}
                {request.respondedAt && (
                  <div className="access-responded-note">
                    <CheckCircle size={13} />
                    You {request.status} this request on {formatDate(request.respondedAt)}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PatientAccessRequests;