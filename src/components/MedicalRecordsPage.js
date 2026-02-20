// frontend/src/components/MedicalRecordsPage.js

import React, { useState, useEffect } from 'react';
import umhwApi from '../api/umhwApi';
import DoctorPatientSearch from './DoctorPatientSearch';
import './MedicalRecordsPage.css';
import Pagination from './Pagination';

function MedicalRecordsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await umhwApi.get('/profile/profile');
        setUser(res.data.user);
        setProfile(res.data.profile);
        fetchMyRecords(1);
      } catch (err) {
        console.error("Profile fetch failed:", err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const fetchMyRecords = async (page = 1) => {
  try {
    const res = await umhwApi.get(`/medical?page=${page}&limit=5`);
    setRecords(res.data.data);
    setPagination(res.data.pagination);
    setCurrentPage(page);
    setError('');
  } catch (err) {
    console.error("Record fetch failed:", err);
    setError('Failed to fetch records');
  }
};

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this medical record? This action cannot be undone.')) {
      return;
    }

    try {
      await umhwApi.delete(`/medical/${recordId}`);
      setRecords(records.filter(r => r.id !== recordId));
    } catch (err) {
      alert('Failed to delete record: ' + (err.response?.data?.message || err.message));
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

  // Filter records based on search
  const filteredRecords = records.filter(record =>
    record.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="records-loading">
        <div className="spinner"></div>
        <p>Loading Medical Records...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>User information missing</h3>
        <p>Please log in again to continue</p>
      </div>
    );
  }

  const isDoctor = user.role === 'doctor';
  const isPatient = user.role === 'patient';

  return (
    <div className="medical-records-page">
      {/* Header */}
      <div className="records-header">
        <h2>
          <span>📋</span>
          Medical Records Management
        </h2>
        <p className="records-subtitle">
          Current Role: <span className="badge badge-primary">{user.role}</span>
        </p>
      </div>

      {/* Doctor Search */}
      {isDoctor && (
        <div style={{ marginBottom: '40px' }}>
          <DoctorPatientSearch />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Stats Bar */}
      {records.length > 0 && (
        <div className="records-stats">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>{records.length}</h4>
              <p>Total Records</p>
            </div>
          </div>
          {isPatient && (
            <div className="stat-card">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-content">
                <h4>{new Set(records.map(r => r.doctorId)).size}</h4>
                <p>Healthcare Providers</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="records-actions">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Doctor Info Note */}
      {isDoctor && records.length > 0 && (
        <div className="alert alert-info">
          💡 <strong>Note:</strong> You can only see records for patients who have approved your access request.
        </div>
      )}

      {/* Records Grid */}
      {filteredRecords.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <>
              <div className="empty-icon">🔍</div>
              <h3>No matching records</h3>
              <p>Try adjusting your search terms</p>
            </>
          ) : (
            <>
              <div className="empty-icon">{isDoctor ? '👨‍⚕️' : '📋'}</div>
              <h3>
                {isDoctor ? 'No records available' : 'No medical records yet'}
              </h3>
              <p>
                {isDoctor
                  ? 'Request patient access to view and create medical records'
                  : 'Your doctor will create records for you after receiving your approval'}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="records-grid">
          {filteredRecords.map(record => (
            <div key={record.id} className="record-card">
              <div className="record-card-header">
                <div>
                  <h3 className="record-title">
                    <span>📄</span>
                    {record.title}
                  </h3>
                  <div className="record-date">
                    <span>📅</span>
                    {new Date(record.recordDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* File Attachment */}
              {record.fileKey && (
                <div className="record-attachments">
                  <div className="attachment-badge">
                    <span>{getFileIcon(record.fileType)}</span>
                    <span>{record.fileName}</span>
                    <span>({formatFileSize(record.fileSize)})</span>
                  </div>
                </div>
              )}

              {/* Doctor/Patient Info */}
              {isPatient && record.DoctorProfile && (
                <div className="metadata-tag">
                  <span>👨‍⚕️</span>
                  <span>
                    Dr. {record.DoctorProfile.name || record.DoctorProfile.User?.email || 'Unknown'}
                    {record.DoctorProfile.specialty && ` (${record.DoctorProfile.specialty})`}
                  </span>
                </div>
              )}

              {isDoctor && record.Patient && (
                <div className="metadata-tag">
                  <span>👤</span>
                  <span>Patient: {record.Patient.User?.email || 'Unknown'}</span>
                </div>
              )}

              {/* Diagnosis */}
              {record.diagnosis && (
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                    🩺 Diagnosis:
                  </strong>
                  <p className="record-description">
                    {record.diagnosis}
                  </p>
                </div>
              )}

              {/* Prescription */}
              {record.prescription && (
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                    💊 Prescription:
                  </strong>
                  <p className="record-description">
                    {record.prescription}
                  </p>
                </div>
              )}

              {/* Notes */}
              {record.notes && (
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                    📝 Notes:
                  </strong>
                  <p className="record-description" style={{ fontStyle: 'italic' }}>
                    {record.notes}
                  </p>
                </div>
              )}

              {/* Description */}
              {record.description && (
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                    📋 Description:
                  </strong>
                  <p className="record-description">
                    {record.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="record-actions">
                {record.fileUrl && (
                  
                   <a href={record.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-view"
                  >
                    <span>👁️</span>
                    <span>View File</span>
                  </a>
                )}

                {(isPatient || (isDoctor && record.doctorId)) && (
                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    className="btn-delete"
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

     {/* ✅ ADD Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(page) => fetchMyRecords(page)}
        />
      )}
    </div>
  );
}

 

export default MedicalRecordsPage;