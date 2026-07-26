// frontend/src/components/Header.js

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Heart,
  Menu,
  X,
  LogOut,
  User,
  FileText,
  LayoutDashboard,
  Shield,
  Sun,
  Moon,
  Palette,
  ChevronDown
} from 'lucide-react';
import umhwApi from '../api/umhwApi';
import './Header.css';

const THEMES = [
  { id: 'clinical-blue',  label: 'Clinical Blue',  color: '#1A6DB5' },
  { id: 'forest-green',   label: 'Forest Green',   color: '#16803C' },
  { id: 'deep-navy',      label: 'Deep Navy',      color: '#0F3460' },
  { id: 'warm-coral',     label: 'Warm Coral',     color: '#E05C3A' },
  { id: 'slate-purple',   label: 'Slate Purple',   color: '#6D28D9' },
];

const getRole = () => {
  const token = sessionStorage.getItem('accessToken');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).role;
  } catch {
    return null;
  }
};

const Header = ({ userEmail }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getRole();
  const isLogged = !!role;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(
    () => localStorage.getItem('umhw-theme') || 'clinical-blue'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('umhw-theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    setMobileOpen(false);
    setThemeOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await umhwApi.post('/auth/logout');
    } catch {
      // continue with logout even if request fails
    } finally {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('userEmail');
      window.dispatchEvent(new Event('storage'));
      navigate('/');
    }
  };

  const navLinks = role === 'admin'
    ? [{ to: '/admin', label: 'Admin Panel', icon: Shield }]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/records',   label: 'Records',   icon: FileText },
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-inner container">

        {/* Brand */}
        <Link
          to={isLogged ? (role === 'admin' ? '/admin' : '/dashboard') : '/'}
          className="header-brand"
        >
          <div className="header-logo">
            <Heart size={20} strokeWidth={2.5} />
          </div>
          <div className="header-brand-text">
            <span className="header-brand-name">MediWallet</span>
            <span className="header-brand-sub">Universal Medical Wallet</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        {isLogged && (
          <nav className="header-nav">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`nav-link ${isActive(to) ? 'nav-link-active' : ''}`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="header-right">

          {/* Theme switcher */}
          <div className="theme-switcher">
            <button
              className="theme-btn"
              onClick={() => setThemeOpen(!themeOpen)}
              aria-label="Switch theme"
            >
              <Palette size={16} />
            </button>
            {themeOpen && (
              <div className="theme-dropdown">
                <p className="theme-dropdown-label">Color Theme</p>
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    className={`theme-option ${currentTheme === theme.id ? 'theme-option-active' : ''}`}
                    onClick={() => { setCurrentTheme(theme.id); setThemeOpen(false); }}
                  >
                    <span
                      className="theme-dot"
                      style={{ background: theme.color }}
                    />
                    {theme.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User info + logout */}
          {isLogged && (
            <>
              <div className="header-user">
                <div className="header-avatar">
                  <User size={14} />
                </div>
                <div className="header-user-info">
                  <span className="header-user-email">{userEmail || 'User'}</span>
                  <span className="header-user-role">{role}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm logout-btn"
                title="Logout"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </>
          )}

          {/* Mobile menu toggle */}
          {isLogged && (
            <button
              className="mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isLogged && mobileOpen && (
        <div className="mobile-menu">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`mobile-nav-link ${isActive(to) ? 'mobile-nav-link-active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <div className="mobile-divider" />
          <button onClick={handleLogout} className="mobile-nav-link mobile-logout">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;