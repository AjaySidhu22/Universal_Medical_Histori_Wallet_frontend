// frontend/src/components/EmergencyViewer.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Heart, Shield, Clock, Eye, FileText, Stethoscope,
  Pill, StickyNote, AlignLeft, Calendar, Droplets,
  AlertTriangle, Phone, User, Lock, AlertCircle,
  CheckCircle, Building
} from 'lucide-react';
import umhwApi from '../api/umhwApi';
import './EmergencyViewer.css';

function EmergencyViewer() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await umhwApi.get(`/qr/public/${token}`);
        setData(res.data);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'This QR code has expired or is invalid.'
            : err.response?.status === 410
            ? 'This QR code has been revoked.'
            : 'Failed to load emergency medical records.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="ev-page ev-loading">
        <div className="spinner spinner-lg" />
        <p>Loading emergency records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ev-page ev-error">
        <div className="ev-error-card">
          <div className="ev-error-icon">
            <AlertCircle size={40} />
          </div>
          <h2>Access Unavailable</h2>
          <p>{error}</p>
          <div className="ev-error-note">
            <Lock size={14} />
            This link may have expired or been revoked by the patient.
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { patient, records, accessInfo } = data;
  const expiresAt = accessInfo?.expiresAt || data.expiresAt;
  const viewCount = accessInfo?.viewCount || data.viewCount || 0;
  const accessLevel = accessInfo?.accessLevel || data.accessLevel;

  return (
    <div className="ev-page">
      {/* Top bar */}
      <div className="ev-topbar">
        <div className="ev-topbar-brand">
          <div className="ev-topbar-logo">
            <Heart size={16} strokeWidth={2.5} />
          </div>
          <span>MediWallet</span>
        </div>
        <div className="ev-topbar-badges">
          <span className="badge badge-danger">
            <AlertTriangle size={10} /> Emergency Access
          </span>
          <span className="badge badge-muted">
            <Lock size={10} /> Read-Only
          </span>
        </div>
      </div>

      <div className="ev-container">

        {/* Access info banner */}
        <div className="ev-access-banner">
          <div className="ev-access-item">
            <Shield size={14} />
            <span>Level: <strong>{accessLevel}</strong></span>
          </div>
          <div className="ev-access-item">
            <Clock size={14} />
            <span>Expires: <strong>{new Date(expiresAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
          </div>
          <div className="ev-access-item">
            <Eye size={14} />
            <span>Views: <strong>{viewCount}</strong></span>
          </div>
        </div>

        {/* Patient info */}
        <div className="ev-card">
          <div className="ev-card-header">
            <User size={18} />
            <h2>Patient Information</h2>
          </div>
          <div className="ev-patient-grid">
            {patient?.dob && (
              <div className="ev-field">
                <span className="ev-field-label">
                  <Calendar size={12} /> Date of Birth
                </span>
                <span className="ev-field-value">{patient.dob}</span>
              </div>
            )}
            {patient?.bloodGroup && (
              <div className="ev-field ev-field-critical">
                <span className="ev-field-label">
                  <Droplets size={12} /> Blood Group
                </span>
                <span className="ev-field-value ev-field-value-large">
                  {patient.bloodGroup}
                </span>
              </div>
            )}
            {patient?.allergies && (
              <div className="ev-field ev-field-warning">
                <span className="ev-field-label">
                  <AlertTriangle size={12} /> Allergies
                </span>
                <span className="ev-field-value">{patient.allergies}</span>
              </div>
            )}
            {patient?.emergencyContactName && (
              <div className="ev-field">
                <span className="ev-field-label">
                  <User size={12} /> Emergency Contact
                </span>
                <span className="ev-field-value">{patient.emergencyContactName}</span>
              </div>
            )}
            {patient?.emergencyContactNumber && (
              <div className="ev-field">
                <span className="ev-field-label">
                  <Phone size={12} /> Emergency Phone
                </span>
                <span className="ev-field-value ev-phone">
                  <a href={`tel:${patient.emergencyContactNumber}`}>
                    {patient.emergencyContactNumber}
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Medical records */}
        {records && records.length > 0 && (
          <div className="ev-card">
            <div className="ev-card-header">
              <FileText size={18} />
              <h2>Medical Records ({records.length})</h2>
            </div>
            <div className="ev-records-list">
              {records.map((record, index) => (
                <div key={record.id || index} className="ev-record">
                  <div className="ev-record-header">
                    <div className="ev-record-icon">
                      <FileText size={15} />
                    </div>
                    <div>
                      <h3 className="ev-record-title">{record.title}</h3>
                      <div className="ev-record-meta">
                        <Calendar size={12} />
                        {new Date(record.recordDate).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {record.fileName && (
                    <div className="ev-record-attachment">
                      <FileText size={13} />
                      <span>{record.fileName}</span>
                    </div>
                  )}

                  {record.DoctorProfile && (
                    <div className="ev-record-doctor">
                      <Stethoscope size={13} />
                      <span>
                        {record.DoctorProfile.name?.startsWith('Dr.')
                          ? record.DoctorProfile.name
                          : `Dr. ${record.DoctorProfile.name}`}
                        {record.DoctorProfile.specialty && (
                          <span className="ev-doctor-specialty">
                            · {record.DoctorProfile.specialty}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="ev-record-fields">
                    {record.diagnosis && record.diagnosis !== 'NA' && (
                      <div className="ev-record-field">
                        <span className="ev-record-field-label">
                          <Stethoscope size={11} /> Diagnosis
                        </span>
                        <span className="ev-record-field-value">{record.diagnosis}</span>
                      </div>
                    )}
                    {record.prescription && record.prescription !== 'NA' && (
                      <div className="ev-record-field">
                        <span className="ev-record-field-label">
                          <Pill size={11} /> Prescription
                        </span>
                        <span className="ev-record-field-value">{record.prescription}</span>
                      </div>
                    )}
                    {record.notes && record.notes !== 'NA' && (
                      <div className="ev-record-field">
                        <span className="ev-record-field-label">
                          <StickyNote size={11} /> Notes
                        </span>
                        <span className="ev-record-field-value">{record.notes}</span>
                      </div>
                    )}
                    {record.description && record.description !== 'NA' && (
                      <div className="ev-record-field">
                        <span className="ev-record-field-label">
                          <AlignLeft size={11} /> Description
                        </span>
                        <span className="ev-record-field-value">{record.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer notice */}
        <div className="ev-footer">
          <Lock size={14} />
          <p>
            This is a secure, time-limited view of medical records.
            This page does not store any data.
          </p>
        </div>

      </div>
    </div>
  );
}

export default EmergencyViewer;