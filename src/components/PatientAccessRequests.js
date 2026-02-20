// frontend/src/components/PatientAccessRequests.js

import React, { useState, useEffect } from 'react';
import umhwApi from '../api/umhwApi';
import './PatientAccessRequests.css';
import Pagination from './Pagination';  

function PatientAccessRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [customDurations, setCustomDurations] = useState({});
  const [filter, setFilter] = useState('all'); // all, pending, approved, denied
  const [currentPage, setCurrentPage] = useState(1); // ✅ ADD
  const [pagination, setPagination] = useState(null); // ✅ ADD

  const fetchRequests = async (page = 1) => { // ✅ ADD page parameter
    try {
      setLoading(true);
      const res = await umhwApi.get(`/access-requests/my-requests?page=${page}&limit=5`); // ✅ CHANGE
      setRequests(res.data.data); // ✅ CHANGE (now data.data)
      setPagination(res.data.pagination); // ✅ ADD
      setCurrentPage(page); // ✅ ADD
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setMessage('❌ Failed to load access requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchRequests(1); // ✅ Start at page 1
}, []);

  const handleRespond = async (requestId, action, requestedDuration) => {
    if (action === 'deny') {
      if (!window.confirm('Deny access to this doctor?')) return;

      try {
        await umhwApi.put(`/access-requests/${requestId}/respond`, { action });
        setMessage('✅ Request denied successfully');
        fetchRequests();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setMessage(`❌ Failed to deny request: ${err.response?.data?.message || err.message}`);
      }
      return;
    }

    const customDuration = customDurations[requestId] || requestedDuration;
    const confirmMessage = `Allow this doctor to access your medical records for ${getDurationLabel(customDuration)}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await umhwApi.put(`/access-requests/${requestId}/respond`, {
        action,
        customDurationHours: customDuration
      });
      setMessage(`✅ Request approved for ${getDurationLabel(customDuration)}`);
      fetchRequests();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ Failed to approve request: ${err.response?.data?.message || err.message}`);
    }
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

  const getStatusBadge = (status, expiresAt) => {
    const isExpired = new Date() > new Date(expiresAt);

    if (isExpired && status === 'pending') {
      return <span className="status-badge status-rejected">⏱️ Expired</span>;
    }

    const statusMap = {
      pending: <span className="status-badge status-pending">⏳ Pending</span>,
      approved: <span className="status-badge status-approved">✅ Approved</span>,
      denied: <span className="status-badge status-rejected">❌ Denied</span>
    };

    return statusMap[status] || null;
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    const isExpired = new Date() > new Date(req.expiresAt);
    if (filter === 'pending') return req.status === 'pending' && !isExpired;
    return req.status === filter;
  });

  const pendingCount = requests.filter(r => r.status === 'pending' && new Date() <= new Date(r.expiresAt)).length;

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading access requests...</p>
      </div>
    );
  }

  return (
    <div className="access-requests-container">
      <div className="access-requests-header">
        <h3>
          <span className="header-icon">📋</span>
          Access Requests from Doctors
        </h3>
        <p className="header-subtitle">
          Manage which doctors can access your medical records
        </p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
          {requests.length > 0 && <span className="tab-badge">{requests.length}</span>}
        </button>
        <button
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
          {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
        </button>
        <button
          className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approved
        </button>
        <button
          className={`filter-tab ${filter === 'denied' ? 'active' : ''}`}
          onClick={() => setFilter('denied')}
        >
          Denied
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h4>No {filter !== 'all' ? filter : ''} requests</h4>
          <p>
            {filter === 'all' 
              ? 'Doctors will appear here when they request access to your records'
              : `You have no ${filter} access requests`}
          </p>
        </div>
      ) : (
        <div className="requests-list">
          {filteredRequests.map(request => {
            const isExpired = new Date() > new Date(request.expiresAt);
            const isPending = request.status === 'pending' && !isExpired;
            const requestedDurationHours = request.requestedDuration || 
              Math.round((new Date(request.expiresAt) - new Date(request.createdAt)) / (1000 * 60 * 60));

            return (
              <div
                key={request.id}
                className={`request-card ${request.status}`}
              >
                <div className="request-header">
                  <div className="doctor-info">
                    <div className="doctor-name">
                      👨‍⚕️ Dr. {request.DoctorProfile?.name || 'Unknown'}
                    </div>
                    <div className="doctor-specialty">
                      🏥 {request.DoctorProfile?.specialty}
                    </div>
                    <div className="doctor-license">
                      📧 {request.DoctorProfile?.User?.email}
                    </div>
                  </div>
                  <div className="request-status">
                    {getStatusBadge(request.status, request.expiresAt)}
                  </div>
                </div>

                <div className="request-details">
                  <div className="detail-row">
                    <span className="detail-icon">📋</span>
                    <strong>Access Type:</strong> {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)} records
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">⏰</span>
                    <strong>Duration:</strong> {getDurationLabel(requestedDurationHours)}
                  </div>
                  {request.reason && (
                    <div className="detail-row">
                      <span className="detail-icon">💬</span>
                      <strong>Reason:</strong> {request.reason}
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <strong>Requested:</strong> {new Date(request.createdAt).toLocaleString()}
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">⏳</span>
                    <strong>Expires:</strong> {new Date(request.expiresAt).toLocaleString()}
                  </div>
                </div>

                {isPending && (
                  <>
                    <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
                      <label>
                        <span>⏰</span>
                        Approve for how long?
                      </label>
                      <select
                        value={customDurations[request.id] || requestedDurationHours}
                        onChange={(e) => setCustomDurations({
                          ...customDurations,
                          [request.id]: Number(e.target.value)
                        })}
                      >
                        <option value={0.5}>30 Minutes</option>
                        <option value={1}>1 Hour</option>
                        <option value={24}>24 Hours (1 Day)</option>
                        <option value={48}>48 Hours (2 Days)</option>
                        <option value={72}>72 Hours (3 Days)</option>
                        <option value={168}>1 Week</option>
                        <option value={336}>2 Weeks</option>
                        <option value={720}>30 Days</option>
                      </select>
                      <p className="helper-text info">
                        💡 Doctor requested: {getDurationLabel(requestedDurationHours)}
                      </p>
                    </div>

                    <div className="request-actions">
                      <button
                        onClick={() => handleRespond(request.id, 'approve', requestedDurationHours)}
                        className="action-btn btn-approve"
                      >
                        <span>✅</span>
                        <span>Approve Access</span>
                      </button>
                      <button
                        onClick={() => handleRespond(request.id, 'deny')}
                        className="action-btn btn-reject"
                      >
                        <span>❌</span>
                        <span>Deny Access</span>
                      </button>
                    </div>
                  </>
                )}

                {request.status === 'approved' && (
                  <div className="alert alert-success" style={{ marginTop: 'var(--spacing-md)' }}>
                    ✅ You approved this request on {new Date(request.respondedAt).toLocaleString()}
                  </div>
                )}

                {request.status === 'denied' && (
                  <div className="alert alert-danger" style={{ marginTop: 'var(--spacing-md)' }}>
                    ❌ You denied this request on {new Date(request.respondedAt).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
         </div>
      )}

      {/* ✅ ADD Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(page) => fetchRequests(page)}
        />
      )}
    </div>
  );
}

export default PatientAccessRequests;