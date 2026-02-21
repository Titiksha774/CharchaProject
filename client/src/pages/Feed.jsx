import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { parseJson } from '../lib/api';
import PostCard from '../components/PostCard';
import './Feed.css';

export default function Feed() {
  const { user, api } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [error, setError] = useState('');

  const loadPosts = useCallback(async (cursor) => {
    const q = cursor ? `?cursor=${cursor}&limit=20` : '?limit=20';
    const res = await api(`/posts${q}`);
    if (!res.ok) throw new Error('Failed to load posts');
    const data = await parseJson(res);
    return data;
  }, [api]);

  useEffect(() => {
    loadPosts()
      .then((data) => {
        setPosts(data.posts);
        setNextCursor(data.nextCursor);
      })
      .catch(() => setError('Could not load feed'))
      .finally(() => setLoading(false));
  }, [loadPosts]);

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoading(true);
    try {
      const data = await loadPosts(nextCursor);
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    // 🔒 If not logged in → redirect to login
    if (!user) {
      navigate('/login');
      return;
    }

    if (!newPost.trim() || posting) return;

    setPosting(true);
    setError('');

    try {
      const res = await api('/posts', {
        method: 'POST',
        body: JSON.stringify({ content: newPost.trim() }),
      });

      const data = await parseJson(res);

      if (!res.ok) throw new Error(data.error || 'Failed to post');

      setPosts((prev) => [data, ...prev]);
      setNewPost('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    const res = await api(`/posts/${postId}/like`, { method: 'POST' });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(data.error);

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
    if (!res.ok) throw new Error('Failed to delete');
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="feed">
      <div className="feed-compose">
        {!user ? (
          <div className="feed-join-box">
            <p className="script-ne">
              पोस्ट गर्न र छलफलमा सहभागी हुन लग इन गर्नुहोस्।
            </p>
            <button
              type="button"
              className="btn-post"
              onClick={() => navigate('/login')}
            >
              Log in to Post
            </button>
          </div>
        ) : (
          <>
            <div className="compose-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" />
              ) : (
                <span className="avatar-placeholder">
                  {(user?.displayName || user?.username)?.[0]?.toUpperCase()}
                </span>
              )}
            </div>

            <form onSubmit={handleCreatePost} className="compose-form">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind? के सोचिरहनुभएको छ?"
                rows={3}
                maxLength={500}
              />

              <div className="compose-actions">
                <span className="compose-count">
                  {newPost.length}/500
                </span>

                <button
                  type="submit"
                  className="btn-post"
                  disabled={!newPost.trim() || posting}
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {error && <div className="feed-error">{error}</div>}

      <div className="feed-list">
        {loading && posts.length === 0 ? (
          <p className="feed-loading">Loading feed...</p>
        ) : posts.length === 0 ? (
          <p className="feed-empty script-ne">
            अहिले कुनै पोस्ट छैन। पहिलो पोस्ट गर्नुहोस्!
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

        {nextCursor && (
          <button
            type="button"
            className="btn-load-more"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}