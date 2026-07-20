// frontend/src/components/MedicalRecordForm.js

import React, { useState } from 'react';
import umhwApi from '../api/umhwApi';

function MedicalRecordForm({ patientId, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    diagnosis: '',
    prescription: '',
    notes: '',
    description: '',
    recordDate: new Date().toISOString().split('T')[0]
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('patientId', patientId);
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      if (file) formData.append('file', file);
      await umhwApi.post('/medical', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="medical-record-form">
      {error && <div className="message error">{error}</div>}

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label htmlFor="recordDate">Record Date</label>
        <input
          id="recordDate"
          name="recordDate"
          type="date"
          value={form.recordDate}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="diagnosis">Diagnosis</label>
        <textarea
          id="diagnosis"
          name="diagnosis"
          value={form.diagnosis}
          onChange={handleChange}
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="prescription">Prescription</label>
        <textarea
          id="prescription"
          name="prescription"
          value={form.prescription}
          onChange={handleChange}
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="file">Attach File</label>
        <input
          id="file"
          name="file"
          type="file"
          onChange={e => setFile(e.target.files[0])}
          accept=".jpg,.jpeg,.png,.webp,.pdf,.dcm,.tif,.tiff"
          disabled={isSubmitting}
        />
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-submit">
        {isSubmitting ? 'Saving...' : 'Save Record'}
      </button>
    </form>
  );
}

export default MedicalRecordForm;