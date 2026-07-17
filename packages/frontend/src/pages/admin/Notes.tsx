import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { universityApi } from '../../api/university';
import { courseApi } from '../../api/course';
import { semesterApi } from '../../api/semester';
import { subjectApi } from '../../api/subject';
import { useToast } from '../../context/ToastContext';
import { emitStatsRefresh } from '../../utils/statsRefresh';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import DetailModal from '../../components/ui/DetailModal';
import Pagination from '../../components/ui/Pagination';
import Select from '../../components/ui/Select';
import type { Note, PaginatedData, APIResponse } from '../../types';
import {
  FileText, CheckCircle, XCircle, Upload, Filter, Loader2,
  ChevronLeft, ChevronRight, Building2, BookOpen, Library, BookMarked, Edit3, Save,
} from 'lucide-react';
import { getApiError } from '../../utils/constants';

const RESOURCE_TYPES = [
  { value: 'study_notes', label: 'Study Notes' },
  { value: 'past_question', label: 'Past Question' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'practical_file', label: 'Practical File' },
  { value: 'reference_book', label: 'Reference Book' },
  { value: 'syllabus', label: 'Syllabus' },
  { value: 'study_guide', label: 'Study Guide' },
  { value: 'important_question', label: 'Important Question' },
  { value: 'mcq', label: 'MCQ' },
  { value: 'department_resource', label: 'Department Resource' },
];

interface HierarchyItem {
  _id: string; name?: string; title?: string; code?: string;
}

interface NoteDetailData extends Note {
  userId?: { _id: string; fullname: string; avatar: string | null; isVerified?: boolean };
  subjectId?: { _id: string; name: string };
}

const hierarchySteps = [
  { type: 'universities', label: 'University', icon: Building2, color: 'var(--palette-0)', bg: 'var(--palette-0-bg)' },
  { type: 'courses', label: 'Course', icon: BookOpen, color: 'var(--palette-1)', bg: 'var(--palette-1-bg)' },
  { type: 'semesters', label: 'Semester', icon: Library, color: 'var(--palette-2)', bg: 'var(--palette-2-bg)' },
  { type: 'subjects', label: 'Subject', icon: BookMarked, color: 'var(--palette-3)', bg: 'var(--palette-3-bg)' },
];

const cardPalette = [
  { bg: 'var(--palette-0-bg)', color: 'var(--palette-0)' },
  { bg: 'var(--palette-1-bg)', color: 'var(--palette-1)' },
  { bg: 'var(--palette-2-bg)', color: 'var(--palette-2)' },
  { bg: 'var(--palette-3-bg)', color: 'var(--palette-3)' },
  { bg: 'var(--palette-4-bg)', color: 'var(--palette-4)' },
  { bg: 'var(--palette-5-bg)', color: 'var(--palette-5)' },
];

type ViewMode = 'table' | 'select' | 'upload';

export default function Notes() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<NoteDetailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('false');
  const [view, setView] = useState<ViewMode>('table');
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NoteDetailData | null>(null);
  const [detailTarget, setDetailTarget] = useState<NoteDetailData | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const thumbRef = useRef<HTMLInputElement>(null);

  const [editTarget, setEditTarget] = useState<NoteDetailData | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editResourceType, setEditResourceType] = useState('study_notes');
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);
  const editThumbRef = useRef<HTMLInputElement>(null);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadResourceType, setUploadResourceType] = useState('study_notes');

  const [hLevel, setHLevel] = useState(0);
  const [hItems, setHItems] = useState<HierarchyItem[]>([]);
  const [hLoading, setHLoading] = useState(false);
  const [selectedPath, setSelectedPath] = useState<{ type: string; id: string; name: string }[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const [notePage, setNotePage] = useState(1);
  const [noteTotalPages, setNoteTotalPages] = useState(1);
  const [noteTotal, setNoteTotal] = useState(0);

  const fetchNotes = useCallback((approved: string, p = 1) => {
    setLoading(true);
    adminApi.notes(approved === 'true' ? true : approved === 'false' ? false : undefined, p, 5)
      .then(res => {
        const d = res.data.data as PaginatedData<NoteDetailData>;
        setNotes(d.items); setNotePage(d.page); setNoteTotalPages(d.totalPages); setNoteTotal(d.total);
      })
      .catch(err => showToast('error', getApiError(err, 'Failed to load notes')))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { setNotePage(1); fetchNotes(filter, 1); }, [filter, fetchNotes]);

  const approve = useCallback(async (id: string) => {
    try { await adminApi.approveNote(id); showToast('success', 'Note approved'); fetchNotes(filter, notePage); emitStatsRefresh(); }
    catch (err) { showToast('error', getApiError(err, 'Failed to approve note')); }
  }, [filter, notePage, fetchNotes, showToast]);

  const deleteNote = useCallback(async () => {
    if (!deleteTarget) return;
    try { await adminApi.deleteNote(deleteTarget._id); showToast('success', 'Note deleted'); setDeleteTarget(null); fetchNotes(filter, notePage); emitStatsRefresh(); }
    catch (err) { showToast('error', getApiError(err, 'Failed to delete note')); }
  }, [deleteTarget, filter, notePage, fetchNotes, showToast]);

  const loadLevel = useCallback((type: string, parentId?: string) => {
    setHLoading(true);
    const promiseMap: Record<string, (id?: string) => Promise<any>> = {
      universities: universityApi.list,
      courses: courseApi.list,
      semesters: semesterApi.list,
      subjects: subjectApi.list,
    };
    const promise = promiseMap[type]?.(parentId) ?? Promise.resolve({ data: { data: [] } });
    promise.then(r => {
      const d = r.data.data;
      setHItems(Array.isArray(d) ? d : d.items || []);
    }).catch(() => setHItems([])).finally(() => setHLoading(false));
  }, []);

  const startUpload = () => {
    setView('select');
    setHLevel(0); setSelectedPath([]); setSelectedSubjectId('');
    setUploadTitle(''); setUploadDesc(''); setUploadResourceType('study_notes');
    loadLevel('universities');
  };

  const handleLevelClick = (item: HierarchyItem) => {
    const newPath = [...selectedPath.slice(0, hLevel), { type: hierarchySteps[hLevel].type, id: item._id, name: item.name || item.title || '' }];
    setSelectedPath(newPath);
    if (hLevel < 3) {
      const nl = hLevel + 1;
      setHLevel(nl);
      setHItems([]);
      loadLevel(hierarchySteps[nl].type, item._id);
    }
    if (hLevel === 3) {
      setSelectedSubjectId(item._id);
      setView('upload');
    }
  };

  const goBackToSelect = () => {
    setView('select'); setHLevel(3); setUploadTitle(''); setUploadDesc(''); setUploadResourceType('study_notes'); setFiles([]);
  };

  const handleBack = () => {
    if (hLevel > 0) {
      const nl = hLevel - 1;
      setHLevel(nl);
      const prev = selectedPath[nl - 1];
      if (prev) loadLevel(hierarchySteps[nl].type, nl >= 1 ? selectedPath[nl - 2]?.id : undefined);
    }
  };

  const goToLevel = (targetLevel: number) => {
    if (targetLevel < hLevel) {
      const newPath = selectedPath.slice(0, targetLevel);
      setSelectedPath(newPath);
      setHLevel(targetLevel);
      setHItems([]);
      loadLevel(hierarchySteps[targetLevel].type, targetLevel >= 1 ? newPath[targetLevel - 1]?.id : undefined);
    }
  };

  const cancelUpload = () => {
    setView('table'); setSelectedPath([]); setSelectedSubjectId('');
    setUploadTitle(''); setUploadDesc(''); setUploadResourceType('study_notes'); setFiles([]);
    setThumbnail(null); setThumbnailPreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !files.length) {
      showToast('error', 'Select a subject and at least one file'); return;
    }
    setUploading(true);
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    if (thumbnail) fd.append('thumbnail', thumbnail);
    fd.append('subjectId', selectedSubjectId);
    fd.append('title', uploadTitle);
    fd.append('description', uploadDesc);
    fd.append('resourceType', uploadResourceType);
    try {
      await adminApi.createNote(fd);
      showToast('success', 'Note uploaded successfully');
      emitStatsRefresh();
      setView('table'); setSelectedPath([]); setSelectedSubjectId('');
      setUploadTitle(''); setUploadDesc(''); setUploadResourceType('study_notes');
      setFiles([]); setThumbnail(null); setThumbnailPreview('');
      if (fileRef.current) fileRef.current.value = '';
      fetchNotes(filter, notePage);
    } catch (err) { showToast('error', getApiError(err, 'Upload failed')); }
    finally { setUploading(false); }
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setSavingEdit(true);
    try {
      const fd = new FormData();
      fd.append('title', editTitle);
      fd.append('description', editDesc);
      fd.append('resourceType', editResourceType);
      editFiles.forEach(f => fd.append('files', f));
      if (editThumbnail) fd.append('thumbnail', editThumbnail);
      await adminApi.updateNote(editTarget._id, fd);
      showToast('success', 'Note updated');
      setEditTarget(null);
      fetchNotes(filter, notePage);
    } catch (err) { showToast('error', getApiError(err, 'Update failed')); }
    finally { setSavingEdit(false); }
  };

  const startEdit = (note: NoteDetailData) => {
    setEditTarget(note);
    setEditTitle(note.title);
    setEditDesc(note.description || '');
    setEditResourceType(note.resourceType || 'study_notes');
    setEditFiles([]);
    setEditThumbnail(null);
    setEditThumbnailPreview('');
  };

  const currentStep = hierarchySteps[hLevel];

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  const renderTable = () => (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[{ key: 'false', label: 'Pending' }, { key: '', label: 'All' }, { key: 'true', label: 'Approved' }].map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); }}
            className={`btn-rounded ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 16px', fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}
          >{f.key === 'false' && <Filter size={12} />}{f.label}</button>
        ))}
      </div>

      {notes.length === 0 ? (
        <div className="empty-state"><FileText size={48} /><h3>No notes found</h3></div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Title</th><th>Uploaded By</th><th>Subject</th><th>Downloads</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {notes.map(note => (
                  <tr key={note._id} onClick={() => window.innerWidth <= 640 && setDetailTarget(note)}>
                    <td data-card-title style={{ fontWeight: 600, fontSize: 13 }}><Link to={`/notes/${note._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{note.title}</Link></td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <div className="user-avatar" style={{ width: 26, height: 26, fontSize: 10, background: note.userId?.avatar ? `url(${note.userId.avatar}) center/cover` : undefined, color: note.userId?.avatar ? 'transparent' : undefined }}>{note.userId?.avatar ? '' : (note.userId?.fullname?.charAt(0) || '?')}</div>
                      {note.userId?.fullname || 'Unknown'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{note.subjectId?.name || '-'}</td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{note.downloads || 0}</td>
                    <td><span className={`badge ${note.approved ? 'badge-secondary' : 'badge-warning'}`}>{note.approved ? 'Approved' : 'Pending'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!note.approved && (
                          <button onClick={() => approve(note._id)} className="btn-rounded btn-secondary" style={{ padding: '6px 12px', fontSize: 11, display: 'flex', gap: 4, alignItems: 'center' }}>
                            <CheckCircle size={12} /> Approve
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(note)} className="btn-rounded" style={{ padding: '6px 12px', fontSize: 11, backgroundColor: 'var(--danger)', color: '#fff', display: 'flex', gap: 4, alignItems: 'center' }}>
                          <XCircle size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={notePage} totalPages={noteTotalPages} total={noteTotal} onPageChange={(p) => fetchNotes(filter, p)} />
        </>
      )}
    </>
  );

  const renderSelector = () => (
    <div>
        <nav className="breadcrumb" style={{ flex: 1, minWidth: 0 }}>
          {hLevel > 0 && (
            <button onClick={handleBack} className="btn-rounded btn-ghost" style={{ padding: '6px 8px', flexShrink: 0, fontSize: 12, marginRight: 4 }}>
              <ChevronLeft size={14} />
            </button>
          )}
          <button onClick={cancelUpload} className={`bc-item-btn ${selectedPath.length === 0 ? 'bc-active' : ''}`}>
            All {currentStep.type}
          </button>
          {selectedPath.length > 2 && (
            <>
              <span className="bc-sep bc-mobile-hidden"><ChevronRight size={12} /></span>
              <span className="bc-ellipsis">
                <span className="bc-sep"><ChevronRight size={12} /></span>
                <span style={{ color: 'var(--text-light)', fontSize: 13 }}>…</span>
              </span>
            </>
          )}
          {selectedPath.map((item, i) => {
            const isLast = i === selectedPath.length - 1;
            const mobileHidden = selectedPath.length > 2 && !isLast ? 'bc-mobile-hidden' : '';
            return (
              <span key={i} className={mobileHidden} style={{ display: 'flex', alignItems: 'center' }}>
                <span className={`bc-sep ${mobileHidden}`}><ChevronRight size={12} /></span>
                <button onClick={() => goToLevel(i + 1)} className={`bc-item-btn ${isLast ? 'bc-active' : ''}`}>
                  {item.name}
                </button>
              </span>
            );
          })}
        </nav>
        <button onClick={cancelUpload} className="btn-rounded btn-ghost" style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}>Cancel</button>

      {hLoading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
      ) : hItems.length === 0 ? (
        <div className="empty-state"><currentStep.icon size={48} /><h3>No {currentStep.type} found</h3></div>
      ) : (
        <div className="hierarchy-grid">
          {hItems.map((item, i) => {
            const c = cardPalette[i % cardPalette.length];
            return (
              <button key={item._id} onClick={() => handleLevelClick(item)} className="hierarchy-card"
                style={{ borderLeftColor: c.color } as React.CSSProperties}>
                <span className="hierarchy-card-badge" style={{ color: c.color }}>
                  {currentStep.label}
                </span>
                <div className="hierarchy-card-title">{item.name || item.title}</div>
                <div className="hierarchy-card-sub">{item.code || ''}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderUploadForm = () => (
    <div>
        <nav className="breadcrumb" style={{ flex: 1, minWidth: 0 }}>
          <button onClick={goBackToSelect} className="btn-rounded btn-ghost" style={{ padding: '6px 8px', flexShrink: 0, fontSize: 12, marginRight: 4 }}>
            <ChevronLeft size={14} />
          </button>
          {selectedPath.map((item, i) => {
            const isLast = i === selectedPath.length - 1;
            return (
              <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <span className="bc-sep"><ChevronRight size={12} /></span>}
                <span className={`bc-item-btn ${isLast ? 'bc-active' : ''}`} style={{ cursor: 'default' }}>
                  {item.name}
                </span>
              </span>
            );
          })}
        </nav>
        <button onClick={cancelUpload} className="btn-rounded btn-ghost" style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}>Cancel</button>

      <form onSubmit={handleUpload} autoComplete="off">
        <div className="upload-h-row">
          <div className="upload-h-fields-col">
            <div className="form-group">
              <label>Title <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-input" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="e.g. Unit 1: Computer Fundamentals" required autoComplete="off" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-input" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="Brief description of the notes..." rows={4} autoComplete="off" />
            </div>
            <div className="form-group">
              <label>Resource Type <span style={{ color: 'var(--danger)' }}>*</span></label>
              <Select
                value={uploadResourceType}
                onChange={(val) => setUploadResourceType(val)}
                options={RESOURCE_TYPES}
              />
            </div>
          </div>
          <div className="upload-h-dropzone">
            <label>Files <span style={{ color: 'var(--danger)' }}>*</span></label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
              onDrop={e => { e.preventDefault(); setDragOver(false); setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
              onClick={() => fileRef.current?.click()}
              className={`upload-dropzone ${dragOver ? 'drag-over' : ''} ${files.length ? 'has-file' : ''}`}
            >
              {files.length ? (
                <div style={{ textAlign: 'left', width: '100%', padding: 8 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                        <FileText size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)); if (fileRef.current) fileRef.current.value = ''; }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 2, display: 'flex' }}>
                          <XCircle size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>Click or drop to add more</p>
                </div>
              ) : (
                <>
                  <div className="upload-dropzone-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    <Upload size={22} />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)', marginBottom: 4 }}>Drop files here</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>or click to browse (max 10 MB each)</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.webp" multiple hidden onChange={e => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} />
            </div>
          </div>
          <div className="upload-h-dropzone" style={{ marginTop: 12 }}>
            <label>Thumbnail <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional)</span></label>
            <div onClick={() => thumbRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-sm)',
                padding: thumbnail ? 8 : '20px', textAlign: 'center', cursor: 'pointer',
                background: thumbnail ? 'var(--bg-subtle)' : 'transparent',
              }}>
              {thumbnail ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={thumbnailPreview} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                  <div style={{ flex: 1, textAlign: 'left', fontSize: 12 }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thumbnail.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{(thumbnail.size / 1024 / 1024).toFixed(1)} MB</div>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setThumbnail(null); setThumbnailPreview(''); if (thumbRef.current) thumbRef.current.value = ''; }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}>
                    <XCircle size={14} />
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click to select a thumbnail image (optional)</p>
              )}
              <input ref={thumbRef} type="file" accept="image/*" hidden onChange={e => {
                const file = e.target.files?.[0];
                if (file) { setThumbnail(file); setThumbnailPreview(URL.createObjectURL(file)); }
              }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, paddingTop: 24, borderTop: '1px solid var(--border-color)', marginTop: 24 }}>
          <button type="submit" className="btn-rounded btn-primary" style={{ padding: '12px 32px', fontSize: 14, gap: 8 }} disabled={uploading}>
            {uploading ? <><Loader2 size={16} className="spin" /> Uploading...</> : <><Upload size={18} /> Upload Note</>}
          </button>
          <button type="button" onClick={() => { setFiles([]); if (fileRef.current) fileRef.current.value = ''; }} className="btn-rounded btn-ghost" style={{ padding: '12px 24px', fontSize: 14 }} disabled={files.length === 0 || uploading}>
            Clear Files
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div>
      <div className="flex-wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Notes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {view === 'table' ? `${noteTotal} notes found` : view === 'select' ? 'Browse to select a subject' : 'Fill in the details and upload'}
          </p>
        </div>
        {view === 'table' && (
          <button onClick={startUpload} className="btn-rounded btn-primary" style={{ padding: '10px 20px', fontSize: 13, display: 'flex', gap: 6 }}>
            <Upload size={15} /> Upload Note
          </button>
        )}
      </div>

      {view === 'table' && renderTable()}
      {view === 'select' && renderSelector()}
      {view === 'upload' && renderUploadForm()}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteNote}
        title="Delete Note"
        message={`Permanently delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      <DetailModal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.title || ''}
        fields={[
          { label: 'Uploaded By', value: detailTarget?.userId?.fullname || 'Unknown' },
          { label: 'Subject', value: detailTarget?.subjectId?.name || '-' },
          { label: 'Downloads', value: detailTarget?.downloads || 0 },
          { label: 'Status', value: detailTarget?.approved ? 'Approved' : 'Pending' },
        ]}
      >
        {detailTarget && (
          <button onClick={() => { const n = detailTarget; setDetailTarget(null); startEdit(n); }} className="btn-rounded btn-ghost" style={{ padding: '7px 14px', fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
            <Edit3 size={13} /> Edit
          </button>
        )}
        {detailTarget && !detailTarget.approved && (
          <button onClick={() => { setDetailTarget(null); approve(detailTarget._id); }} className="btn-rounded btn-secondary" style={{ padding: '7px 14px', fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
            <CheckCircle size={13} /> Approve
          </button>
        )}
        {detailTarget && (
          <button onClick={() => { setDetailTarget(null); setDeleteTarget(detailTarget); }} className="btn-rounded" style={{ padding: '7px 14px', fontSize: 12, backgroundColor: 'var(--danger)', color: '#fff', display: 'flex', gap: 4, alignItems: 'center' }}>
            <XCircle size={13} /> Delete
          </button>
        )}
      </DetailModal>

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
                options={RESOURCE_TYPES}
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
          <button onClick={() => setEditTarget(null)} className="btn-rounded btn-ghost" style={{ padding: '10px 20px', fontSize: 13, flex: 1 }}>
            Cancel
          </button>
          <button onClick={handleEditSave} className="btn-rounded btn-primary" style={{ padding: '10px 20px', fontSize: 13, flex: 1, gap: 6 }} disabled={savingEdit}>
            {savingEdit ? <><Loader2 size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
