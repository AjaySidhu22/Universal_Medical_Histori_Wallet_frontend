// frontend/src/components/AdminDashboard.js

import React, { useEffect, useState } from 'react';
import umhwApi from '../api/umhwApi';
import './AdminDashboard.css';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctorError, setDoctorError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loggedInUserEmail, setLoggedInUserEmail] = useState(''); // NEW LINE

   // Fetch all users
const fetchUsers = async () => {
  try {
    setLoading(true);
    
    // Get current user's email
    const profileRes = await umhwApi.get('/profile/profile');
    setLoggedInUserEmail(profileRes.data.user.email);
    
    const res = await umhwApi.get('/admin/users');
    setUsers(res.data);
    setError('');
  } catch (err) {
    setError('Failed to fetch users');
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  // Fetch unverified doctors
  const fetchUnverifiedDoctors = async () => {
    try {
      setDoctorsLoading(true);
      setDoctorError('');
      const res = await umhwApi.get('/admin/doctors/unverified');
      setDoctors(res.data);
    } catch (err) {
      setDoctorError('Failed to fetch doctors');
      console.error(err);
    } finally {
      setDoctorsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUnverifiedDoctors();
  }, []);

  // Delete user
  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await umhwApi.delete(`/admin/users/${id}`);
      setUsers(users.filter((u) => u.id !== id));
      setSuccessMessage('✅ User deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  // Update role
  const updateRole = async (id, role) => {
    try {
      setUsers(prev =>
        prev.map(u => (u.id === id ? { ...u, updating: true } : u))
      );

      await umhwApi.put(`/admin/users/${id}/role`, { role });

      setUsers(prev =>
        prev.map(u => (u.id === id ? { ...u, role, updating: false } : u))
      );

      setSuccessMessage('✅ Role updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);

      const current = await umhwApi.get('/profile/profile');
      if (current.data.user.id === id && role !== 'admin') {
        alert('You changed your own role – you will be logged out.');
        await umhwApi.post('/auth/logout');
        sessionStorage.removeItem('accessToken');
        window.location.href = '/';
      }
    } catch (err) {
      setError('Failed to update role');
      console.error(err);
      setUsers(prev =>
        prev.map(u => (u.id === id ? { ...u, updating: false } : u))
      );
    }
  };

  // Verify doctor
  const verifyDoctor = async (doctorId) => {
    if (!window.confirm('Verify this doctor? They will be able to create medical records.')) return;

    try {
      setDoctors(prev =>
        prev.map(d => (d.id === doctorId ? { ...d, updating: true } : d))
      );

      await umhwApi.put(`/admin/doctors/${doctorId}/verify`, { isVerified: true });

      setDoctors(prev => prev.filter(d => d.id !== doctorId));

      setSuccessMessage('✅ Doctor verified successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to verify doctor: ' + (err.response?.data?.message || err.message));
      setDoctors(prev =>
        prev.map(d => (d.id === doctorId ? { ...d, updating: false } : d))
      );
    }
  };

  if (loading && doctorsLoading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <h2>
          <span>👑</span>
          Admin Dashboard
        </h2>
        <p className="admin-subtitle">Manage users and verify doctors</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{users.length}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👨‍⚕️</div>
          <div className="stat-content">
            <h3>{users.filter(u => u.role === 'doctor').length}</h3>
            <p>Doctors</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏥</div>
          <div className="stat-content">
            <h3>{users.filter(u => u.role === 'patient').length}</h3>
            <p>Patients</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{doctors.length}</h3>
            <p>Pending Verifications</p>
          </div>
        </div>
      </div>

      {/* Pending Doctor Verifications */}
      <div className="admin-section">
        <div className="section-header">
          <h3>
            <span className="section-icon">🔔</span>
            Pending Doctor Verifications
          </h3>
          <button className="refresh-button" onClick={fetchUnverifiedDoctors}>
            <span>🔄</span>
          </button>
        </div>

        {doctorError && (
          <div className="alert alert-danger">
            {doctorError}
          </div>
        )}

        {doctorsLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <p>No pending verifications - all doctors are verified!</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Doctor Information</th>
                <th>Specialty</th>
                <th>License Number</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc.id}>
                  <td data-label="Doctor Information">
                    <div className="doctor-info">
                      <span className="doctor-name">
                        👨‍⚕️ {doc.name || doc.User?.email || 'N/A'}
                      </span>
                      <span className="user-email">{doc.User?.email}</span>
                    </div>
                  </td>
                  <td data-label="Specialty">
                    <span className="doctor-specialty">
                      {doc.specialty || 'Not specified'}
                    </span>
                  </td>
                  <td data-label="License Number">
                    <span className="doctor-license">
                      {doc.licenseNumber || 'Not specified'}
                    </span>
                  </td>
                  <td data-label="Registered">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td data-label="Actions">
                    <button
                      onClick={() => verifyDoctor(doc.id)}
                      disabled={doc.updating}
                      className="btn-verify"
                    >
                      {doc.updating ? (
                        <>
                          <span className="spinner spinner-sm"></span>
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>✓</span>
                          <span>Verify</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* User Management */}
      <div className="admin-section">
        <div className="section-header">
          <h3>
            <span className="section-icon">👥</span>
            All Users Management
          </h3>
          <button className="refresh-button" onClick={fetchUsers}>
            <span>🔄</span>
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Information</th>
                <th>Role</th>
                <th>Email Verified</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label="User Information">
                    <div className="user-info">
                      <span className="user-email">{u.email}</span>
                      <span className="user-id">ID: {u.id.substring(0, 8)}...</span>
                    </div>
                  </td>
                  <td data-label="Role">
                    <select
                      value={u.role}
                      disabled={u.updating}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="role-select"
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td data-label="Email Verified">
                    {u.isEmailVerified ? (
                      <span className="status-badge status-verified">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="status-badge status-pending">
                        ⏳ Pending
                      </span>
                    )}
                  </td>
                  <td data-label="Created">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td data-label="Actions">
                     <button
  onClick={() => deleteUser(u.id)}
  className="btn-delete"
  disabled={u.role === 'admin' && u.email === loggedInUserEmail}
  title={u.role === 'admin' && u.email === loggedInUserEmail ? "Cannot delete your own admin account" : "Delete user"}
  style={{
    opacity: u.role === 'admin' && u.email === loggedInUserEmail ? 0.5 : 1,
    cursor: u.role === 'admin' && u.email === loggedInUserEmail ? 'not-allowed' : 'pointer'
  }}
>
  <span>🗑️</span>
  <span>Delete</span>
</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;