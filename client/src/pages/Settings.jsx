import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseJson } from '../lib/api';
import './Settings.css';

export default function Settings() {
  const { user, api, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [form, setForm] = useState({
    displayName: '',
    username: '',
    email: '',
    avatarUrl: '',
    bio: '',
    location: '',
    website: '',
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      displayName: user.displayName || '',
      username: user.username || '',
      email: user.email || '',
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || '',
      location: user.location || '',
      website: user.website || '',
    });
  }, [user]);

  const initials = useMemo(
    () => (form.displayName || form.username || 'C')[0].toUpperCase(),
    [form.displayName, form.username]
  );

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setNotice('');
    setError('');
  };

  const applyTheme = (value) => {
    setTheme(value);
    localStorage.setItem('theme', value);
    document.documentElement.setAttribute('data-theme', value);
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');

    try {
      const res = await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: form.displayName.trim(),
          username: form.username.trim().toLowerCase(),
          email: form.email.trim().toLowerCase(),
          avatarUrl: form.avatarUrl.trim(),
          bio: form.bio.trim(),
          location: form.location.trim(),
          website: form.website.trim(),
        }),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.error || 'Could not save settings');
      updateUser(data.user);
      setNotice('Settings saved. Your profile is up to date.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="settings-page">
      <section className="settings-hero">
        <div>
          <p className="settings-kicker script-ne">सेटिङहरू</p>
          <h1>Make Charcha feel like yours.</h1>
          <p>Personalize your identity, profile preview, and reading comfort from one place.</p>
        </div>
      </section>

      <div className="settings-grid">
        <section className="settings-panel profile-preview-panel">
          <div className="preview-cover" />
          <div className="preview-avatar">
            {form.avatarUrl ? <img src={form.avatarUrl} alt="" /> : <span>{initials}</span>}
          </div>
          <h2>{form.displayName || 'Your name'}</h2>
          <p className="preview-username">@{form.username || 'username'}</p>
          {form.bio && <p className="preview-bio">{form.bio}</p>}
          <div className="preview-meta">
            {form.location && <span>{form.location}</span>}
            {form.website && <span>{form.website}</span>}
          </div>
        </section>

        <form className="settings-panel settings-form" onSubmit={saveSettings}>
          <div className="settings-section-heading">
            <h2>Account</h2>
            <p>Keep your public identity clear and easy to recognize.</p>
          </div>

          {notice && <div className="settings-success">{notice}</div>}
          {error && <div className="settings-error">{error}</div>}

          <div className="form-grid two">
            <label>
              Display name
              <input
                value={form.displayName}
                onChange={(e) => updateField('displayName', e.target.value)}
                maxLength={60}
                required
              />
            </label>
            <label>
              Username
              <input
                value={form.username}
                onChange={(e) => updateField('username', e.target.value)}
                pattern="[a-zA-Z0-9_]+"
                maxLength={24}
                required
              />
            </label>
          </div>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
            />
          </label>

          <label>
            Avatar image URL
            <input
              value={form.avatarUrl}
              onChange={(e) => updateField('avatarUrl', e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
          </label>

          <label>
            Bio
            <textarea
              value={form.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              maxLength={180}
              rows={4}
              placeholder="A short intro for your profile"
            />
            <span className="field-hint">{form.bio.length}/180</span>
          </label>

          <div className="form-grid two">
            <label>
              Location
              <input
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                maxLength={80}
                placeholder="Kathmandu"
              />
            </label>
            <label>
              Website
              <input
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
                maxLength={160}
                placeholder="https://your-site.com"
              />
            </label>
          </div>

          <div className="settings-section-heading compact">
            <h2>Appearance</h2>
            <p>Choose a comfortable theme for reading and writing.</p>
          </div>

          <div className="theme-segment" role="group" aria-label="Theme">
            <button
              type="button"
              className={theme === 'light' ? 'active' : ''}
              onClick={() => applyTheme('light')}
            >
              Light
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'active' : ''}
              onClick={() => applyTheme('dark')}
            >
              Dark
            </button>
          </div>

          <div className="settings-actions">
            <button className="settings-save" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button className="settings-logout" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
