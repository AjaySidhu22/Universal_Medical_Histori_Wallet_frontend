// frontend/src/components/Dashboard.js

import React, { useEffect, useState } from 'react';
import PatientAccessRequests from './PatientAccessRequests';
import umhwApi from '../api/umhwApi';
import ProfileForm from './ProfileForm';
import { useNavigate, Navigate } from 'react-router-dom';
import EmergencyQR from './EmergencyQR';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [verificationWarning, setVerificationWarning] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await umhwApi.get('/profile/profile');
        setUser(res.data.user);

        // If user is admin, redirect to admin panel
        if (res.data.user.role === 'admin') {
          navigate('/admin', { replace: true });
          return;
        }

        setProfile(res.data.profile);

        // Check for verification warning
        if (res.data.profile?.verificationWarning) {
          setVerificationWarning(res.data.profile.message);
        }
      } catch (err) {
        console.error("❌ Profile fetch failed:", err);
        sessionStorage.removeItem('accessToken');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Error state
  if (!user) {
    return (
      <div className="dashboard-empty">
        <div className="empty-icon">⚠️</div>
        <h3>Unable to load user data</h3>
        <p>Please log in again to continue</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Go to Login
        </button>
      </div>
    );
  }

  // Redirect admins to admin panel
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <h2>🏥 Dashboard</h2>
        <p className="dashboard-welcome">
          Welcome, <strong>{user.email}</strong>
        </p>
        <span className="user-role-badge">{user.role}</span>
      </div>

      {/* Verification Warning */}
      {verificationWarning && (
        <div className="verification-warning">
          <div className="verification-warning-icon">⚠️</div>
          <div>
            <strong>Verification Status Changed</strong>
            <p>{verificationWarning}</p>
          </div>
        </div>
      )}

      {/* Profile Section */}
      {isEditing ? (
        <ProfileForm
          user={user}
          profile={profile}
          setProfile={(newProfile) => {
            setProfile(newProfile);
            if (newProfile?.verificationWarning) {
              setVerificationWarning(newProfile.message);
            }
          }}
          setIsEditing={setIsEditing}
        />
      ) : (
        <div className="profile-section">
          <h3>
            <span className="section-icon">👤</span>
            Profile Information
          </h3>

          {profile ? (
            <>
              <div className="profile-info">
                  {user.role === 'patient' && (
                  <>
                    <div className="profile-field">
                      <strong>Username</strong>
                      <p className="username-display">@{user.username}</p>
                    </div>
                    <div className="profile-field">
                      <strong>Date of Birth</strong>
                      <p>{profile.dob || <em>Not set</em>}</p>
                    </div>
                    <div className="profile-field">
                      <strong>Blood Group</strong>
                      <p>{profile.bloodGroup || <em>Not set</em>}</p>
                    </div>
                    <div className="profile-field">
                      <strong>Allergies</strong>
                      <p>{profile.allergies || <em>None listed</em>}</p>
                    </div>
                    <div className="profile-field">
                      <strong>Emergency Contact</strong>
                      <p>{profile.emergencyContactName || <em>Not set</em>}</p>
                    </div>
                    {profile.emergencyContactNumber && (
                      <div className="profile-field">
                        <strong>Emergency Number</strong>
                        <p>{profile.emergencyContactNumber}</p>
                      </div>
                    )}
                  </>
                )}

                {user.role === 'doctor' && (
                  <>
                    <div className="profile-field">
                      <strong>Username</strong>
                      <p className="username-display">@{user.username}</p>
                    </div>
                    <div className="profile-field">
                      <strong>Name</strong>
                      <p>{profile.name || <em>Not set</em>}</p>
                    </div>
                    <div className="profile-field">
                      <strong>Specialty</strong>
                      <p>{profile.specialty || <em>Not set</em>}</p>
                    </div>
                    <div className="profile-field">
                      <strong>License Number</strong>
                      <p>{profile.licenseNumber || <em>Not set</em>}</p>
                    </div>
                    <div className="profile-field">
                      <strong>Hospital</strong>
                      <p>{profile.hospitalAffiliation || <em>Not set</em>}</p>
                    </div>
                    <div className="profile-field">
                      <strong>Verification Status</strong>
                      <p>
                        {profile.isVerified ? (
                          <span className="badge badge-success">✅ Verified</span>
                        ) : (
                          <span className="badge badge-warning">⏳ Pending Verification</span>
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {user.role === 'doctor' && !profile.isVerified && (
                <div className="doctor-note">
                  <small>
                    💡 <strong>Note:</strong> You must be verified by an admin before you can create medical records.
                  </small>
                </div>
              )}

              <div className="action-buttons">
                <button
                  onClick={() => setIsEditing(true)}
                  className="action-button action-button-primary"
                >
                   📝 Update Profile
                </button>

                <button
                  onClick={() => navigate('/2fa-settings')}
                  className="action-button action-button-secondary"
                >
                  🔐 2FA Settings
                </button>
              </div>
            </>
          ) : (
            <div className="alert alert-warning">
                <p>⚠️ No profile data available. Please create your profile to access full features.</p>
    <button
      onClick={() => setIsEditing(true)}
      className="action-button action-button-primary"
      style={{ marginTop: 'var(--spacing-md)' }}
    >
      ✨ Create Profile Now
    </button>
            </div>
          )}
        </div>
      )}

      {/* Patient-specific sections */}
       {user.role === 'patient' && (
        <>
          <hr className="dashboard-divider" />
          <EmergencyQR />
      
          <hr className="dashboard-divider" />
          <PatientAccessRequests />
        </>
      )}
    </div>
  );
}

export default Dashboard;