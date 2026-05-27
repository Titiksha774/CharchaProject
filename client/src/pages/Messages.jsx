import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseJson } from '../lib/api';
import './Social.css';

function UserAvatar({ user }) {
  return (
    <div className="social-avatar">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" />
      ) : (
        <span className="avatar-placeholder">
          {(user.displayName || user.username)[0].toUpperCase()}
        </span>
      )}
    </div>
  );
}

function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Messages() {
  const { username } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    if (!username) {
      api('/messages/conversations')
        .then((res) => (res.ok ? parseJson(res) : Promise.reject()))
        .then((data) => setConversations(data.conversations || []))
        .catch(() => setError('Could not load conversations.'))
        .finally(() => setLoading(false));
      return;
    }

    api(`/messages/${username}`)
      .then(async (res) => {
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data.error || 'Could not load messages.');
        return data;
      })
      .then((data) => {
        setFriend(data.user);
        setMessages(data.messages || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [username, api]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!username || !messageText.trim() || sending) return;

    setSending(true);
    setError('');
    try {
      const res = await api(`/messages/${username}`, {
        method: 'POST',
        body: JSON.stringify({ content: messageText.trim() }),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.error || 'Message failed.');
      setMessages((prev) => [...prev, data]);
      setMessageText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="social-loading">Loading messages...</div>;

  if (!username) {
    return (
      <div className="social-page">
        <section className="social-hero">
          <div>
            <p className="eyebrow script-ne">सन्देश</p>
            <h1>Private messages</h1>
            <p>Chat one-to-one with the friends you have accepted on Charcha.</p>
          </div>
        </section>

        {error && <div className="social-notice">{error}</div>}

        <section className="social-panel">
          <div className="section-heading">
            <div>
              <h2>Conversations</h2>
              <p>Choose a friend to start or continue a private thread.</p>
            </div>
            <Link className="btn-secondary" to="/friends">Find Friends</Link>
          </div>

          <div className="social-list">
            {conversations.length === 0 ? (
              <p className="empty-state">No conversations yet. Add a friend to begin messaging.</p>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.user.id}
                  className="conversation-row"
                  type="button"
                  onClick={() => navigate(`/messages/${conversation.user.username}`)}
                >
                  <UserAvatar user={conversation.user} />
                  <span className="conversation-main">
                    <span className="person-name">
                      {conversation.user.displayName || conversation.user.username}
                    </span>
                    <span className="person-username">@{conversation.user.username}</span>
                    <span className="conversation-preview">
                      {conversation.latestMessage
                        ? conversation.latestMessage.content
                        : 'No messages yet'}
                    </span>
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge">{conversation.unreadCount}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  if (error && !friend) {
    return (
      <div className="social-page">
        <div className="social-notice">{error}</div>
        <Link className="btn-secondary" to="/friends">Go to Friends</Link>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <header className="thread-header">
        <button className="btn-ghost" type="button" onClick={() => navigate('/messages')}>
          Back
        </button>
        {friend && (
          <Link className="thread-person" to={`/u/${friend.username}`}>
            <UserAvatar user={friend} />
            <span>
              <strong>{friend.displayName || friend.username}</strong>
              <small>@{friend.username}</small>
            </span>
          </Link>
        )}
      </header>

      {error && <div className="social-notice">{error}</div>}

      <div className="message-thread">
        {messages.length === 0 ? (
          <p className="empty-state">This is the start of your private conversation.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-bubble ${message.mine ? 'mine' : 'theirs'}`}
            >
              <p>{message.content}</p>
              <span>{formatTime(message.createdAt)}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form className="message-form" onSubmit={sendMessage}>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Write a private message"
          maxLength={1000}
          rows={2}
        />
        <button className="btn-primary" type="submit" disabled={!messageText.trim() || sending}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
