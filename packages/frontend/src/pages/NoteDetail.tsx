import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { noteApi } from '../api/note';
import { bookmarkApi } from '../api/bookmark';
import { reportApi } from '../api/report';
import { ratingApi } from '../api/rating';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/constants';
import Modal from '../components/ui/Modal';
import StarRating from '../components/ui/StarRating';
import { ArrowLeft, Download, Bookmark, Flag, FileText, Share2, Star } from 'lucide-react';
import AdSlot from '../components/ad/AdSlot';
import CommentSection from '../components/comment/CommentSection';
import SEO from '../components/seo/SEO';

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [note, setNote] = useState<any>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    noteApi.get(id)
      .then(res => setNote(res.data.data))
      .catch(() => { setNotFound(true); setNote(null); })
      .finally(() => setLoading(false));

    ratingApi.get(id).then(res => {
      setUserRating(res.data.data.rating);
      setAverageRating(res.data.data.averageRating);
      setRatingsCount(res.data.data.ratingsCount);
    }).catch(() => {});

    if (user) {
      bookmarkApi.check(id).then(res => setBookmarked(res.data.data.bookmarked)).catch(() => {});
    }
  }, [id, user, showToast]);

  const requireAuth = () => {
    navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  const toggleBookmark = async () => {
    if (!user) {
      showToast('error', 'Please log in to bookmark notes');
      requireAuth();
      return;
    }
    try {
      const res = await bookmarkApi.toggle(id!);
      setBookmarked(res.data.data.bookmarked);
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to toggle bookmark'));
    }
  };

  const handleDownload = async () => {
    try {
      await noteApi.download(id!);
      const res = await fetch(note.cloudinaryUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = note.title ? `${note.title}.pdf` : 'note.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNote((prev: any) => prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : prev);
    } catch (err) {
      showToast('error', getApiError(err, 'Download failed'));
    }
  };

  const handleRate = async (value: number) => {
    if (!user) { showToast('error', 'Please log in to rate notes'); requireAuth(); return; }
    try {
      const res = await ratingApi.rate(id!, value);
      setUserRating(res.data.data.rating);
      setAverageRating(res.data.data.averageRating);
      setRatingsCount(res.data.data.ratingsCount);
      showToast('success', 'Rating saved');
    } catch (err) { showToast('error', getApiError(err, 'Failed to save rating')); }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: note?.title || 'NoteUniX Note', url });
    } else {
      navigator.clipboard.writeText(url).then(() => showToast('success', 'Link copied to clipboard')).catch(() => showToast('error', 'Failed to copy link'));
    }
  };

  const handleReport = async () => {
    if (!reportType || !reportReason) return;
    setReporting(true);
    try {
      await reportApi.create({ noteId: id, type: reportType, reason: reportReason });
      showToast('success', 'Report submitted');
      setShowReport(false);
      setReportType('');
      setReportReason('');
    } catch (err: any) {
      if (err.response?.status === 401) {
        showToast('error', 'Session expired. Please log in again.');
        requireAuth();
        return;
      }
      showToast('error', getApiError(err, 'Failed to submit report'));
    } finally {
      setReporting(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (notFound || !note) {
    return (
      <div style={{ padding: '100px 3% 60px', maxWidth: 1400, margin: '0 auto' }}>
        <Link to="/notes" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to notes
        </Link>
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <FileText size={48} style={{ opacity: 0.4 }} />
          <h3>Note not found</h3>
          <p>This note has been deleted or does not exist.</p>
          <Link to="/notes" className="btn-rounded btn-primary" style={{ padding: '10px 24px', fontSize: 13, marginTop: 16, display: 'inline-block', textDecoration: 'none' }}>
            Browse Notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '100px 3% 60px', maxWidth: 1400, margin: '0 auto' }}>
      <SEO
        title={note.title}
        description={note.description || `Download ${note.title} - study notes on NoteUniX`}
        image={note.cloudinaryUrl}
        type="article"
      />
      <Link to="/notes" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        <ArrowLeft size={16} /> Back to notes
      </Link>

      <div className="detail-grid">
        {/* Left — PDF Preview */}
        <div>
          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--palette-4)', cursor: 'default' }}>
            <span className="hierarchy-card-badge" style={{ background: 'var(--palette-4-bg)', color: 'var(--palette-4)' }}>
              <FileText size={11} style={{ marginRight: 4 }} /> PDF Preview
            </span>
            <iframe
              src={note.cloudinaryUrl}
              style={{ width: '100%', height: 'calc(100vh - 200px)', minHeight: 500, borderRadius: 'var(--radius-sm)', border: 'none', marginTop: 4 }}
              title="PDF Preview"
            />
          </div>
          <CommentSection noteId={note._id} />
        </div>

        {/* Right — Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--primary)', cursor: 'default' }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, lineHeight: 1.3 }}>{note.title}</h1>
            {note.description && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{note.description}</p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={toggleBookmark} className="btn-rounded btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }} title="Bookmark">
                <Bookmark size={14} fill={bookmarked ? 'var(--primary)' : 'none'} color={bookmarked ? 'var(--primary)' : 'var(--text-muted)'} />
                {bookmarked ? ' Saved' : ' Save'}
              </button>
              <button onClick={handleDownload} className="btn-rounded btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}>
                <Download size={14} /> Download
              </button>
              <button onClick={handleShare} className="btn-rounded btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }} title="Share">
                <Share2 size={14} />
              </button>
              <button onClick={() => {
                if (!user) { showToast('error', 'Please log in to report notes'); requireAuth(); return; }
                setShowReport(!showReport); setReportReason('');
              }} className="btn-rounded btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }} title="Report">
                <Flag size={14} color={showReport ? 'var(--danger)' : 'var(--text-muted)'} />
              </button>
            </div>

            <Modal open={showReport} onClose={() => setShowReport(false)} title="Report Note" width="400px">
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Help us keep the community safe</p>
              <select className="form-select" style={{ marginBottom: 10 }} value={reportType} onChange={e => setReportType(e.target.value)}>
                <option value="" disabled>Select type</option>
                <option value="copyright">Copyright violation</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="spam">Spam</option>
                <option value="other">Other</option>
              </select>
              <textarea className="form-input" style={{ fontSize: 13, minHeight: 80, padding: '10px 12px', marginBottom: 14, resize: 'vertical' }} placeholder="Describe the issue..." value={reportReason} onChange={e => setReportReason(e.target.value)} />
              <button onClick={handleReport} className="btn-rounded" style={{ padding: '10px 24px', fontSize: 13, backgroundColor: 'var(--danger)', color: '#fff', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} disabled={reporting}>
                <Flag size={14} />
                {reporting ? 'Submitting...' : 'Submit Report'}
              </button>
            </Modal>
          </div>

          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--primary)', cursor: 'default' }}>
            <span className="hierarchy-card-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              Hierarchy
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, fontSize: 13 }}>
              {[
                { label: 'University', name: note.subjectId?.semesterId?.courseId?.universityId?.name },
                { label: 'Course', name: note.subjectId?.semesterId?.courseId?.name, to: `/courses/${note.subjectId?.semesterId?.courseId?._id}` },
                { label: 'Semester', name: note.subjectId?.semesterId?.title, to: `/semesters/${note.subjectId?.semesterId?._id}` },
                { label: 'Subject', name: note.subjectId?.name, to: `/subjects/${note.subjectId?._id}` },
              ].map((item, i) => (
                item.to ? (
                  <Link key={i} to={item.to} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)', textDecoration: 'none' }}>
                    <span style={{ color: 'var(--text-light)', fontSize: 11, minWidth: 64, flexShrink: 0 }}>{item.label}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{item.name || 'N/A'}</span>
                  </Link>
                ) : (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)' }}>
                    <span style={{ color: 'var(--text-light)', fontSize: 11, minWidth: 64, flexShrink: 0 }}>{item.label}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{item.name || 'N/A'}</span>
                  </div>
                )
              ))}
            </div>
          </div>

          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--palette-1)', cursor: 'default' }}>
            <span className="hierarchy-card-badge" style={{ background: 'var(--palette-1-bg)', color: 'var(--palette-1)' }}>
              Details
            </span>
            <div style={{ marginTop: 6, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Uploaded by</span> <span style={{ fontWeight: 600 }}>{note.userId?.fullname || 'Unknown'}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Downloads</span> <span style={{ fontWeight: 600 }}>{note.downloads || 0}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>File size</span> <span style={{ fontWeight: 600 }}>{note.fileSize ? `${(note.fileSize / 1024 / 1024).toFixed(1)} MB` : 'N/A'}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Uploaded</span> <span style={{ fontWeight: 600 }}>{new Date(note.createdAt).toLocaleDateString()}</span></div>
            </div>
          </div>

          {/* Rating Card */}
          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--warning)', cursor: 'default' }}>
            <span className="hierarchy-card-badge" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
              <Star size={11} style={{ marginRight: 4 }} /> Rate this Note
            </span>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)' }}>{averageRating.toFixed(1)}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <StarRating rating={averageRating} size={16} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ratingsCount} rating{ratingsCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10, marginTop: 4 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {user ? 'Your rating:' : <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} style={{ color: 'var(--primary)' }}>Log in</Link>}
                </div>
                {user && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <StarRating rating={userRating || 0} size={22} readonly={false} onChange={handleRate} />
                    {userRating && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>({userRating}/5)</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
          <AdSlot slot="sidebar" />
        </div>
      </div>
    </div>
  );
}
