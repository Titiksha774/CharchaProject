import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseJson } from '../lib/api';
import PostCard from '../components/PostCard';
import './Profile.css';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, api, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api(`/users/${username}`).then((r) => (r.ok ? parseJson(r) : null)),
      api(`/users/${username}/posts`).then((r) =>
        r.ok ? parseJson(r) : { posts: [] }
      ),
    ])
      .then(([prof, data]) => {
        if (!prof) {
          setError('User not found');
          return;
        }
        setProfile(prof);
        setPosts(data.posts || []);
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [username, api]);

  const updateRelationship = (relationship) => {
    setProfile((prev) => (prev ? { ...prev, relationship } : prev));
  };

  const sendFriendRequest = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setBusy(true);
    try {
      const res = await api(`/friends/${profile.username}/request`, { method: 'POST' });
      const data = await parseJson(res);
      if (res.ok || res.status === 409) {
        updateRelationship(data.relationship || 'outgoing_request');
      }
    } finally {
      setBusy(false);
    }
  };

  const removeFriend = async () => {
    setBusy(true);
    try {
      const res = await api(`/friends/${profile.username}`, { method: 'DELETE' });
      if (res.ok) updateRelationship('none');
    } finally {
      setBusy(false);
    }
  };

  const handleLike = async (postId) => {
    if (!currentUser) return;
    const res = await api(`/posts/${postId}/like`, { method: 'POST' });
    const data = await parseJson(res);
    if (!res.ok) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByMe: data.liked,
              likeCount: (p.likeCount || 0) + (data.liked ? 1 : -1),
            }
          : p
      )
    );
  };

  const handleDelete = async (postId) => {
    const res = await api(`/posts/${postId}`, { method: 'DELETE' });
    if (!res.ok) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error)
    return (
      <div className="profile-error">
        {error} <Link to="/">Back to feed</Link>
      </div>
    );
  if (!profile) return null;

  const isOwnProfile = currentUser && currentUser.username === profile.username;
  const profileWebsite =
    profile.website && /^https?:\/\//i.test(profile.website)
      ? profile.website
      : profile.website
        ? `https://${profile.website}`
        : '';

  const renderProfileAction = () => {
    if (isOwnProfile) {
      return (
        <button className="profile-logout-btn" onClick={handleLogout}>
          Log out
        </button>
      );
    }

    if (!currentUser) {
      return (
        <button className="profile-primary-btn" onClick={() => navigate('/login')}>
          Log in to connect
        </button>
      );
    }

    if (profile.relationship === 'friends') {
      return (
        <>
          <button className="profile-primary-btn" onClick={() => navigate(`/messages/${profile.username}`)}>
            Message
          </button>
          <button className="profile-secondary-btn" onClick={removeFriend} disabled={busy}>
            Remove friend
          </button>
        </>
      );
    }

    if (profile.relationship === 'outgoing_request') {
      return <span className="profile-status">Friend request sent</span>;
    }

    if (profile.relationship === 'incoming_request') {
      return (
        <button className="profile-primary-btn" onClick={sendFriendRequest} disabled={busy}>
          Accept request
        </button>
      );
    }

    return (
      <button className="profile-primary-btn" onClick={sendFriendRequest} disabled={busy}>
        Add friend
      </button>
    );
  };

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="profile-cover" />
        <div className="profile-avatar">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" />
          ) : (
            <span className="avatar-placeholder avatar-large">
              {(profile.displayName || profile.username)[0].toUpperCase()}
            </span>
          )}
        </div>

        <h1 className="profile-name">
          {profile.displayName || profile.username}
        </h1>
        <p className="profile-username">@{profile.username}</p>

        {profile.bio && <p className="profile-bio">{profile.bio}</p>}

        {(profile.location || profile.website) && (
          <div className="profile-details">
            {profile.location && <span>{profile.location}</span>}
            {profileWebsite && (
              <a href={profileWebsite} target="_blank" rel="noreferrer">
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        )}

        <div className="profile-stats">
          <span><strong>{profile.postCount ?? 0}</strong> posts</span>
          <span><strong>{profile.friendCount ?? 0}</strong> friends</span>
        </div>

        <div className="profile-actions">
          {renderProfileAction()}
        </div>
      </div>

      <div className="profile-posts">
        <h2 className="profile-posts-title">Posts</h2>

        {posts.length === 0 ? (
          <p className="profile-empty script-ne">
            अहिले कुनै पोस्ट छैन।
          </p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
