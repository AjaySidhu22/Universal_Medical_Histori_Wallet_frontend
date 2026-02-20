// frontend/src/components/Header.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import umhwApi from '../api/umhwApi';
import './Header.css';

const getRole = () => {
  const token = sessionStorage.getItem('accessToken');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch (err) {
    return null;
  }
};

const Header = ({ userEmail }) => {
  const navigate = useNavigate();
  const role = getRole();
  const isLogged = !!role;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await umhwApi.post('/auth/logout');
    } catch (err) {
      console.error("Logout attempt failed but clearing local data anyway.", err);
    } finally {
      sessionStorage.removeItem('accessToken');
      window.dispatchEvent(new Event("storage"));
      navigate('/');
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Brand/Logo */}
        <Link
          to={isLogged ? (role === 'admin' ? '/admin' : '/dashboard') : '/'}
          className="header-brand"
        >
          <span className="header-logo">🏥</span>
          <div className="header-title">
            <span className="header-title-main">Universal Medical Wallet</span>
            <span className="header-title-sub">Secure Health Records</span>
          </div>
        </Link>

        {/* Mobile Menu Toggle */}
        {isLogged && (
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        )}

        {/* Navigation */}
        {isLogged && (
          <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {/* Nav Links */}
            <div className="nav-links">
              {role !== 'admin' && (
                <>
                  <Link 
                    to="/dashboard" 
                    className="nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/records" 
                    className="nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Records
                  </Link>
                </>
              )}

              {role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
            </div>

            {/* User Info */}
            <div className="user-info">
              <span className="user-email">{userEmail || 'User'}</span>
              <span className="user-role">{role}</span>
            </div>

            {/* Logout Button */}
            <button 
              onClick={handleLogout} 
              className="logout-button"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;