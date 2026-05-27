import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Feed from './pages/Feed';
import Login from './pages/Login';
import Register from './pages/Register';
import PostPage from './pages/PostPage';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Messages from './pages/Messages';
import Settings from './pages/Settings';

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Feed />} />
        <Route path="post/:id" element={<PostPage />} />
        <Route path="u/:username" element={<Profile />} />
        <Route path="friends" element={<Protected><Friends /></Protected>} />
        <Route path="messages" element={<Protected><Messages /></Protected>} />
        <Route path="messages/:username" element={<Protected><Messages /></Protected>} />
        <Route path="settings" element={<Protected><Settings /></Protected>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
