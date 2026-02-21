import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 🌗 Theme State
  const [theme, setTheme] = useState('light');

  // Load saved theme on first render
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Toggle Theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">
          <span className="logo-icon">चर्चा</span>
          <span className="logo-text">Charcha</span>
        </Link>

        <nav className="nav">
          {/* 🌙 Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle"
          >
            {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
          </button>

          {user ? (
            <>
              <Link to="/">Feed</Link>
              <Link to={`/u/${user.username}`}>Profile</Link>
              <button type="button" className="btn-logout" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn-register">Sign up</Link>
            </>
          )}
        </nav>
      </header>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}