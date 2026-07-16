import { useState, useRef } from 'react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { Send, Loader2, Users, User, Code, Eye, Info, Clock, AlertTriangle } from 'lucide-react';

export default function Mail() {
  const { showToast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'single'>('all');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [retryHours, setRetryHours] = useState<number | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const insertPlaceholder = () => {
    const ta = taRef.current;
    if (!ta) { setMessage(p => p + '{{name}}'); return; }
    const s = ta.selectionStart, e = ta.selectionEnd;
    const next = message.slice(0, s) + '{{name}}' + message.slice(e);
    setMessage(next);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + 8, s + 8); }, 0);
  };

  const doSend = async () => {
    setShowConfirm(false);
    setLoading(true);
    setRetryHours(null);
    try {
      const html = message.replace(/\n/g, '<br>');
      const res = await adminApi.sendEmail({
        subject,
        html,
        recipientType,
        recipientEmail: recipientType === 'single' ? recipientEmail : undefined,
      });
      const { sent, failed } = res.data.data;
      const rh = res.data.retryHours || null;
      if (rh) setRetryHours(rh);
      if (failed > 0 && sent > 0) {
        showToast('warning', `Sent to ${sent} user${sent !== 1 ? 's' : ''}, ${failed} failed. Retry in ${rh}h.`);
      } else if (failed > 0 && sent === 0) {
        showToast('error', `All emails failed. Service recovers in ~${rh}h.`, 8000);
      } else {
        showToast('success', `Email sent to ${sent} user${sent !== 1 ? 's' : ''}`);
      }
      if (failed === 0) {
        setSubject('');
        setMessage('');
        setRecipientEmail('');
        setPreview(false);
        setRetryHours(null);
      }
    } catch (err: any) {
      const rh = err?.response?.data?.retryHours;
      if (rh) {
        setRetryHours(rh);
        showToast('error', `Email service unavailable. Please try again in ~${rh}h.`, 8000);
      } else {
        showToast('error', err?.response?.data?.message || err?.message || 'Failed to send email');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setShowConfirm(true);
  };

  const canSend = subject.trim() && message.trim() && !loading;

  /* ───── PREVIEW MODE ───── */
  if (preview) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
        <div className="flex-wrap" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Email Preview</h1>
          <button type="button" onClick={() => setPreview(false)} className="btn-rounded"
            style={{ padding: '8px 16px', fontSize: 13, background: 'var(--primary)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Code size={14} /> Compose
          </button>
        </div>

        <div style={{
          flex: 1, minHeight: 0, overflow: 'auto',
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>N</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>NoteUniX</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>notifications@noteunix.com</div>
            </div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Subject</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text-main)' }}>
              {subject || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No subject</span>}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {message.split('{{name}}').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span style={{ color: 'var(--primary)', fontWeight: 600, background: 'var(--primary-light)', padding: '1px 6px', borderRadius: 4, fontSize: 13 }}>
                      {'{{name}}'}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-subtle)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={13} />
            Recipients: {recipientType === 'all' ? 'All users' : recipientEmail || 'Not set'}
          </div>
        </div>
      </div>
    );
  }

  /* ───── COMPOSE MODE ───── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
      {/* Header */}
      <div className="flex-wrap" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Send Email</h1>
        <button type="button" onClick={() => setPreview(true)} className="btn-rounded"
          style={{ padding: '8px 16px', fontSize: 13, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Eye size={14} /> Preview
        </button>
      </div>

      {/* Email service unavailable banner */}
      {retryHours !== null && (
        <div style={{
          flexShrink: 0, marginBottom: 16, padding: '12px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--warning-light, rgba(245,158,11,0.1))', border: '1px solid var(--warning, #f59e0b)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-main)',
        }}>
          <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div>
            <strong>Email service temporarily unavailable.</strong>{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              Daily limit reached. Resets in ~{retryHours}h.
            </span>
          </div>
          <Clock size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginLeft: 'auto' }} />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Recipients */}
        <div style={{ flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 20px' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['all', 'single'] as const).map(t => (
              <button key={t} type="button" onClick={() => setRecipientType(t)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${recipientType === t ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: recipientType === t ? 'var(--primary-light)' : 'transparent',
                  color: recipientType === t ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'var(--transition)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                {t === 'all' ? <Users size={15} /> : <User size={15} />}
                {t === 'all' ? 'All Users' : 'Single User'}
              </button>
            ))}
          </div>
          {recipientType === 'single' && (
            <input type="email" className="form-input" placeholder="user@example.com"
              value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} required
              style={{ marginTop: 10, padding: '10px 14px' }} />
          )}
        </div>

        {/* Subject */}
        <div style={{ flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Subject</div>
          <input type="text" className="form-input" placeholder="What's this email about?"
            value={subject} onChange={e => setSubject(e.target.value.slice(0, 150))} required maxLength={150}
            style={{ flex: 1, padding: '10px 14px', margin: 0 }} />
          <span style={{ fontSize: 11, color: subject.length > 120 ? 'var(--danger)' : 'var(--text-light)', whiteSpace: 'nowrap' }}>
            {subject.length}/150
          </span>
        </div>

        {/* Message — takes remaining space */}
        <div style={{ flex: 1, minHeight: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)' }}>Message</span>
            <button type="button" onClick={insertPlaceholder} className="btn-rounded"
              style={{ padding: '5px 12px', fontSize: 12, background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
              {'{{name}}'}
            </button>
          </div>
          <textarea ref={taRef} className="form-input" rows={8}
            placeholder={"Write your email message here...\nUse {{name}} for the recipient's name."}
            value={message} onChange={e => setMessage(e.target.value)} required
            style={{ flex: 1, minHeight: 0, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13, lineHeight: 1.7, resize: 'none' }} />
        </div>

        {/* Send button */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-rounded btn-primary" disabled={!canSend}
            style={{ padding: '11px 28px', fontSize: 14, opacity: canSend ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
            {loading ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </form>

      <ConfirmModal open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={doSend}
        title="Send Email"
        message={recipientType === 'all' ? `Send "${subject}" to all users?` : `Send "${subject}" to ${recipientEmail}?`}
        confirmLabel="Send" variant="primary" />

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
