// \frontend\src\App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './components/AdminDashboard';
import MedicalRecordsPage from './components/MedicalRecordsPage';
import EmailVerification from './components/auth/EmailVerification';
import SharedRecordsViewer from './components/SharedRecordsViewer';
import Header from './components/Header';
import umhwApi from './api/umhwApi'; 
import EmergencyViewer from './components/EmergencyViewer';
import './App.css';
import './styles/theme.css';
import './styles/backgrounds.css'; 
import TwoFactorLogin from './components/TwoFactorLogin';
import TwoFactorSettings from './components/TwoFactorSettings';

function App() {
  const [token, setToken] = useState(sessionStorage.getItem('accessToken'));
  const [userEmail, setUserEmail] = useState(null);

  const isLogged = !!token;

  // Function to decode token payload
  const decodeToken = (t) => {
    if (!t) return null;
    try {
      return JSON.parse(atob(t.split('.')[1]));
    } catch (err) {
      console.error("Invalid JWT", err);
      return null;
    }
  };

  const userPayload = decodeToken(token);
  let role = userPayload ? userPayload.role : null;

  // Effect to check storage changes (login/logout)
  useEffect(() => {
    const handler = () => {
      setToken(sessionStorage.getItem('accessToken'));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Effect to fetch user email when token/login status changes
  useEffect(() => {
    if (isLogged) {
      umhwApi.get('/profile/profile')
        .then(res => setUserEmail(res.data.user.email))
        .catch(() => setUserEmail(userPayload?.email || 'User'));
    } else {
      setUserEmail(null);
    }
  }, [isLogged, token]);

  return (
    <Router>
      <Header userEmail={userEmail} />
      <Routes>
         {/* Public emergency access - NO AUTH REQUIRED */}
  <Route path="/emergency/:token" element={<EmergencyViewer />} />

          {/* Email Verification - Public route */}
  <Route path="/verify-email" element={<EmailVerification />} />

  {/* 2FA Login - Public route */}
<Route path="/2fa-login" element={<TwoFactorLogin />} />

{/* 2FA Settings - Protected route */}
<Route
  path="/2fa-settings"
  element={
    isLogged && role !== 'admin'
      ? <TwoFactorSettings />
      : <Navigate to={role === 'admin' ? '/admin' : '/'} replace />
  }
/>

        {/* Root route */}
        <Route
          path="/"
          element={
            isLogged
              ? role === 'admin'
                ? <Navigate to="/admin" replace />
                : <Navigate to="/dashboard" replace />
              : <AuthForm />
          }
        />

        {/* Dashboard - Only for patients and doctors */}
        <Route 
          path="/dashboard" 
          element={
            isLogged 
              ? (role === 'admin' ? <Navigate to="/admin" replace /> : <Dashboard />)
              : <Navigate to="/" replace />
          } 
        />

        {/* Admin Panel - Only for admins */}
        <Route 
          path="/admin" 
          element={
            isLogged && role === 'admin' 
              ? <AdminDashboard /> 
              : <Navigate to="/" replace />
          } 
        />

        {/* Medical Records - Only for patients and doctors (NOT admin) */}
        <Route 
          path="/records" 
          element={
            isLogged && role !== 'admin'
              ? <MedicalRecordsPage /> 
              : <Navigate to={role === 'admin' ? '/admin' : '/'} replace />
          } 
        />

        {/* Public Routes */}
         <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/share/view" element={<SharedRecordsViewer />} />

        {/* Fallback - redirect based on role */}
        <Route 
          path="*" 
          element={
            <Navigate 
              to={isLogged ? (role === 'admin' ? "/admin" : "/dashboard") : "/"} 
              replace 
            />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;