import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import { emitStatsRefresh } from '../../utils/statsRefresh';
import ConfirmModal from '../../components/ui/ConfirmModal';
import DetailModal from '../../components/ui/DetailModal';
import { MessageSquare, Mail, User, Trash2, CheckCheck, Clock, Inbox, Send, Reply, AlertTriangle } from 'lucide-react';
import { getApiError } from '../../utils/constants';

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  read: boolean;
  replied: boolean;
  replyContent: string;
  repliedAt: string;
  createdAt: string;
}

export default function Messages() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);
  const [detailTarget, setDetailTarget] = useState<ContactMessage | null>(null);
  const [replyTarget, setReplyTarget] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [retryHours, setRetryHours] = useState<number | null>(null);

  const fetchMessages = useCallback(() => {
    setLoading(true);
    adminApi.contacts()
      .then(res => setMessages(res.data.data))
      .catch(err => showToast('error', getApiError(err, 'Failed to load messages')))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleMarkRead = useCallback(async (msg: ContactMessage) => {
    try {
      await adminApi.markContactRead(msg._id);
      emitStatsRefresh();
      setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, read: true } : m));
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to mark as read'));
    }
  }, [showToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteContact(deleteTarget._id);
      showToast('success', 'Message deleted');
      emitStatsRefresh();
      setMessages(prev => prev.filter(m => m._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to delete message'));
    }
  }, [deleteTarget, showToast]);

  const handleReply = useCallback(async () => {
    if (!replyTarget || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      const res = await adminApi.replyContact(replyTarget._id, replyText.trim());
      showToast('success', `Reply sent to ${replyTarget.name}`);
      setMessages(prev => prev.map(m => m._id === replyTarget._id ? { ...m, replied: true, replyContent: replyText.trim(), repliedAt: res.data.data.repliedAt, read: true } : m));
      setReplyTarget(null);
      setReplyText('');
      setRetryHours(null);
    } catch (err: any) {
      const rh = err?.response?.data?.retryHours;
      if (rh) {
        setRetryHours(rh);
        showToast('error', `Email service unavailable. Please try again in ~${rh}h.`);
      } else {
        showToast('error', getApiError(err, 'Failed to send reply'));
      }
    } finally {
      setReplyLoading(false);
    }
  }, [replyTarget, replyText, showToast]);

  const openReply = (msg: ContactMessage) => {
    setReplyTarget(msg);
    setReplyText('');
  };

  const unreadCount = messages.filter(m => !m.read).length;
  const repliedCount = messages.filter(m => m.replied).length;

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex-wrap" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Contact Messages</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {messages.length} total{messages.length > 0 && ` · ${unreadCount} unread · ${repliedCount} replied`}
          </p>
        </div>
      </div>

      {retryHours !== null && (
        <div style={{
          marginBottom: 20, padding: '12px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--warning-light, rgba(245,158,11,0.1))', border: '1px solid var(--warning, #f59e0b)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-main)',
        }}>
          <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div>
            <strong>Email service temporarily unavailable.</strong>{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              Replies are saved but emails won't send. Resets in ~{retryHours}h.
            </span>
          </div>
          <Clock size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginLeft: 'auto' }} />
        </div>
      )}

      {messages.length === 0 ? (
        <div className="empty-state"><Inbox size={48} /><h3>No messages yet</h3></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>From</th>
                <th>Topic</th>
                <th>Message</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(msg => (
                <tr
                  key={msg._id}
                  onClick={() => setDetailTarget(msg)}
                  style={{ opacity: msg.read && msg.replied ? 0.6 : 1 }}
                >
                  <td data-card-title="Status">
                    {msg.replied ? (
                      <span className="badge badge-secondary" style={{ fontSize: 10 }}>
                        <Reply size={11} style={{ marginRight: 3 }} /> Replied
                      </span>
                    ) : msg.read ? (
                      <span className="badge badge-muted" style={{ fontSize: 10 }}>
                        <CheckCheck size={11} style={{ marginRight: 3 }} /> Read
                      </span>
                    ) : (
                      <span className="badge badge-primary" style={{ fontSize: 10 }}>
                        <Clock size={11} style={{ marginRight: 3 }} /> New
                      </span>
                    )}
                  </td>
                  <td data-card-title="From">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>{msg.name.charAt(0).toUpperCase()}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{msg.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, wordBreak: 'break-all' }}>{msg.email}</div>
                      </div>
                    </div>
                  </td>
                  <td data-card-title="Topic" style={{ fontSize: 13, wordBreak: 'break-word' }}>{msg.topic || '—'}</td>
                  <td data-card-title="Message" style={{ fontSize: 13 }}>
                    <div style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>{msg.message}</div>
                  </td>
                  <td data-card-title="Date" style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    <Clock size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </td>
                  <td data-card-title="Actions">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openReply(msg)} className="btn-rounded" style={{ padding: '5px 10px', fontSize: 10, backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                        <Reply size={11} /> Reply
                      </button>
                      {!msg.read && (
                        <button onClick={() => handleMarkRead(msg)} className="btn-rounded" style={{ padding: '5px 10px', fontSize: 10, backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                          <CheckCheck size={11} /> Read
                        </button>
                      )}
                      <button onClick={() => setDeleteTarget(msg)} className="btn-rounded" style={{ padding: '5px 10px', fontSize: 10, backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <DetailModal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.name || ''}
        fields={[
          { label: 'Email', value: detailTarget?.email || '-' },
          { label: 'Topic', value: detailTarget?.topic || 'None' },
          { label: 'Status', value: detailTarget?.replied ? 'Replied' : detailTarget?.read ? 'Read' : 'Unread' },
          { label: 'Date', value: detailTarget?.createdAt ? new Date(detailTarget.createdAt).toLocaleString() : '-' },
        ]}
      >
        {detailTarget && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Message:</div>
            <div style={{
              fontSize: 13, lineHeight: 1.7, color: 'var(--text-main)',
              background: 'var(--bg-subtle)', borderRadius: 10, padding: 16,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {detailTarget.message}
            </div>
            {detailTarget.replied && detailTarget.replyContent && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Reply size={13} /> Your Reply
                </div>
                <div style={{
                  fontSize: 13, lineHeight: 1.7, color: 'var(--text-main)',
                  background: 'var(--primary-light)', borderRadius: 10, padding: 16,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', borderLeft: '3px solid var(--primary)',
                }}>
                  {detailTarget.replyContent}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>
                  Replied {detailTarget.repliedAt ? new Date(detailTarget.repliedAt).toLocaleString() : ''}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <button onClick={() => { const m = detailTarget; setDetailTarget(null); openReply(m); }} className="btn-rounded" style={{ padding: '7px 14px', fontSize: 12, backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', gap: 4, alignItems: 'center', border: 'none', cursor: 'pointer' }}>
                <Reply size={13} /> Reply
              </button>
              {!detailTarget.read && (
                <button onClick={() => { const m = detailTarget; setDetailTarget(null); handleMarkRead(m); }} className="btn-rounded" style={{ padding: '7px 14px', fontSize: 12, backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', gap: 4, alignItems: 'center', border: 'none', cursor: 'pointer' }}>
                  <CheckCheck size={13} /> Mark as Read
                </button>
              )}
              <button onClick={() => { setDetailTarget(null); setDeleteTarget(detailTarget); }} className="btn-rounded" style={{ padding: '7px 14px', fontSize: 12, backgroundColor: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', gap: 4, alignItems: 'center', border: 'none', cursor: 'pointer' }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        )}
      </DetailModal>

      {/* Reply Modal */}
      {replyTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setReplyTarget(null); setReplyText(''); } }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: 'var(--primary-light)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>Reply to {replyTarget.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{replyTarget.email}{replyTarget.topic ? ` · ${replyTarget.topic}` : ''}</p>
              </div>
              <button onClick={() => { setReplyTarget(null); setReplyText(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, padding: 4 }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Their message:</div>
              <div style={{ fontSize: 13, color: 'var(--text-main)', background: 'var(--bg-subtle)', borderRadius: 8, padding: 12, marginBottom: 16, whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 120, overflow: 'auto' }}>
                {replyTarget.message}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Your reply:</div>
              <textarea
                className="form-input"
                rows={6}
                placeholder="Type your reply..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.6, minHeight: 120, borderColor: replyText ? 'var(--primary)' : undefined }}
              />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => { setReplyTarget(null); setReplyText(''); }} className="btn-rounded" style={{ padding: '9px 20px', fontSize: 13, background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                Cancel
              </button>
              <button onClick={handleReply} disabled={!replyText.trim() || replyLoading || retryHours !== null} className="btn-rounded btn-primary" style={{ padding: '9px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: (!replyText.trim() || replyLoading || retryHours !== null) ? 0.5 : 1 }}>
                {replyLoading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Send size={13} />}
                {replyLoading ? 'Sending...' : retryHours !== null ? `Unavailable (~${retryHours}h)` : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Message"
        message={`Are you sure you want to delete the message from ${deleteTarget?.name}?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
