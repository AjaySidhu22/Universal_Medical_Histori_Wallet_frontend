// frontend/src/components/MedicalRecordsPage.js

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Search, Edit2, Trash2, Eye, Upload,
  Stethoscope, Pill, StickyNote, AlignLeft, Calendar,
  User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  BarChart2, Users, Plus, X, Save
} from 'lucide-react';
import umhwApi from '../api/umhwApi';
import DoctorPatientSearch from './DoctorPatientSearch';
import Pagination from './Pagination';
import './MedicalRecordsPage.css';

function MedicalRecordsPage() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const fetchUserAndRecords = async () => {
      try {
        const res = await umhwApi.get('/profile/profile');
        setUser(res.data.user);
        await fetchMyRecords(1, res.data.user);
      } catch {
        setError('Failed to load records. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndRecords();
  }, []);

  const fetchMyRecords = async (page = 1) => {
    try {
      const res = await umhwApi.get(`/medical?page=${page}&limit=5`);
      setRecords(res.data.data);
      setPagination(res.data.pagination);
      setCurrentPage(page);
      setError('');
    } catch {
      setError('Failed to fetch records.');
    }
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record.id);
    setEditForm({
      title: record.title || '',
      diagnosis: record.diagnosis || '',
      prescription: record.prescription || '',
      notes: record.notes || '',
      description: record.description || '',
      recordDate: record.recordDate || ''
    });
  };

  const handleSaveEdit = async (recordId) => {
    try {
      await umhwApi.put(`/medical/${recordId}`, editForm);
      setEditingRecord(null);
      fetchMyRecords(currentPage);
    } catch (err) {
      alert('Failed to update: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Delete this medical record? This cannot be undone.')) return;
    try {
      await umhwApi.delete(`/medical/${recordId}`);
      const remaining = records.filter(r => r.id !== recordId).length;
      if (remaining === 0 && currentPage > 1) {
        fetchMyRecords(currentPage - 1);
      } else {
        fetchMyRecords(currentPage);
      }
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.message || err.message));
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <FileText size={14} />;
    if (fileType.startsWith('image/')) return <FileText size={14} />;
    if (fileType === 'application/pdf') return <FileText size={14} />;
    return <FileText size={14} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredRecords = useMemo(() =>
    records.filter(r =>
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [records, searchTerm]
  );

  if (loading) {
    return (
      <div className="page-content page-loading">
        <div className="spinner spinner-lg" />
        <p>Loading records...</p>
      </div>
    );
  }

  if (!user) return null;

  const isDoctor = user.role === 'doctor';
  const isPatient = user.role === 'patient';

  return (
    <div className="page-content">
      <div className="container">

        {/* Page header */}
        <div className="records-page-header">
          <div>
            <h1 className="dash-title">Medical Records</h1>
            <p className="dash-subtitle">
              {isDoctor
                ? 'View and manage records for patients who have approved your access.'
                : 'Your complete medical history in one place.'}
            </p>
          </div>
        </div>

        {/* Doctor access request section */}
        {isDoctor && (
          <div className="records-section">
            <DoctorPatientSearch />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 'var(--space-5)' }}>
            {error}
          </div>
        )}

        {/* Stats row */}
        {records.length > 0 && (
          <div className="records-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <BarChart2 size={20} />
              </div>
              <div>
                <div className="stat-value">{pagination?.totalItems || records.length}</div>
                <div className="stat-label">Total Records</div>
              </div>
            </div>
            {isPatient && (
              <div className="stat-card">
                <div className="stat-icon">
                  <Users size={20} />
                </div>
                <div>
                  <div className="stat-value">
                    {new Set(records.map(r => r.DoctorProfile?.userId)).size}
                  </div>
                  <div className="stat-label">Healthcare Providers</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="records-search-bar">
          <Search size={16} className="records-search-icon" />
          <input
            type="text"
            placeholder="Search by title, diagnosis, or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="records-search-input"
          />
          {searchTerm && (
            <button
              className="records-search-clear"
              onClick={() => setSearchTerm('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Doctor note */}
        {isDoctor && (
          <div className="alert alert-info" style={{ marginBottom: 'var(--space-5)' }}>
            You can only see records for patients who have approved your access request.
          </div>
        )}

        {/* Records list */}
        {filteredRecords.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} className="empty-state-icon" />
            <h3>{searchTerm ? 'No matching records' : 'No records yet'}</h3>
            <p>
              {searchTerm
                ? 'Try a different search term.'
                : isDoctor
                  ? 'Request patient access to view and create medical records.'
                  : 'Your doctor will create records after receiving your approval.'}
            </p>
          </div>
        ) : (
          <div className="records-list">
            {filteredRecords.map(record => (
              <div key={record.id} className="record-card">

                {/* Record header — always visible */}
                <div className="record-card-header">
                  <div className="record-card-title-row">
                    <div className="record-icon">
                      <FileText size={16} />
                    </div>
                    <div>
                      <h3 className="record-title">{record.title}</h3>
                      <div className="record-meta">
                        <Calendar size={12} />
                        {new Date(record.recordDate).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {!editingRecord && (
                    <div className="record-actions-top">
                      {record.fileUrl && (
                        
                        <a  href={record.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                        >
                          <Eye size={13} /> View File
                        </a>
                      )}
                      {isDoctor && record.DoctorProfile?.userId === user.id && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditRecord(record)}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                      )}
                      {user.role === 'admin' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* File attachment */}
                {record.fileName && (
                  <div className="record-attachment">
                    <Upload size={13} />
                    <span>{record.fileName}</span>
                    {record.fileSize && (
                      <span className="record-attachment-size">
                        ({formatFileSize(record.fileSize)})
                      </span>
                    )}
                  </div>
                )}

                {/* Doctor / Patient info */}
                {isPatient && record.DoctorProfile && (
                  <div className="record-provider">
                    <User size={13} />
                    {record.DoctorProfile.name?.startsWith('Dr.')
                      ? record.DoctorProfile.name
                      : `Dr. ${record.DoctorProfile.name}`}
                    {record.DoctorProfile.specialty && (
                      <span className="record-specialty">· {record.DoctorProfile.specialty}</span>
                    )}
                  </div>
                )}

                {isDoctor && record.Patient && (
                  <div className="record-provider">
                    <User size={13} />
                    Patient: {record.Patient.User?.email}
                  </div>
                )}

                {/* EDIT MODE */}
                {editingRecord === record.id ? (
                  <div className="record-edit-form">
                    <div className="record-edit-grid">
                      <div className="form-group">
                        <label className="form-label">Title</label>
                        <input
                          className="form-input"
                          value={editForm.title}
                          onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Record Date</label>
                        <input
                          className="form-input"
                          type="date"
                          value={editForm.recordDate}
                          onChange={e => setEditForm({ ...editForm, recordDate: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Diagnosis</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          value={editForm.diagnosis}
                          onChange={e => setEditForm({ ...editForm, diagnosis: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Prescription</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          value={editForm.prescription}
                          onChange={e => setEditForm({ ...editForm, prescription: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          value={editForm.notes}
                          onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          value={editForm.description}
                          onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="record-edit-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(record.id)}>
                        <Save size={13} /> Save Changes
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingRecord(null)}>
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE — record fields */
                  <div className="record-fields">
                    {record.diagnosis && record.diagnosis !== 'NA' && (
                      <div className="record-field">
                        <span className="record-field-label">
                          <Stethoscope size={12} /> Diagnosis
                        </span>
                        <span className="record-field-value">{record.diagnosis}</span>
                      </div>
                    )}
                    {record.prescription && record.prescription !== 'NA' && (
                      <div className="record-field">
                        <span className="record-field-label">
                          <Pill size={12} /> Prescription
                        </span>
                        <span className="record-field-value">{record.prescription}</span>
                      </div>
                    )}
                    {record.notes && record.notes !== 'NA' && (
                      <div className="record-field">
                        <span className="record-field-label">
                          <StickyNote size={12} /> Notes
                        </span>
                        <span className="record-field-value">{record.notes}</span>
                      </div>
                    )}
                    {record.description && record.description !== 'NA' && (
                      <div className="record-field">
                        <span className="record-field-label">
                          <AlignLeft size={12} /> Description
                        </span>
                        <span className="record-field-value">{record.description}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={fetchMyRecords}
          />
        )}
      </div>
    </div>
  );
}

export default MedicalRecordsPage;