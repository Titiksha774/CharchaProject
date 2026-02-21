import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseJson } from '../lib/api';
import PostCard from '../components/PostCard';
import './PostPage.css';

export default function PostPage() {
  const { id } = useParams();
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadPost = async () => {
    const res = await api(`/posts/${id}`);
    if (!res.ok) {
      if (res.status === 404) setError('Post not found');
      return null;
    }
    return parseJson(res);
  };

  const loadComments = async () => {
    const res = await api(`/posts/${id}/comments`);
    if (!res.ok) return [];
    const data = await parseJson(res);
    return data.comments;
  };

  useEffect(() => {
    Promise.all([loadPost(), loadComments()])
      .then(([p, c]) => {
        if (p) setPost(p);
        setComments(c || []);
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async (postId) => {
    const res = await api(`/posts/${postId}/like`, { method: 'POST' });
    const data = await parseJson(res);
    if (!res.ok) return;
    if (post && post.id === postId) {
      setPost((prev) => ({
        ...prev,
        likedByMe: data.liked,
        likeCount: (prev.likeCount || 0) + (data.liked ? 1 : -1),
      }));
    }
  };

  const handleDelete = async (postId) => {
    const res = await api(`/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) navigate('/');
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      const res = await api(`/posts/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.error);
      setComments((prev) => [...prev, data]);
      setPost((prev) => prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev);
      setCommentText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="post-page-loading">Loading...</div>;
  if (error && !post) return <div className="post-page-error">{error} <Link to="/">Back to feed</Link></div>;

  const timeAgo = (date) => {
    const d = new Date(date);
    const sec = Math.floor((Date.now() - d) / 1000);
    if (sec < 60) return 'just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="post-page">
      {post && (
        <>
          <PostCard
            post={post}
            onLike={handleLike}
            onDelete={handleDelete}
          />
          <section className="comments-section">
            <h2 className="comments-title">Comments ({comments.length})</h2>
            {user ? (
              <form onSubmit={handleSubmitComment} className="comment-form">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  maxLength={500}
                />
                <button type="submit" className="btn-comment" disabled={!commentText.trim() || submitting}>
                  {submitting ? 'Posting...' : 'Comment'}
                </button>
              </form>
            ) : (
              <p className="comments-login"> <Link to="/login">Log in</Link> to comment.</p>
            )}
            <ul className="comments-list">
              {comments.map((c) => (
                <li key={c.id} className="comment-item">
                  <div className="comment-avatar">
                    {c.user.avatarUrl ? (
                      <img src={c.user.avatarUrl} alt="" />
                    ) : (
                      <span className="avatar-placeholder">
                        {(c.user.displayName || c.user.username)[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="comment-body">
                    <div className="comment-header">
                      <Link to={`/u/${c.user.username}`} className="comment-name">
                        {c.user.displayName || c.user.username}
                      </Link>
                      <span className="comment-username">@{c.user.username}</span>
                      <span className="comment-time">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="comment-content">{c.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
