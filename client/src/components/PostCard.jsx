import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PostCard.css';

export default function PostCard({ post, onLike, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOwner = user && post.user.id === user.id;

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await onLike(post.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!isOwner || !window.confirm('Delete this post?')) return;

    try {
      await onDelete(post.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentClick = (e) => {
    if (!user) {
      e.preventDefault(); // stop navigation
      navigate('/login');
    }
  };

  const timeAgo = (date) => {
    const d = new Date(date);
    const sec = Math.floor((Date.now() - d) / 1000);
    if (sec < 60) return 'just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
    if (sec < 604800) return `${Math.floor(sec / 86400)}d`;
    return d.toLocaleDateString();
  };

  return (
    <article className="post-card">
      <div className="post-card-avatar">
        {post.user.avatarUrl ? (
          <img src={post.user.avatarUrl} alt="" />
        ) : (
          <span className="avatar-placeholder">
            {(post.user.displayName || post.user.username)[0].toUpperCase()}
          </span>
        )}
      </div>

      <div className="post-card-body">
        <div className="post-card-header">
          <Link to={`/u/${post.user.username}`} className="post-card-name">
            {post.user.displayName || post.user.username}
          </Link>

          <span className="post-card-username">@{post.user.username}</span>
          <span className="post-card-time">{timeAgo(post.createdAt)}</span>

          {isOwner && (
            <button
              type="button"
              className="post-card-delete"
              onClick={handleDelete}
              title="Delete"
            >
              ×
            </button>
          )}
        </div>

        <Link to={`/post/${post.id}`} className="post-card-content">
          {post.content}
        </Link>

        <div className="post-card-actions">
          <Link
            to={`/post/${post.id}`}
            className="action-btn comment-btn"
            title="Comment"
            onClick={handleCommentClick}
          >
            💬 {post.commentCount ?? 0}
          </Link>

          <button
            type="button"
            className={`action-btn like-btn ${post.likedByMe ? 'liked' : ''}`}
            onClick={handleLike}
            title="Like"
          >
            {post.likedByMe ? '❤️' : '🤍'} {post.likeCount ?? 0}
          </button>
        </div>
      </div>
    </article>
  );
}