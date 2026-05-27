import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

function PersonRow({ user, meta, children }) {
  return (
    <div className="person-row">
      <UserAvatar user={user} />
      <div className="person-main">
        <Link to={`/u/${user.username}`} className="person-name">
          {user.displayName || user.username}
        </Link>
        <span className="person-username">@{user.username}</span>
        {meta && <span className="person-meta">{meta}</span>}
      </div>
      <div className="person-actions">{children}</div>
    </div>
  );
}

export default function Friends() {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState('');

  const hasRequests = incoming.length > 0 || outgoing.length > 0;

  const loadSocial = async () => {
    const [friendsRes, requestsRes] = await Promise.all([
      api('/friends'),
      api('/friends/requests'),
    ]);

    if (!friendsRes.ok || !requestsRes.ok) throw new Error('Could not load friends');

    const friendsData = await parseJson(friendsRes);
    const requestsData = await parseJson(requestsRes);
    setFriends(friendsData.friends || []);
    setIncoming(requestsData.incoming || []);
    setOutgoing(requestsData.outgoing || []);
  };

  useEffect(() => {
    loadSocial()
      .catch(() => setNotice('Could not load your friends right now.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api(`/friends/search?q=${encodeURIComponent(q)}`);
        const data = await parseJson(res);
        setResults(res.ok ? data.users || [] : []);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query, api]);

  const outgoingByUsername = useMemo(
    () => new Set(outgoing.map((request) => request.user.username)),
    [outgoing]
  );

  const sendRequest = async (username) => {
    setNotice('');
    const res = await api(`/friends/${username}/request`, { method: 'POST' });
    const data = await parseJson(res);
    if (!res.ok && res.status !== 409) {
      setNotice(data.error || 'Could not send friend request.');
      return;
    }

    setResults((prev) =>
      prev.map((item) =>
        item.username === username
          ? { ...item, relationship: data.relationship || 'outgoing_request' }
          : item
      )
    );
    await loadSocial();
  };

  const acceptRequest = async (requestId) => {
    const res = await api(`/friends/requests/${requestId}/accept`, { method: 'POST' });
    if (!res.ok) return;
    await loadSocial();
  };

  const declineRequest = async (requestId) => {
    const res = await api(`/friends/requests/${requestId}/decline`, { method: 'POST' });
    if (!res.ok) return;
    setIncoming((prev) => prev.filter((request) => request.id !== requestId));
  };

  const removeFriend = async (username) => {
    const res = await api(`/friends/${username}`, { method: 'DELETE' });
    if (!res.ok) return;
    setFriends((prev) => prev.filter((friend) => friend.user.username !== username));
  };

  const renderSearchAction = (person) => {
    if (person.relationship === 'friends') {
      return (
        <button className="btn-secondary" type="button" onClick={() => navigate(`/messages/${person.username}`)}>
          Message
        </button>
      );
    }

    if (person.relationship === 'outgoing_request' || outgoingByUsername.has(person.username)) {
      return <span className="status-pill">Pending</span>;
    }

    if (person.relationship === 'incoming_request') {
      return <span className="status-pill">Wants to connect</span>;
    }

    return (
      <button className="btn-primary" type="button" onClick={() => sendRequest(person.username)}>
        Add Friend
      </button>
    );
  };

  if (loading) return <div className="social-loading">Loading your circle...</div>;

  return (
    <div className="social-page">
      <section className="social-hero">
        <div>
          <p className="eyebrow script-ne">साथीहरू</p>
          <h1>Find your people on Charcha</h1>
          <p>Search users, accept requests, and keep your private conversations close.</p>
        </div>
      </section>

      {notice && <div className="social-notice">{notice}</div>}

      <section className="social-panel">
        <div className="section-heading">
          <div>
            <h2>Search people</h2>
            <p>Use a name or username to send a friend request.</p>
          </div>
        </div>

        <input
          className="social-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or username"
        />

        <div className="social-list">
          {searching ? (
            <p className="empty-state">Searching...</p>
          ) : results.length > 0 ? (
            results.map((person) => (
              <PersonRow key={person.id} user={person}>
                {renderSearchAction(person)}
              </PersonRow>
            ))
          ) : query.trim().length >= 2 ? (
            <p className="empty-state">No people found.</p>
          ) : (
            <p className="empty-state">Type at least two characters to search.</p>
          )}
        </div>
      </section>

      {hasRequests && (
        <section className="social-panel">
          <div className="section-heading">
            <div>
              <h2>Friend requests</h2>
              <p>Review people who want to join your circle.</p>
            </div>
          </div>

          {incoming.length > 0 && (
            <div className="social-list">
              {incoming.map((request) => (
                <PersonRow key={request.id} user={request.user} meta="Incoming request">
                  <button className="btn-primary" type="button" onClick={() => acceptRequest(request.id)}>
                    Accept
                  </button>
                  <button className="btn-ghost" type="button" onClick={() => declineRequest(request.id)}>
                    Decline
                  </button>
                </PersonRow>
              ))}
            </div>
          )}

          {outgoing.length > 0 && (
            <div className="social-list">
              {outgoing.map((request) => (
                <PersonRow key={request.id} user={request.user} meta="Request sent">
                  <span className="status-pill">Pending</span>
                </PersonRow>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="social-panel">
        <div className="section-heading">
          <div>
            <h2>Your friends</h2>
            <p>{friends.length} {friends.length === 1 ? 'friend' : 'friends'} connected.</p>
          </div>
        </div>

        <div className="social-list">
          {friends.length === 0 ? (
            <p className="empty-state">Your friend list is waiting for its first connection.</p>
          ) : (
            friends.map((friend) => (
              <PersonRow key={friend.friendshipId} user={friend.user}>
                <button className="btn-secondary" type="button" onClick={() => navigate(`/messages/${friend.user.username}`)}>
                  Message
                </button>
                <button className="btn-ghost" type="button" onClick={() => removeFriend(friend.user.username)}>
                  Remove
                </button>
              </PersonRow>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
