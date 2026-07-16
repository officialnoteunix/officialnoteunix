import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { noteApi } from '../../api/note';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { FileText, Upload, Edit3, Save, Loader2, XCircle, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';
import { getThumbnailUrl } from '../../utils/cloudinary';
import FileTypePlaceholder from '../../components/ui/FileTypePlaceholder';
import Select from '../../components/ui/Select';

const palette = [
  { bg: 'var(--palette-0-bg)', color: 'var(--palette-0)' },
  { bg: 'var(--palette-1-bg)', color: 'var(--palette-1)' },
  { bg: 'var(--palette-2-bg)', color: 'var(--palette-2)' },
  { bg: 'var(--palette-3-bg)', color: 'var(--palette-3)' },
  { bg: 'var(--palette-4-bg)', color: 'var(--palette-4)' },
  { bg: 'var(--palette-5-bg)', color: 'var(--palette-5)' },
];

export default function MyNotes() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [editTarget, setEditTarget] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editResourceType, setEditResourceType] = useState('study_notes');
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);
  const editThumbRef = useRef<HTMLInputElement>(null);

  const fetchNotes = (p = 1) => {
    setLoading(true);
    noteApi.my(p, 9)
      .then(res => { setNotes(res.data.data.items); setPage(res.data.data.page); setTotalPages(res.data.data.totalPages); setTotal(res.data.data.total); })
      .catch(err => showToast('error', getApiError(err, 'Failed to load notes')))
      .finally(() => setLoading(false));
  };

  const handleEditSave = async () => {
    if (!editTarget || !editTitle.trim()) { showToast('error', 'Title is required'); return; }
    setSavingEdit(true);
    try {
      const fd = new FormData();
      fd.append('title', editTitle);
      fd.append('description', editDesc);
      fd.append('resourceType', editResourceType);
      editFiles.forEach(f => fd.append('files', f));
      if (editThumbnail) fd.append('thumbnail', editThumbnail);
      const res = await noteApi.update(editTarget._id, fd);
      setNotes(prev => prev.map(n => n._id === editTarget._id ? res.data.data : n));
      setEditTarget(null);
      showToast('success', 'Note updated');
    } catch (err) { showToast('error', getApiError(err, 'Failed to update note')); }
    finally { setSavingEdit(false); }
  };

  const startEdit = (note: any) => {
    setEditTarget(note);
    setEditTitle(note.title);
    setEditDesc(note.description || '');
    setEditResourceType(note.resourceType || 'study_notes');
    setEditFiles([]);
    setEditThumbnail(null);
    setEditThumbnailPreview('');
  };

  useEffect(() => { fetchNotes(); }, []);

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex-wrap" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', margin: 0 }}>My Notes</h1>
        <Link to="/user/upload" className="btn-rounded btn-primary" style={{ padding: '10px 20px', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={16} />
          Upload Note
        </Link>
      </div>
      {notes.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No notes uploaded</h3>
          <p>Upload your first note to share with others.</p>
          <Link to="/user/upload" className="btn-rounded btn-primary" style={{ marginTop: 16, padding: '12px 24px', fontSize: 13, textDecoration: 'none' }}>
            Upload Note
          </Link>
        </div>
      ) : (
        <>
          <div className="hierarchy-grid">
            {notes.map((note, i) => {
              const c = palette[i % palette.length];
              const ft = note.files?.[0]?.fileType || note.fileType;
              const thumbUrl = getThumbnailUrl(note.files?.[0]?.url || note.cloudinaryUrl, ft, note.thumbnailUrl);
              return (
                <div key={note._id} className="hierarchy-card"
                  style={{ borderLeftColor: c.color, textDecoration: 'none', color: 'inherit', position: 'relative' }}>
                  <Link to={`/notes/${note._id}`} style={{ display: 'flex', gap: 12, height: '100%', textDecoration: 'none', color: 'inherit' }}>
                    {thumbUrl ? (
                    <div style={{
                      width: 72, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                      backgroundImage: `url(${thumbUrl})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }} />
                    ) : (
                    <div style={{ width: 72, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-subtle)' }}>
                      <FileTypePlaceholder fileType={ft} height={100} />
                    </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '2px 0' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                        <span className="hierarchy-card-badge" style={{ color: c.color }}>
                          {note.approved ? 'Approved' : 'Pending'}
                        </span>
                        {note.subjectId && (
                          <span style={{ fontSize: 10, color: 'var(--text-light)' }}>
                            {note.subjectId.name}
                          </span>
                        )}
                      </div>
                      <div className="hierarchy-card-title">{note.title}</div>
                      <div className="hierarchy-card-sub" style={{ flex: 1 }}>
                        {note.description || 'No description'}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-light)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                </Link>
                <button onClick={(e) => { e.stopPropagation(); startEdit(note); }}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'var(--bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: 4, display: 'flex', opacity: 0.7, transition: 'var(--transition)' }}
                  onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                  onMouseOut={e => (e.currentTarget.style.opacity = '0.7')}
                  title="Edit note">
                  <Edit3 size={13} />
                </button>
              </div>
            );
          })}
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={fetchNotes} />

        <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Note" width="650px">
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
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{editTarget?.thumbnailUrl ? 'Current thumbnail set. Click to replace.' : 'No thumbnail. Click to add one.'}</p>
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
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{editTarget?.files?.length ? `${editTarget.files.length} file(s) currently. Click to replace.` : 'No files. Click to add.'}</p>
                )}
                <input ref={editFileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.webp" multiple hidden onChange={e => {
                  if (e.target.files) setEditFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setEditTarget(null)} className="btn-rounded btn-ghost" style={{ padding: '10px 20px', fontSize: 13, flex: 1, gap: 6 }}>
              <X size={14} /> Cancel
            </button>
            <button onClick={handleEditSave} className="btn-rounded btn-primary" style={{ padding: '10px 20px', fontSize: 13, flex: 1, gap: 6 }} disabled={savingEdit}>
              {savingEdit ? <><Loader2 size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save</>}
            </button>
          </div>
        </Modal>
      </>
    )}
  </div>
);
}
