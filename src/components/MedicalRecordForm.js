// frontend/src/components/MedicalRecordForm.js

import React, { useState } from 'react';
import umhwApi from '../api/umhwApi';
import './MedicalRecordForm.css';

function MedicalRecordForm({ onSuccess, patientId }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    diagnosis: '',
    prescription: '',
    notes: '',
    recordDate: new Date().toISOString().split('T')[0]
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) {
      setFile(null);
      setFilePreview(null);
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('❌ Invalid file type. Allowed: JPEG, PNG, WEBP, PDF');
      setFile(null);
      setFilePreview(null);
      e.target.value = '';
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_SIZE) {
      setError('❌ File too large. Maximum size is 10MB');
      setFile(null);
      setFilePreview(null);
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    setError('');

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const submitData = new FormData();

      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('diagnosis', formData.diagnosis);
      submitData.append('prescription', formData.prescription);
      submitData.append('notes', formData.notes);
      submitData.append('recordDate', formData.recordDate);

      if (patientId) {
        submitData.append('patientId', patientId);
      }

      if (file) {
        submitData.append('file', file);
      }

      const res = await umhwApi.post('/medical', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        diagnosis: '',
        prescription: '',
        notes: '',
        recordDate: new Date().toISOString().split('T')[0]
      });
      setFile(null);
      setFilePreview(null);

      setSuccess('✅ Medical record created successfully!');

      if (onSuccess) onSuccess(res.data);

    } catch (err) {
      setError('❌ ' + (err.response?.data?.message || 'Failed to create medical record'));
      console.error('Create record error:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    document.getElementById('file-input').value = '';
  };

  const formatFileSize = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="medical-record-form-container">
      <div className="form-header">
        <h3>
          <span className="header-icon">📋</span>
          Create New Medical Record
        </h3>
      </div>

      {error && (
        <div className="form-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="form-message success">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="record-form">
        {/* Basic Information */}
        <div className="form-row">
          <div className="form-group">
            <label>
              <span>📄</span>
              Title
              <span className="required-indicator">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Annual Checkup, X-Ray Report"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>
              <span>📅</span>
              Record Date
              <span className="required-indicator">*</span>
            </label>
            <input
              type="date"
              name="recordDate"
              value={formData.recordDate}
              onChange={handleChange}
              required
              max={new Date().toISOString().split('T')[0]}
              disabled={loading}
            />
          </div>
        </div>

        {/* File Upload */}
        <div className="form-group full-width">
          <label>
            <span>📎</span>
            Attach File (Optional)
          </label>
          <div className={`file-upload-section ${file ? 'has-file' : ''}`}>
            <div className="upload-icon">
              {file ? '✅' : '📁'}
            </div>
            <label htmlFor="file-input" className="upload-label">
              {file ? (
                <span>File attached: <strong>{file.name}</strong></span>
              ) : (
                <span>Click to <strong>browse</strong> or drag and drop</span>
              )}
            </label>
            <input
              type="file"
              id="file-input"
              className="file-input"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileChange}
              disabled={loading}
            />
            {!file && (
              <p className="helper-text">
                Allowed: JPEG, PNG, WEBP, PDF (Max 10MB)
              </p>
            )}
            {file && (
              <div className="file-info">
                <span className="file-size">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  onClick={removeFile}
                  className="remove-file-btn"
                >
                  ✕ Remove
                </button>
              </div>
            )}
            {filePreview && (
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <img
                  src={filePreview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: 'var(--border-radius)',
                    border: '2px solid var(--gray-300)'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Medical Details Section */}
        <div className="form-section">
          <h4>
            <span>🩺</span>
            Medical Details
          </h4>
        </div>

        <div className="form-group full-width">
          <label>
            <span>🔬</span>
            Diagnosis
          </label>
          <textarea
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            placeholder="Medical diagnosis and findings..."
            disabled={loading}
          />
          <p className="helper-text info">
            💡 Detailed medical diagnosis based on examination
          </p>
        </div>

        <div className="form-group full-width">
          <label>
            <span>💊</span>
            Prescription
          </label>
          <textarea
            name="prescription"
            value={formData.prescription}
            onChange={handleChange}
            placeholder="Prescribed medications and dosage..."
            disabled={loading}
          />
          <p className="helper-text info">
            💡 List medications, dosage, and frequency
          </p>
        </div>

        <div className="form-group full-width">
          <label>
            <span>📝</span>
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional clinical notes..."
            disabled={loading}
          />
        </div>

        <div className="form-group full-width">
          <label>
            <span>📋</span>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the visit or procedure..."
            disabled={loading}
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          {onSuccess && (
            <button
              type="button"
              onClick={() => onSuccess(null)}
              className="btn-cancel"
              disabled={loading}
            >
              <span>✕</span>
              <span>Cancel</span>
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-submit"
          >
            {loading ? (
              <>
                <span className="spinner spinner-sm"></span>
                <span>Creating Record...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Create Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MedicalRecordForm;