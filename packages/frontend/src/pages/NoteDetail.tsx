import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { noteApi } from '../api/note';
import { bookmarkApi } from '../api/bookmark';
import { reportApi } from '../api/report';
import { ratingApi } from '../api/rating';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/constants';
import { getThumbnailUrl, getPreviewUrl } from '../utils/cloudinary';
import FileTypePlaceholder from '../components/ui/FileTypePlaceholder';
import Modal from '../components/ui/Modal';
import StarRating from '../components/ui/StarRating';
import { ArrowLeft, Download, Bookmark, Flag, FileText, Share2, Star, BadgeCheck, ArrowRight, CheckSquare, Square, Edit3, Save, X, XCircle, Loader2, DownloadCloud } from 'lucide-react';
import Select from '../components/ui/Select';
import AdSlot from '../components/ad/AdSlot';
import CommentSection from '../components/comment/CommentSection';
import SEO from '../components/seo/SEO';

function getFileTypeFromUrl(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
  const known = new Set(['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp']);
  return known.has(ext) ? ext : '';
}

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
  const [relatedNotes, setRelatedNotes] = useState<any[]>([]);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const [selectedDownloadIndices, setSelectedDownloadIndices] = useState<number[]>([]);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editResourceType, setEditResourceType] = useState('study_notes');
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);
  const editThumbRef = useRef<HTMLInputElement>(null);

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

    noteApi.related(id!).then(res => setRelatedNotes(res.data.data || [])).catch(() => {});

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

  const handleDownload = async (fileIdx?: number) => {
    try {
      const indices = fileIdx !== undefined ? [fileIdx] : selectedDownloadIndices.length > 0 ? selectedDownloadIndices : [0];
      await noteApi.download(id!);
      for (const idx of indices) {
        const a = document.createElement('a');
        a.href = `/api/notes/${id}/download/file/${idx}`;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setNote((prev: any) => prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : prev);
      setShowDownloadPopup(false);
    } catch (err) {
      showToast('error', getApiError(err, 'Download failed'));
    }
  };

  const handleEditSave = async () => {
    if (!editTitle.trim()) {
      showToast('error', 'Title is required');
      return;
    }
    setSavingEdit(true);
    try {
      const fd = new FormData();
      fd.append('title', editTitle);
      fd.append('description', editDesc);
      fd.append('resourceType', editResourceType);
      editFiles.forEach(f => fd.append('files', f));
      if (editThumbnail) fd.append('thumbnail', editThumbnail);
      const res = await noteApi.update(id!, fd);
      setNote(res.data.data);
      setEditing(false);
      showToast('success', 'Note updated');
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to update note'));
    } finally {
      setSavingEdit(false);
    }
  };

  const startEditing = () => {
    setEditTitle(note.title);
    setEditDesc(note.description || '');
    setEditResourceType(note.resourceType || 'study_notes');
    setEditFiles([]);
    setEditThumbnail(null);
    setEditThumbnailPreview('');
    setEditing(true);
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
      <div className="note-detail-page">
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
    <div className="note-detail-page">
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
        {/* Left — Note Preview */}
        <div>
          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--palette-4)', cursor: 'default' }}>
            <span className="hierarchy-card-badge" style={{ background: 'var(--palette-4-bg)', color: 'var(--palette-4)' }}>
              <FileText size={11} style={{ marginRight: 4 }} /> Note Preview
            </span>
            {note.files?.length > 1 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {note.files.map((f: any, i: number) => (
                  <button key={i} onClick={() => setActiveFileIdx(i)}
                    className={`btn-rounded ${i === activeFileIdx ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '4px 10px', fontSize: 11, gap: 4 }}>
                    {f.fileType?.toUpperCase()} {i + 1}
                  </button>
                ))}
              </div>
            )}

            {(() => {
              const f = note.files?.[activeFileIdx] || { url: note.cloudinaryUrl, fileType: getFileTypeFromUrl(note.cloudinaryUrl) || note.fileType };
              if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(f.fileType)) {
                return <img src={f.url} alt={note.title} className="note-preview-img" />;
              }
              if (f.fileType === 'pdf') {
                return <iframe src={getPreviewUrl(f.url, 'pdf')} className="note-preview-frame" title="Note Preview" />;
              }
              if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp'].includes(f.fileType)) {
                return <iframe src={getPreviewUrl(f.url, f.fileType)} className="note-preview-frame" title="Note Preview" />;
              }
              return <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <FileText size={48} style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14, marginBottom: 8 }}>Preview not available for this file type</p>
                <p style={{ fontSize: 12 }}>Click download to view the full file</p>
              </div>;
            })()}
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
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={toggleBookmark} className="btn-rounded btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }} title="Bookmark">
                <Bookmark size={14} fill={bookmarked ? 'var(--primary)' : 'none'} color={bookmarked ? 'var(--primary)' : 'var(--text-muted)'} />
                {bookmarked ? ' Saved' : ' Save'}
              </button>
              <button onClick={() => {
                const allIndices = (note.files || []).map((_: any, i: number) => i);
                setSelectedDownloadIndices(allIndices);
                setShowDownloadPopup(true);
              }} className="btn-rounded btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}>
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
              {(user && (note.userId?._id === user.id || user.role === 'admin')) && (
                <button onClick={startEditing} className="btn-rounded btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }} title="Edit">
                  <Edit3 size={14} />
                </button>
              )}
            </div>

            <Modal open={showReport} onClose={() => setShowReport(false)} title="Report Note" width="400px">
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Help us keep the community safe</p>
              <div style={{ marginBottom: 10 }}>
                <Select
                  value={reportType}
                  onChange={(val) => setReportType(val)}
                  options={[
                    { value: '', label: 'Select type' },
                    { value: 'copyright', label: 'Copyright violation' },
                    { value: 'inappropriate', label: 'Inappropriate content' },
                    { value: 'spam', label: 'Spam' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
              <textarea className="form-input" style={{ fontSize: 13, minHeight: 80, padding: '10px 12px', marginBottom: 14, resize: 'vertical' }} placeholder="Describe the issue..." value={reportReason} onChange={e => setReportReason(e.target.value)} />
              <button onClick={handleReport} className="btn-rounded" style={{ padding: '10px 24px', fontSize: 13, backgroundColor: 'var(--danger)', color: '#fff', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} disabled={reporting}>
                <Flag size={14} />
                {reporting ? 'Submitting...' : 'Submit Report'}
              </button>
            </Modal>

            {/* Download Popup Modal */}
            <Modal open={showDownloadPopup} onClose={() => setShowDownloadPopup(false)} title="Download Files" width="520px">
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Select files to download</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {(note.files || [note]).map((f: any, i: number) => (
                  <label key={i} onClick={() => setSelectedDownloadIndices(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: selectedDownloadIndices.includes(i) ? 'var(--primary-light)' : 'var(--bg-subtle)', cursor: 'pointer', fontSize: 12, border: `2px solid ${selectedDownloadIndices.includes(i) ? 'var(--primary)' : 'transparent'}`, minWidth: 100, flex: 1, transition: 'var(--transition)' }}>
                    {selectedDownloadIndices.includes(i) ? <CheckSquare size={20} style={{ color: 'var(--primary)' }} /> : <Square size={20} style={{ color: 'var(--text-muted)' }} />}
                    <div style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>{f.fileType || 'FILE'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{f.fileSize ? `${(f.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}</div>
                  </label>
                ))}
              </div>
            <div className="note-detail-actions">
                <button onClick={() => {
                  const all = (note.files || [note]).map((_: any, i: number) => i);
                  setSelectedDownloadIndices(selectedDownloadIndices.length === all.length ? [] : all);
                }} className="btn-rounded btn-ghost" style={{ padding: '8px 16px', fontSize: 12, flex: 1 }}>
                  {selectedDownloadIndices.length === (note.files || [note]).length ? 'Deselect All' : 'Select All'}
                </button>
                <button onClick={() => handleDownload()} className="btn-rounded btn-primary" style={{ padding: '8px 16px', fontSize: 12, flex: 1, gap: 6 }}
                  disabled={selectedDownloadIndices.length === 0}>
                  <DownloadCloud size={14} /> Download ({selectedDownloadIndices.length})
                </button>
              </div>
            </Modal>

            {/* Edit Note Modal */}
            <Modal open={editing} onClose={() => setEditing(false)} title="Edit Note" width="650px">
              <div className="upload-h-row">
                <div className="upload-h-fields-col">
                  <div className="form-group">
                    <label>Title</label>
                    <input className="form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Note title" />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-input" value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Brief description..." rows={3} />
                  </div>
                  <div className="form-group">
                    <label>Resource Type</label>
                    <Select
                      value={editResourceType}
                      onChange={(val) => setEditResourceType(val)}
                      options={['study_notes', 'past_question', 'assignment', 'lab_report', 'practical_file', 'reference_book', 'syllabus', 'study_guide', 'important_question', 'mcq', 'department_resource'].map(rt => ({
                        value: rt, label: rt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                      }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Thumbnail <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional)</span></label>
                    <div onClick={() => editThumbRef.current?.click()}
                      style={{
                        border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-sm)',
                        padding: editThumbnail ? 8 : '20px', textAlign: 'center', cursor: 'pointer',
                        background: editThumbnail ? 'var(--bg-subtle)' : 'transparent',
                      }}>
                      {editThumbnail ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <img src={editThumbnailPreview} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                          <div style={{ flex: 1, textAlign: 'left', fontSize: 12 }}>
                            <div style={{ fontWeight: 600 }}>{editThumbnail.name}</div>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditThumbnail(null); setEditThumbnailPreview(''); if (editThumbRef.current) editThumbRef.current.value = ''; }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}>
                            <XCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{note?.thumbnailUrl ? 'Current thumbnail set. Click to replace.' : 'No thumbnail. Click to add one.'}</p>
                      )}
                      <input ref={editThumbRef} type="file" accept="image/*" hidden onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) { setEditThumbnail(file); setEditThumbnailPreview(URL.createObjectURL(file)); }
                      }} />
                    </div>
                  </div>
                </div>
                <div className="upload-h-dropzone">
                  <label>Files <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional — replaces existing)</span></label>
                  <div onClick={() => editFileRef.current?.click()}
                    style={{
                      border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-sm)',
                      padding: editFiles.length ? 8 : '20px', textAlign: 'center', cursor: 'pointer',
                      background: editFiles.length ? 'var(--bg-subtle)' : 'transparent',
                      minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    }}>
                    {editFiles.length ? (
                      <div style={{ textAlign: 'left', width: '100%' }}>
                        {editFiles.map((f, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{f.name}</span>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setEditFiles(prev => prev.filter((_, idx) => idx !== i)); if (editFileRef.current) editFileRef.current.value = ''; }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 2, display: 'flex' }}>
                              <XCircle size={14} />
                            </button>
                          </div>
                        ))}
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>Click to add more</p>
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{note?.files?.length ? `${note.files.length} file(s) currently. Click to replace.` : 'No files. Click to add.'}</p>
                    )}
                    <input ref={editFileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.webp" multiple hidden onChange={e => {
                      if (e.target.files) setEditFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => setEditing(false)} className="btn-rounded btn-ghost" style={{ padding: '10px 20px', fontSize: 13, flex: 1, gap: 6 }}>
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleEditSave} className="btn-rounded btn-primary" style={{ padding: '10px 20px', fontSize: 13, flex: 1, gap: 6 }} disabled={savingEdit}>
                  {savingEdit ? <><Loader2 size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
                </button>
              </div>
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
              <div><span style={{ color: 'var(--text-muted)' }}>Type</span> <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{(note.resourceType || 'study_notes').replace(/_/g, ' ')}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Uploaded by</span>
                <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {note.userId?.fullname || 'Unknown'}
                  {note.userId?.isVerified && (
                    <BadgeCheck size={13} style={{ color: 'var(--primary)' }} />
                  )}
                </span>
              </div>
              <div><span style={{ color: 'var(--text-muted)' }}>Downloads</span> <span style={{ fontWeight: 600 }}>{note.downloads || 0}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Files</span> <span style={{ fontWeight: 600 }}>{(note.files || []).length}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Total size</span> <span style={{ fontWeight: 600 }}>{(note.files || []).reduce((s: number, f: any) => s + (f.fileSize || 0), 0) ? `${((note.files || []).reduce((s: number, f: any) => s + (f.fileSize || 0), 0) / 1024 / 1024).toFixed(1)} MB` : 'N/A'}</span></div>
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

      {relatedNotes.length > 0 && (
        <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Related Resources</h2>
            {note.subjectId && (
              <Link to={`/subjects/${note.subjectId._id}`}
                style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ArrowRight size={14} />
              </Link>
            )}
          </div>
          <div className="hierarchy-grid related-grid">
            {relatedNotes.map((rn: any) => {
              const palette = [
                { bg: 'var(--palette-0-bg)', color: 'var(--palette-0)' },
                { bg: 'var(--palette-1-bg)', color: 'var(--palette-1)' },
              ];
              const c = palette[relatedNotes.indexOf(rn) % palette.length];
              const rft = rn.files?.[0]?.fileType || rn.fileType;
              const thumbUrl = getThumbnailUrl(rn.files?.[0]?.url || rn.cloudinaryUrl, rft, rn.thumbnailUrl);
              return (
                <Link key={rn._id} to={`/notes/${rn._id}`} className="hierarchy-card"
                  style={{ borderLeftColor: c.color, textDecoration: 'none', color: 'inherit', minHeight: 100 }}>
                  {thumbUrl ? (
                    <div style={{
                      width: '100%', height: 80, overflow: 'hidden', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      background: 'var(--bg-subtle)',
                    }}>
                      <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <FileTypePlaceholder fileType={rft} height={80} />
                  )}
                  <div style={{ padding: '12px' }}>
                    <span className="hierarchy-card-badge" style={{ color: c.color, textTransform: 'capitalize' }}>
                      {(rn.resourceType || 'study_notes').replace(/_/g, ' ')}
                    </span>
                    <div className="hierarchy-card-title" style={{ marginTop: 4, fontSize: 13 }}>{rn.title}</div>
                    <div className="hierarchy-card-sub" style={{ marginTop: 2, fontSize: 11 }}>
                      {rn.userId?.fullname && <>by {rn.userId.fullname}</>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
