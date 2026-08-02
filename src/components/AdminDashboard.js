// frontend/src/components/AdminDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Stethoscope, UserCheck, Clock, Shield,
  Trash2, CheckCircle, XCircle, AlertCircle,
  RefreshCw, ChevronDown, Building, BadgeCheck,
  Calendar, Search, X
} from 'lucide-react';
import umhwApi from '../api/umhwApi';
import './AdminDashboard.css';

const ROLES = ['patient', 'doctor', 'admin'];

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const loggedInUserEmail = sessionStorage.getItem('userEmail');

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await umhwApi.get('/admin/users');
      setUsers(res.data.users || res.data || []);
    } catch {
      setError('Failed to load users.');
    }
  }, []);

  const fetchUnverifiedDoctors = useCallback(async () => {
    try {
      const res = await umhwApi.get('/admin/doctors/unverified');
      setDoctors(res.data.doctors || res.data || []);
    } catch {
      setError('Failed to load unverified doctors.');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchUsers(), fetchUnverifiedDoctors()]);
      setLoading(false);
    };
    init();
  }, [fetchUsers, fetchUnverifiedDoctors]);

  const verifyDoctor = async (doctorId) => {
    try {
      await umhwApi.put(`/admin/doctors/${doctorId}/verify`, { isVerified: true });
      setDoctors(prev => prev.filter(d => d.id !== doctorId));
      showSuccess('Doctor verified successfully.');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify doctor.');
    }
  };

  const unverifyDoctor = async (userId, doctorProfileId) => {
    if (!window.confirm('Revoke this doctor\'s verification? They will lose access to create medical records.')) return;
    try {
      await umhwApi.put(`/admin/doctors/${doctorProfileId}/verify`, { isVerified: false });
      showSuccess('Doctor verification revoked.');
      fetchUsers();
      fetchUnverifiedDoctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke verification.');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently? All their data will be removed.')) return;
    try {
      await umhwApi.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      showSuccess('User deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const updateRole = async (id, newRole) => {
    try {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, updating: true } : u));
      await umhwApi.put(`/admin/users/${id}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole, updating: false } : u));
      showSuccess(`Role updated to ${newRole}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role.');
      setUsers(prev => prev.map(u => u.id === id ? { ...u, updating: false } : u));
    }
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    doctors: users.filter(u => u.role === 'doctor').length,
    patients: users.filter(u => u.role === 'patient').length,
    pending: doctors.length,
  };

  if (loading) {
    return (
      <div className="page-content page-loading">
        <div className="spinner spinner-lg" />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">

        {/* Page header */}
        <div className="admin-header">
          <div>
            <h1 className="dash-title">Admin Dashboard</h1>
            <p className="dash-subtitle">Manage users and verify doctors.</p>
          </div>
          <span className="badge badge-primary">
            <Shield size={11} /> Admin
          </span>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 'var(--space-5)' }}>
            <AlertCircle size={15} /> {error}
            <button className="btn btn-ghost btn-sm" onClick={() => setError('')} style={{ marginLeft: 'auto' }}>
              <X size={14} />
            </button>
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success" style={{ marginBottom: 'var(--space-5)' }}>
            <CheckCircle size={15} /> {successMessage}
          </div>
        )}

        {/* Stats */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon"><Users size={20} /></div>
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
              <Stethoscope size={20} />
            </div>
            <div>
              <div className="stat-value">{stats.doctors}</div>
              <div className="stat-label">Doctors</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Users size={20} />
            </div>
            <div>
              <div className="stat-value">{stats.patients}</div>
              <div className="stat-label">Patients</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
              <Clock size={20} />
            </div>
            <div>
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending Verifications</div>
            </div>
          </div>
        </div>

        {/* Pending Doctor Verifications */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <Clock size={18} />
              Pending Doctor Verifications
              {doctors.length > 0 && (
                <span className="badge badge-warning" style={{ marginLeft: 'var(--space-2)' }}>
                  {doctors.length}
                </span>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchUnverifiedDoctors}>
              <RefreshCw size={14} />
            </button>
          </div>

          {doctors.length === 0 ? (
            <div className="admin-empty">
              <CheckCircle size={32} style={{ color: 'var(--color-success)' }} />
              <p>All doctors are verified.</p>
            </div>
          ) : (
            <div className="admin-doctors-list">
              {doctors.map(doctor => (
                <div key={doctor.id} className="admin-doctor-card">
                  <div className="admin-doctor-info">
                    <div className="admin-doctor-avatar">
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <div className="admin-doctor-name">
                        {doctor.name?.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
                      </div>
                      <div className="admin-doctor-email">{doctor.User?.email}</div>
                      <div className="admin-doctor-meta">
                        <span><BadgeCheck size={12} /> {doctor.specialty}</span>
                        <span><Building size={12} /> {doctor.hospitalAffiliation}</span>
                        <span><Calendar size={12} /> {new Date(doctor.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => verifyDoctor(doctor.id)}
                  >
                    <CheckCircle size={13} /> Verify
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Users */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <Users size={18} />
              All Users
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <div className="admin-search">
                <Search size={14} className="admin-search-icon" />
                <input
                  className="admin-search-input"
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn btn-ghost btn-sm" onClick={fetchUsers}>
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="admin-users-list">
            {filteredUsers.length === 0 ? (
              <div className="admin-empty">
                <Users size={32} style={{ color: 'var(--color-border)' }} />
                <p>No users found.</p>
              </div>
            ) : (
              filteredUsers.map(user => (
                <div key={user.id} className="admin-user-row">
                  <div className="admin-user-info">
                    <div className="admin-user-avatar">
                      {user.role === 'admin' ? <Shield size={14} />
                        : user.role === 'doctor' ? <Stethoscope size={14} />
                        : <Users size={14} />}
                    </div>
                    <div>
                      <div className="admin-user-email">{user.email}</div>
                      <div className="admin-user-id">
                        ID: {user.id?.substring(0, 8)}...
                      </div>
                    </div>
                  </div>

                  <div className="admin-user-controls">
                    {/* Role selector */}
                    <div className="admin-role-select-wrapper">
                      <select
                        className="admin-role-select"
                        value={user.role}
                        onChange={e => updateRole(user.id, e.target.value)}
                        disabled={user.updating || user.email === loggedInUserEmail}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="admin-role-chevron" />
                    </div>

                    {/* Verified badge */}
                    {user.isEmailVerified && (
                      <span className="badge badge-success">
                        <CheckCircle size={10} /> Verified
                      </span>
                    )}

                    {/* Join date */}
                    <span className="admin-user-date">
                      {new Date(user.createdAt).toLocaleDateString('en-IN')}
                    </span>

                    {/* Unverify doctor button */}
                    {user.role === 'doctor' && user.DoctorProfile?.isVerified && (
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', border: '1px solid var(--color-warning)' }}
                        onClick={() => unverifyDoctor(user.id, user.DoctorProfile.id)}
                      >
                        <XCircle size={13} /> Revoke
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteUser(user.id)}
                      disabled={user.email === loggedInUserEmail}
                      title={user.email === loggedInUserEmail ? 'Cannot delete your own account' : 'Delete user'}
                      style={{
                        opacity: user.email === loggedInUserEmail ? 0.4 : 1,
                        cursor: user.email === loggedInUserEmail ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;