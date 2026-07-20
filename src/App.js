// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './components/AdminDashboard';
import MedicalRecordsPage from './components/MedicalRecordsPage';
import Header from './components/Header';
import EmergencyViewer from './components/EmergencyViewer';
import EmailVerification from './components/auth/EmailVerification';
import TwoFactorLogin from './components/TwoFactorLogin';
import TwoFactorSettings from './components/TwoFactorSettings';
import './App.css';
import './styles/theme.css';
import './styles/backgrounds.css';

function App() {
  const [token, setToken] = useState(sessionStorage.getItem('accessToken'));
  const [userEmail, setUserEmail] = useState(null);

  const isLogged = !!token;

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
  const role = userPayload ? userPayload.role : null;

  useEffect(() => {
    const handler = () => {
      setToken(sessionStorage.getItem('accessToken'));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    if (isLogged) {
      const storedEmail = sessionStorage.getItem('userEmail');
      setUserEmail(storedEmail || userPayload?.email || 'User');
    } else {
      setUserEmail(null);
    }
  }, [isLogged, token]);

  return (
    <Router>
      <Header userEmail={userEmail} />
      <Routes>
        <Route path="/emergency/:token" element={<EmergencyViewer />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/2fa-login" element={<TwoFactorLogin />} />
        <Route
          path="/2fa-settings"
          element={
            isLogged && role !== 'admin'
              ? <TwoFactorSettings />
              : <Navigate to={role === 'admin' ? '/admin' : '/'} replace />
          }
        />
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
        <Route
          path="/dashboard"
          element={
            isLogged
              ? (role === 'admin' ? <Navigate to="/admin" replace /> : <Dashboard />)
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/admin"
          element={
            isLogged && role === 'admin'
              ? <AdminDashboard />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/records"
          element={
            isLogged && role !== 'admin'
              ? <MedicalRecordsPage />
              : <Navigate to={role === 'admin' ? '/admin' : '/'} replace />
          }
        />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
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