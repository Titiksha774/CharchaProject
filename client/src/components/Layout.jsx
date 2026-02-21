import React, { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user } = useAuth();

  // 🌗 Theme State
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">
          <span className="logo-icon">चर्चा</span>
          <span className="logo-text">Charcha</span>
        </Link>

        <nav className="nav">
          <Link to="/">Feed</Link>

          {user && (
            <Link to={`/u/${user.username}`}>Profile</Link>
          )}

          {/* 🌙 Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle"
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
        </nav>
      </header>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}