import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { noteApi } from '../../api/note';
import { universityApi } from '../../api/university';
import { courseApi } from '../../api/course';
import { semesterApi } from '../../api/semester';
import { subjectApi } from '../../api/subject';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';
import { Upload as UploadIcon, ChevronLeft, ChevronRight, Building2, BookOpen, Library, BookMarked, Loader2, XCircle, Search } from 'lucide-react';
import FileTypePlaceholder from '../../components/ui/FileTypePlaceholder';
import Select from '../../components/ui/Select';
import SEO from '../../components/seo/SEO';

interface HierarchyItem {
  _id: string; name?: string; title?: string; code?: string;
}

const hierarchySteps = [
  { type: 'universities', label: 'University', icon: Building2 },
  { type: 'courses', label: 'Course', icon: BookOpen },
  { type: 'semesters', label: 'Semester', icon: Library },
  { type: 'subjects', label: 'Subject', icon: BookMarked },
];

const cardPalette = [
  { bg: 'var(--palette-0-bg)', color: 'var(--palette-0)' },
  { bg: 'var(--palette-1-bg)', color: 'var(--palette-1)' },
  { bg: 'var(--palette-2-bg)', color: 'var(--palette-2)' },
  { bg: 'var(--palette-3-bg)', color: 'var(--palette-3)' },
  { bg: 'var(--palette-4-bg)', color: 'var(--palette-4)' },
  { bg: 'var(--palette-5-bg)', color: 'var(--palette-5)' },
];

type ViewMode = 'select' | 'upload';

export default function Upload() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState('study_notes');
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<ViewMode>('select');
  const [hLevel, setHLevel] = useState(0);
  const [hItems, setHItems] = useState<HierarchyItem[]>([]);
  const [hLoading, setHLoading] = useState(false);
  const [selectedPath, setSelectedPath] = useState<{ type: string; id: string; name: string }[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [hSearch, setHSearch] = useState('');

  const loadLevel = useCallback((type: string, parentId?: string) => {
    setHLoading(true);
    let promise: Promise<any> = Promise.resolve({ data: { data: [] } });
    switch (type) {
      case 'universities': promise = universityApi.list(); break;
      case 'courses': promise = courseApi.list(parentId); break;
      case 'semesters': promise = semesterApi.list(parentId); break;
      case 'subjects': promise = subjectApi.list(parentId); break;
      default: promise = Promise.resolve({ data: { data: [] } });
    }
    promise.then(res => {
      const d = res.data.data;
      setHItems(Array.isArray(d) ? d : d.items || []);
    }).catch(() => setHItems([])).finally(() => setHLoading(false));
  }, []);

  useEffect(() => { loadLevel('universities'); }, []);

  const handleLevelClick = (item: HierarchyItem) => {
    const step = hierarchySteps[hLevel];
    const newPath = [...selectedPath.slice(0, hLevel), { type: step.type, id: item._id, name: item.name || item.title || '' }];
    setSelectedPath(newPath);
    setHSearch('');

    if (hLevel < 3) {
      const nextLevel = hLevel + 1;
      setHLevel(nextLevel);
      setHItems([]);
      loadLevel(hierarchySteps[nextLevel].type, item._id);
    }

    if (hLevel === 3) {
      setSelectedSubjectId(item._id);
      setView('upload');
    }
  };

  const handleBack = () => {
    if (hLevel > 0) {
      const newLevel = hLevel - 1;
      setHLevel(newLevel);
      setHSearch('');
      const prevPath = selectedPath[newLevel - 1];
      if (prevPath) {
        loadLevel(hierarchySteps[newLevel].type, newLevel >= 1 ? selectedPath[newLevel - 2]?.id : undefined);
      }
    }
  };

  const goBackToSelect = () => {
    setTitle(''); setDescription(''); setResourceType('study_notes'); setFiles([]);
    setView('select'); setHLevel(3);
  };

  const goToLevel = (targetLevel: number) => {
    if (targetLevel < hLevel) {
      const newPath = selectedPath.slice(0, targetLevel);
      setSelectedPath(newPath);
      setHLevel(targetLevel);
      setHItems([]);
      setHSearch('');
      loadLevel(hierarchySteps[targetLevel].type, targetLevel >= 1 ? newPath[targetLevel - 1]?.id : undefined);
    }
  };

  const filteredHItems = hItems.filter(item => {
    if (!hSearch.trim()) return true;
    const q = hSearch.toLowerCase();
    const name = (item.name || item.title || '').toLowerCase();
    const code = (item.code || '').toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length || !selectedSubjectId || !title) {
      showToast('error', 'Please fill all required fields and select at least one file');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    if (thumbnail) formData.append('thumbnail', thumbnail);
    formData.append('subjectId', selectedSubjectId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('resourceType', resourceType);
    try {
      await noteApi.create(formData);
      showToast('success', 'Note uploaded successfully! Awaiting admin approval.');
      navigate('/user/my-notes');
    } catch (err: any) {
      showToast('error', getApiError(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const currentStep = hierarchySteps[hLevel];

  const renderSelector = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <nav className="breadcrumb" style={{ flex: 1, minWidth: 0 }}>
          {hLevel > 0 && (
            <button onClick={handleBack} className="btn-rounded btn-ghost" style={{ padding: '6px 8px', flexShrink: 0, fontSize: 12 }}>
              <ChevronLeft size={14} />
            </button>
          )}
          <button onClick={() => navigate('/user/my-notes')} className={`bc-item-btn ${selectedPath.length === 0 ? 'bc-active' : ''}`}>
            All Notes
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
        <button onClick={() => navigate('/user/my-notes')} className="btn-rounded btn-ghost" style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}>Cancel</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="search-bar" style={{ maxWidth: '100%' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder={`Search ${currentStep.type}...`}
            value={hSearch}
            onChange={e => setHSearch(e.target.value)}
          />
        </div>
      </div>

      {hLoading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
      ) : filteredHItems.length === 0 ? (
        <div className="empty-state"><currentStep.icon size={48} /><h3>No {currentStep.type} found</h3></div>
      ) : (
        <div className="hierarchy-grid">
          {filteredHItems.map((item, i) => {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <nav className="breadcrumb" style={{ flex: 1, minWidth: 0 }}>
          <button onClick={goBackToSelect} className="btn-rounded btn-ghost" style={{ padding: '6px 8px', flexShrink: 0, fontSize: 12 }}>
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
        <button onClick={() => navigate('/user/my-notes')} className="btn-rounded btn-ghost" style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}>Cancel</button>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="upload-h-row">
          <div className="upload-h-fields-col">
            <div className="form-group">
              <label>Title <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Unit 1: Computer Fundamentals" required autoComplete="off" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the notes..." rows={4} autoComplete="off" />
            </div>
            <div className="form-group">
              <label>Resource Type <span style={{ color: 'var(--danger)' }}>*</span></label>
              <Select
                value={resourceType}
                onChange={(val) => setResourceType(val)}
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
                        <UploadIcon size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
                    <UploadIcon size={22} />
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
            {uploading ? <><Loader2 size={16} className="spin" /> Uploading...</> : <><UploadIcon size={18} /> Upload Note</>}
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
      <SEO title="Upload Note" description="Upload your study notes to share with other students" />
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, fontFamily: 'var(--font-heading)' }}>Upload Note</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
        {view === 'select' ? 'Browse to select a subject for your note' : 'Fill in the details and upload your PDF'}
      </p>

      {view === 'select' && renderSelector()}
      {view === 'upload' && renderUploadForm()}
    </div>
  );
}
