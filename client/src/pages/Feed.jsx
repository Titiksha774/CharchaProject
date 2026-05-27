import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseJson } from '../lib/api';
import PostCard from '../components/PostCard';
import './Feed.css';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function mediaTypeFromFile(file) {
  if (file?.type?.startsWith('video/')) return 'VIDEO';
  return 'IMAGE';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read this file'));
    reader.readAsDataURL(file);
  });
}

export default function Feed() {
  const { user, api } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [error, setError] = useState('');

  const loadPosts = useCallback(async (cursor) => {
    const q = cursor ? `?cursor=${cursor}&limit=20` : '?limit=20';
    const res = await api(`/posts${q}`);
    if (!res.ok) throw new Error('Failed to load posts');
    return parseJson(res);
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

  useEffect(() => {
    if (!mediaFile) {
      setMediaPreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(mediaFile);
    setMediaPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [mediaFile]);

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

  const handleMediaChange = (e) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) {
      setMediaFile(null);
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Please choose an image or video file.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError('Please choose a file that is 25MB or smaller.');
      e.target.value = '';
      return;
    }

    setMediaFile(file);
  };

  const uploadMedia = async () => {
    if (!mediaFile) return { mediaUrl: '', mediaType: '' };

    const data = await readFileAsDataUrl(mediaFile);
    const res = await api('/uploads/media', {
      method: 'POST',
      body: JSON.stringify({
        fileName: mediaFile.name,
        mimeType: mediaFile.type,
        data,
      }),
    });

    const result = await parseJson(res);
    if (!res.ok) throw new Error(result.error || 'Could not upload media');
    return result;
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    if ((!newPost.trim() && !mediaFile) || posting) return;

    setPosting(true);
    setError('');

    try {
      const media = await uploadMedia();
      const res = await api('/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: newPost.trim(),
          mediaUrl: media.mediaUrl,
          mediaType: media.mediaType,
        }),
      });

      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.error || 'Failed to post');

      setPosts((prev) => [data, ...prev]);
      setNewPost('');
      setMediaFile(null);
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
      <section className="feed-hero">
        <div>
          <p className="script-ne">नमस्ते, Charcha मा स्वागत छ</p>
          <h1>Share what Nepal is talking about.</h1>
          <div className="feed-hero-actions">
            {user ? (
              <>
                <button type="button" onClick={() => navigate('/friends')}>Find Friends</button>
                <button type="button" onClick={() => navigate('/messages')}>Messages</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => navigate('/register')}>Join Charcha</button>
                <button type="button" onClick={() => navigate('/login')}>Log in</button>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="feed-compose">
        {!user ? (
          <div className="feed-join-box">
            <p className="script-ne">
              पोस्ट गर्न, साथीहरू थप्न, र निजी सन्देश पठाउन लग इन गर्नुहोस्।
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

              <div className="compose-media-picker">
                <label className="media-pick-button">
                  Choose photo or video
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                  />
                </label>
                <span className="media-file-name">
                  {mediaFile ? mediaFile.name : 'No file selected'}
                </span>
              </div>

              {mediaPreview && (
                <div className="compose-preview">
                  {mediaTypeFromFile(mediaFile) === 'VIDEO' ? (
                    <video src={mediaPreview} controls />
                  ) : (
                    <img src={mediaPreview} alt="" />
                  )}
                  <button type="button" onClick={() => setMediaFile(null)}>
                    Remove
                  </button>
                </div>
              )}

              <div className="compose-actions">
                <span className="compose-count">
                  {newPost.length}/500
                </span>

                <button
                  type="submit"
                  className="btn-post"
                  disabled={(!newPost.trim() && !mediaFile) || posting}
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
