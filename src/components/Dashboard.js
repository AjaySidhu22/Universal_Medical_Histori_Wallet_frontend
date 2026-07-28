// frontend/src/components/Dashboard.js

import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  User, QrCode, Bell, FileText, Edit2, Shield,
  AlertTriangle, CheckCircle, Clock, Phone,
  Calendar, Droplets, AlertCircle, Building,
  BadgeCheck, XCircle, ChevronRight, Plus
} from 'lucide-react';
import PatientAccessRequests from './PatientAccessRequests';
import EmergencyQR from './EmergencyQR';
import ProfileForm from './ProfileForm';
import umhwApi from '../api/umhwApi';
import './Dashboard.css';

const PATIENT_TABS = [
  { id: 'profile',   label: 'Profile',          icon: User    },
  { id: 'qr',        label: 'Emergency QR',      icon: QrCode  },
  { id: 'requests',  label: 'Access Requests',   icon: Bell    },
];

const DOCTOR_TABS = [
  { id: 'profile',   label: 'Profile',          icon: User    },
];

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [verificationWarning, setVerificationWarning] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await umhwApi.get('/profile/profile');
        if (res.data.user.role === 'admin') {
          navigate('/admin', { replace: true });
          return;
        }
        setUser(res.data.user);
        setProfile(res.data.profile);
        if (res.data.profile?.verificationWarning) {
          setVerificationWarning(res.data.profile.message);
        }
      } catch {
        sessionStorage.removeItem('accessToken');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="page-loading page-content">
        <div className="spinner spinner-lg" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!user) return null;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;

  const tabs = user.role === 'patient' ? PATIENT_TABS : DOCTOR_TABS;

  return (
    <div className="page-content">
      <div className="container">

        {/* Page header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Dashboard</h1>
            <p className="dash-subtitle">
              Welcome back, <strong>{user.email}</strong>
            </p>
          </div>
          <span className={`badge badge-primary`} style={{ textTransform: 'capitalize' }}>
            {user.role}
          </span>
        </div>

        {/* Verification warning */}
        {verificationWarning && (
          <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
            <AlertTriangle size={16} />
            <div>
              <strong>Verification Status Changed</strong>
              <p style={{ margin: 0, marginTop: 'var(--space-1)', fontSize: 'var(--text-sm)' }}>
                {verificationWarning}
              </p>
            </div>
          </div>
        )}

        {/* Tab navigation */}
        <div className="dash-tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`dash-tab ${activeTab === id ? 'dash-tab-active' : ''}`}
              onClick={() => { setActiveTab(id); setIsEditing(false); }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
          {/* Records link */}
          <button
            className="dash-tab"
            onClick={() => navigate('/records')}
          >
            <FileText size={15} />
            Medical Records
            <ChevronRight size={13} style={{ marginLeft: 'auto' }} />
          </button>
        </div>

        {/* Tab content */}
        <div className="dash-content">

          {/* Profile tab */}
          {activeTab === 'profile' && (
            isEditing ? (
              <ProfileForm
                user={user}
                profile={profile}
                setProfile={(p) => {
                  setProfile(p);
                  if (p?.verificationWarning) setVerificationWarning(p.message);
                }}
                setIsEditing={setIsEditing}
              />
            ) : (
              <div className="dash-card">
                <div className="dash-card-header">
                  <div className="dash-card-title">
                    <User size={18} />
                    Profile Information
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 size={13} />
                      {profile ? 'Edit' : 'Create Profile'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate('/2fa-settings')}
                    >
                      <Shield size={13} />
                      2FA
                    </button>
                  </div>
                </div>

                {profile ? (
                  <div className="dash-card-body">
                    {user.role === 'patient' && (
                      <div className="profile-grid">
                        <ProfileField label="Username" value={`@${user.username}`} />
                        <ProfileField label="Date of Birth" value={profile.dob} icon={<Calendar size={14} />} />
                        <ProfileField label="Blood Group" value={profile.bloodGroup} icon={<Droplets size={14} />} highlight />
                        <ProfileField label="Allergies" value={profile.allergies || 'None listed'} icon={<AlertCircle size={14} />} />
                        <ProfileField label="Emergency Contact" value={profile.emergencyContactName} icon={<Phone size={14} />} />
                        <ProfileField label="Emergency Number" value={profile.emergencyContactNumber} icon={<Phone size={14} />} />
                      </div>
                    )}
                    {user.role === 'doctor' && (
                      <div className="profile-grid">
                        <ProfileField label="Username" value={`@${user.username}`} />
                        <ProfileField label="Full Name" value={profile.name} icon={<User size={14} />} />
                        <ProfileField label="Specialty" value={profile.specialty} icon={<BadgeCheck size={14} />} />
                        <ProfileField label="License Number" value={profile.licenseNumber} icon={<FileText size={14} />} />
                        <ProfileField label="Hospital" value={profile.hospitalAffiliation} icon={<Building size={14} />} />
                        <div className="profile-field">
                          <span className="profile-field-label">Verification Status</span>
                          <span className={`badge ${profile.isVerified ? 'badge-success' : 'badge-warning'}`}>
                            {profile.isVerified
                              ? <><CheckCircle size={11} /> Verified</>
                              : <><Clock size={11} /> Pending Verification</>
                            }
                          </span>
                          {!profile.isVerified && (
                            <p className="profile-field-note">
                              An admin must verify your profile before you can create medical records.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="dash-card-body">
                    <div className="empty-state">
                      <User size={40} className="empty-state-icon" />
                      <h3>No profile yet</h3>
                      <p>Create your profile to access all features.</p>
                      <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                        <Plus size={15} /> Create Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* Emergency QR tab — patient only */}
          {activeTab === 'qr' && user.role === 'patient' && (
            <EmergencyQR />
          )}

          {/* Access Requests tab — patient only */}
          {activeTab === 'requests' && user.role === 'patient' && (
            <PatientAccessRequests />
          )}

        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value, icon, highlight }) {
  return (
    <div className={`profile-field ${highlight ? 'profile-field-highlight' : ''}`}>
      <span className="profile-field-label">
        {icon && <span className="profile-field-icon">{icon}</span>}
        {label}
      </span>
      <span className="profile-field-value">
        {value || <em style={{ color: 'var(--color-text-muted)', fontStyle: 'normal' }}>Not set</em>}
      </span>
    </div>
  );
}

export default Dashboard;