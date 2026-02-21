import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseJson } from '../lib/api';
import PostCard from '../components/PostCard';
import './Profile.css';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, api } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api(`/users/${username}`).then((r) => (r.ok ? parseJson(r) : null)),
      api(`/users/${username}/posts`).then((r) => (r.ok ? parseJson(r) : { posts: [] })),
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

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="profile-error">{error} <Link to="/">Back to feed</Link></div>;
  if (!profile) return null;

  const isOwnProfile = currentUser && currentUser.username === profile.username;

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" />
          ) : (
            <span className="avatar-placeholder avatar-large">
              {(profile.displayName || profile.username)[0].toUpperCase()}
            </span>
          )}
        </div>
        <h1 className="profile-name">{profile.displayName || profile.username}</h1>
        <p className="profile-username">@{profile.username}</p>
        <p className="profile-meta">
          {profile.postCount ?? 0} posts
        </p>
      </div>
      <div className="profile-posts">
        <h2 className="profile-posts-title">Posts</h2>
        {posts.length === 0 ? (
          <p className="profile-empty script-ne">अहिले कुनै पोस्ट छैन।</p>
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
