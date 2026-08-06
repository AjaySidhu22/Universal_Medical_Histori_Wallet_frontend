// frontend/src/components/ProfileForm.js

import React, { useState } from 'react';
import {
  User, Calendar, Droplets, AlertCircle, Phone,
  Building, Stethoscope, BadgeCheck, FileText,
  Save, X, CheckCircle, AlertTriangle
} from 'lucide-react';
import umhwApi from '../api/umhwApi';
import './ProfileForm.css';

function ProfileForm({ user, profile, setProfile, setIsEditing }) {
  const isPatient = user.role === 'patient';
  const isDoctor = user.role === 'doctor';

  const [form, setForm] = useState({
    // Patient fields
    dob: profile?.dob || '',
    bloodGroup: profile?.bloodGroup || '',
    allergies: profile?.allergies || '',
    emergencyContactName: profile?.emergencyContactName || '',
    emergencyContactNumber: profile?.emergencyContactNumber || '',
    // Doctor fields
    name: profile?.name || '',
    specialty: profile?.specialty || '',
    licenseNumber: profile?.licenseNumber || '',
    hospitalAffiliation: profile?.hospitalAffiliation || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const res = await umhwApi.put('/profile/profile', form);
      setProfile(res.data.profile);
      setMessage('Profile saved successfully.');
      setMessageType('success');
      setTimeout(() => setIsEditing(false), 1200);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save profile.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-form-card">
      <div className="profile-form-header">
        <div className="profile-form-title">
          <User size={18} />
          {profile ? 'Edit Profile' : 'Create Your Profile'}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setIsEditing(false)}
          disabled={isSubmitting}
        >
          <X size={15} /> Cancel
        </button>
      </div>

      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} profile-form-message`}>
          {messageType === 'success'
            ? <CheckCircle size={15} />
            : <AlertTriangle size={15} />
          }
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form-body">

        {/* Patient fields */}
        {isPatient && (
          <>
            <div className="profile-form-section-label">Personal Information</div>

            <div className="profile-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="dob">
                  <Calendar size={13} /> Date of Birth
                </label>
                <input
                  id="dob"
                  name="dob"
                  className="form-input"
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bloodGroup">
                  <Droplets size={13} /> Blood Group *
                </label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  className="form-select"
                  value={form.bloodGroup}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select Blood Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
                <p className="form-helper">Required for emergency situations</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="allergies">
                <AlertCircle size={13} /> Allergies
              </label>
              <textarea
                id="allergies"
                name="allergies"
                className="form-textarea"
                rows={2}
                value={form.allergies}
                onChange={handleChange}
                placeholder="List any known allergies (medications, food, etc.)"
                disabled={isSubmitting}
              />
            </div>

            <div className="profile-form-section-label">Emergency Contact</div>

            <div className="profile-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="emergencyContactName">
                  <User size={13} /> Contact Name *
                </label>
                <input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  className="form-input"
                  type="text"
                  value={form.emergencyContactName}
                  onChange={handleChange}
                  placeholder="Person to contact in emergencies"
                  required
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="emergencyContactNumber">
                  <Phone size={13} /> Contact Number *
                </label>
                <input
                  id="emergencyContactNumber"
                  name="emergencyContactNumber"
                  className="form-input"
                  type="tel"
                  value={form.emergencyContactNumber}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  required
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                <p className="form-helper">Include country code</p>
              </div>
            </div>
          </>
        )}

        {/* Doctor fields */}
        {isDoctor && (
          <>
            <div className="profile-form-section-label">Professional Information</div>

            <div className="profile-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  <User size={13} /> Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  className="form-input"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full professional name"
                  required
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="specialty">
                  <Stethoscope size={13} /> Medical Specialty *
                </label>
                <input
                  id="specialty"
                  name="specialty"
                  className="form-input"
                  type="text"
                  value={form.specialty}
                  onChange={handleChange}
                  placeholder="e.g., Cardiology, Pediatrics"
                  required
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="licenseNumber">
                  <FileText size={13} /> License Number *
                </label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  className="form-input"
                  type="text"
                  value={form.licenseNumber}
                  onChange={handleChange}
                  placeholder="Your official medical license number"
                  required
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="hospitalAffiliation">
                  <Building size={13} /> Hospital / Clinic
                </label>
                <input
                  id="hospitalAffiliation"
                  name="hospitalAffiliation"
                  className="form-input"
                  type="text"
                  value={form.hospitalAffiliation}
                  onChange={handleChange}
                  placeholder="Primary hospital or clinic"
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>
            </div>

            {profile && !profile.isVerified && (
              <div className="alert alert-info">
                <BadgeCheck size={15} />
                Your profile requires admin verification before you can create medical records.
              </div>
            )}
          </>
        )}

        {/* Submit */}
        <div className="profile-form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <><div className="spinner spinner-sm" /> Saving...</>
              : <><Save size={15} /> {profile ? 'Save Changes' : 'Create Profile'}</>
            }
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setIsEditing(false)}
            disabled={isSubmitting}
          >
            <X size={15} /> Cancel
          </button>
        </div>

      </form>
    </div>
  );
}

export default ProfileForm;