import { useState } from 'react';
import { Mail, MessageSquare, Send, MapPin, Clock, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/constants';
import { contactApi } from '../api/contact';

export default function Contact() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      showToast('error', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await contactApi.send(form);
      showToast('success', 'Message sent! We\'ll get back to you within 24 hours.');
      setForm({ name: '', email: '', topic: '', message: '' });
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to send message. Please try again later.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <section style={{ flex: 1, padding: '100px 5% 60px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Contact Us</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 40, lineHeight: 1.6 }}>
            Have a question, suggestion, or need help? We'd love to hear from you.
          </p>

          <div className="contact-grid">
            <div className="faq-grid">
              {[
                { icon: <Mail size={20} />, title: 'Email', text: 'support@noteunix.com', desc: 'We reply within 24 hours' },
                { icon: <MapPin size={20} />, title: 'Location', text: 'Kathmandu, Nepal', desc: 'Virtual team' },
                { icon: <Clock size={20} />, title: 'Response Time', text: 'Mon–Fri, 9AM–6PM', desc: 'Nepal Time (UTC+5:45)' },
                { icon: <MessageSquare size={20} />, title: 'Social', text: '@noteunix', desc: 'Follow us for updates' },
              ].map((item, i) => (
                <div key={i} className="content-card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-full)',
                    background: 'var(--primary-light)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ color: 'var(--primary)' }}>{item.icon}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 500 }}>{item.text}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="content-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Send us a message</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                <input
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle)', color: 'var(--text-main)', fontSize: 14, outline: 'none',
                  }}
                />
                <input
                  placeholder="Your email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle)', color: 'var(--text-main)', fontSize: 14, outline: 'none',
                  }}
                />
                <select
                  value={form.topic}
                  onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle)', color: 'var(--text-main)', fontSize: 14, outline: 'none',
                  }}
                >
                  <option value="">Select a topic</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="report">Report Content</option>
                  <option value="feedback">Feedback</option>
                </select>
                <textarea
                  placeholder="Your message..."
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle)', color: 'var(--text-main)', fontSize: 14, outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit', flex: 1, minHeight: 120,
                  }}
                />
                <button type="submit" className="btn-rounded btn-primary" style={{ padding: '12px 28px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }} disabled={loading}>
                  {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />} {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
      </section>
    </div>
  );
}
