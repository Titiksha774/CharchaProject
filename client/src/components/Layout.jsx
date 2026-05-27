import React, { useEffect, useState } from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const navItems = [
  { to: '/', label: 'Feed', end: true },
  { to: '/friends', label: 'Friends', protected: true },
  { to: '/messages', label: 'Messages', protected: true },
  { to: '/settings', label: 'Settings', protected: true },
];

function Avatar({ user }) {
  return (
    <div className="shell-avatar">
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt="" />
      ) : (
        <span>{(user?.displayName || user?.username || 'C')[0].toUpperCase()}</span>
      )}
    </div>
  );
}

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
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

  const pageName =
    navItems.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
    )?.label || 'Charcha';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="logo" aria-label="Charcha home">
          <span className="logo-mark">च</span>
          <span>
            <span className="logo-text">Charcha</span>
            <small>नेपाली सामाजिक मंच</small>
          </span>
        </Link>

        <nav className="side-nav" aria-label="Main navigation">
          {navItems
            .filter((item) => !item.protected || user)
            .map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="sidebar-panel">
          {user ? (
            <>
              <Avatar user={user} />
              <div className="sidebar-user-copy">
                <strong>{user.displayName || user.username}</strong>
                <span>@{user.username}</span>
              </div>
              <Link className="sidebar-action" to={`/u/${user.username}`}>
                View profile
              </Link>
            </>
          ) : (
            <>
              <p>Join Charcha to post, add friends, and send private messages.</p>
              <Link className="sidebar-action" to="/register">Create account</Link>
            </>
          )}
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <p className="topbar-kicker script-ne">चर्चा</p>
            <h1>{pageName}</h1>
          </div>

          <div className="topbar-actions">
            <button type="button" onClick={toggleTheme} className="theme-toggle">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            {user ? (
              <Link className="topbar-profile" to={`/u/${user.username}`}>
                <Avatar user={user} />
              </Link>
            ) : (
              <Link className="topbar-join" to="/login">Log in</Link>
            )}
          </div>
        </header>

        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
