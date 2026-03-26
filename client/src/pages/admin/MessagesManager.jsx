import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axiosConfig';

export default function MessagesManager() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/contact');
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMessages(); }, []);

  const toggleRead = async (id) => {
    try {
      await api.patch(`/contact/${id}/read`);
      fetchMessages();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try { await api.delete(`/contact/${id}`); fetchMessages(); } catch {}
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div>
      <div className="admin-header">
        <h1>Messages {unreadCount > 0 && <span style={{ fontSize: 'var(--text-sm)', background: 'var(--accent-blue)', color: 'white', padding: '2px 10px', borderRadius: 'var(--radius-full)', marginLeft: 8 }}>{unreadCount} new</span>}</h1>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>From</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(msg => (
              <tr key={msg._id} style={{ opacity: msg.isRead ? 0.7 : 1 }}>
                <td>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: msg.isRead ? 'var(--text-muted)' : 'var(--accent-blue)',
                    display: 'inline-block'
                  }} />
                </td>
                <td>
                  <div style={{ fontWeight: msg.isRead ? 400 : 600 }}>{msg.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{msg.email}</div>
                </td>
                <td style={{ fontWeight: msg.isRead ? 400 : 600 }}>{msg.subject || '-'}</td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message}</td>
                <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(msg.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleRead(msg._id)}>
                      {msg.isRead ? 'Unread' : 'Read'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(msg._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>No messages yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
