// frontend/src/components/ProfileForm.js

import React, { useState } from 'react';
import umhwApi from '../api/umhwApi';
import './ProfileForm.css';

const formFields = {
  patient: [
    { 
      name: 'dob', 
      label: 'Date of Birth', 
      type: 'date',
      icon: '📅',
      helper: 'Your date of birth for medical records'
    },
    {
      name: 'bloodGroup',
      label: 'Blood Group',
      type: 'select',
      icon: '🩸',
      options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
      helper: 'Required for emergency situations'
    },
    { 
      name: 'allergies', 
      label: 'Allergies', 
      type: 'textarea',
      icon: '⚠️',
      helper: 'List any known allergies (medications, food, etc.)'
    },
    { 
      name: 'emergencyContactName', 
      label: 'Emergency Contact Name', 
      type: 'text',
      icon: '👤',
      required: true,
      helper: 'Person to contact in case of emergency'
    },
    { 
      name: 'emergencyContactNumber', 
      label: 'Emergency Contact Number', 
      type: 'tel',
      icon: '📞',
      required: true,
      helper: 'Phone number with country code (e.g., +1234567890)'
    },
  ],
  doctor: [
    { 
      name: 'name', 
      label: 'Full Name', 
      type: 'text', 
      required: true,
      icon: '👨‍⚕️',
      helper: 'Your full professional name'
    },
    { 
      name: 'specialty', 
      label: 'Medical Specialty', 
      type: 'text', 
      required: true,
      icon: '🏥',
      helper: 'Your area of medical expertise (e.g., Cardiology, Pediatrics)'
    },
    { 
      name: 'licenseNumber', 
      label: 'Medical License Number', 
      type: 'text', 
      required: true,
      icon: '🆔',
      helper: 'Your official medical license number'
    },
    { 
      name: 'hospitalAffiliation', 
      label: 'Hospital/Clinic Affiliation', 
      type: 'text',
      icon: '🏨',
      helper: 'Primary hospital or clinic where you practice'
    },
  ],
};

function ProfileForm({ user, profile, setProfile, setIsEditing }) {
  const initial = profile || {};
  const [form, setForm] = useState(initial);
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg('');

    try {
      const res = await umhwApi.put('/profile/profile', form);
      setProfile(res.data.profile);
      setMsg('✅ Profile updated successfully!');

      setTimeout(() => {
        setIsEditing(false);
      }, 1500);
    } catch (err) {
      console.error('Profile update error:', err);
      setMsg('❌ ' + (err.response?.data?.message || 'Error updating profile'));
    } finally {
      setIsLoading(false);
    }
  };

  const fieldsToRender = formFields[user.role] || [];

  return (
    <div className="profile-form-container">
      <div className="profile-form-header">
        <h3>
          <span className="form-icon">
            {user.role === 'patient' ? '🏥' : '👨‍⚕️'}
          </span>
          {profile ? 'Update Your Profile' : 'Create Your Profile'}
        </h3>
      </div>

      {msg && (
        <div className={`form-message ${msg.includes('✅') ? 'success' : 'error'}`}>
          {msg}
        </div>
      )}

      <form onSubmit={submit} className="profile-form">
        {user.role === 'patient' && (
          <div className="form-section">
            <h4>
              <span>📋</span>
              Personal Information
            </h4>
          </div>
        )}

        {user.role === 'doctor' && (
          <div className="form-section">
            <h4>
              <span>👨‍⚕️</span>
              Professional Information
            </h4>
          </div>
        )}

        {fieldsToRender.map((field) => (
          <div 
            key={field.name} 
            className={`form-field ${field.type === 'textarea' ? 'full-width' : ''}`}
          >
            <label>
              <span>{field.icon}</span>
              {field.label}
              {field.required && <span className="required-star">*</span>}
            </label>

            {field.type === 'select' ? (
              <select
                name={field.name}
                value={form[field.name] || ''}
                onChange={handleChange}
                required={field.required}
                disabled={isLoading}
              >
                <option value="">Select {field.label}...</option>
                {field.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                name={field.name}
                value={form[field.name] || ''}
                onChange={handleChange}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                disabled={isLoading}
              />
            ) : (
              <input
                type={field.type}
                name={field.name}
                value={form[field.name] || ''}
                onChange={handleChange}
                required={field.required}
                placeholder={
                  field.type === 'tel' 
                    ? '+1234567890' 
                    : field.type === 'date'
                    ? 'YYYY-MM-DD'
                    : `Enter ${field.label.toLowerCase()}...`
                }
                disabled={isLoading}
                className={field.type === 'date' ? 'date-input' : ''}
              />
            )}

            {field.helper && (
              <div className="helper-text info">
                💡 {field.helper}
              </div>
            )}
          </div>
        ))}

        {user.role === 'patient' && (
          <div className="form-section">
            <h4>
              <span>🚨</span>
              Emergency Contact
            </h4>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            disabled={isLoading}
            className="btn-cancel"
          >
            <span>✕</span>
            <span>Cancel</span>
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-save"
          >
            {isLoading ? (
              <>
                <span className="spinner spinner-sm"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileForm;