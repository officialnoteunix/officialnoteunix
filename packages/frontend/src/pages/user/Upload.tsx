import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { noteApi } from '../../api/note';
import { universityApi } from '../../api/university';
import { courseApi } from '../../api/course';
import { semesterApi } from '../../api/semester';
import { subjectApi } from '../../api/subject';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';
import { Upload as UploadIcon, ChevronLeft, Building2, BookOpen, Library, BookMarked, Loader2 } from 'lucide-react';
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [view, setView] = useState<ViewMode>('select');
  const [hLevel, setHLevel] = useState(0);
  const [hItems, setHItems] = useState<HierarchyItem[]>([]);
  const [hLoading, setHLoading] = useState(false);
  const [selectedPath, setSelectedPath] = useState<{ type: string; id: string; name: string }[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

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
      const prevPath = selectedPath[newLevel - 1];
      if (prevPath) {
        loadLevel(hierarchySteps[newLevel].type, newLevel >= 1 ? selectedPath[newLevel - 2]?.id : undefined);
      }
    }
  };

  const goBackToSelect = () => {
    setTitle(''); setDescription(''); setFile(null);
    setView('select'); setHLevel(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedSubjectId || !title) {
      showToast('error', 'Please fill all required fields');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subjectId', selectedSubjectId);
    formData.append('title', title);
    formData.append('description', description);
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          {hLevel > 0 && (
            <button onClick={handleBack} className="btn-rounded btn-ghost" style={{ padding: '8px 12px', flexShrink: 0, fontSize: 12, marginRight: 4 }}>
              <ChevronLeft size={14} />
            </button>
          )}
          <button onClick={() => navigate('/user/my-notes')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectedPath.length === 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: selectedPath.length === 0 ? 700 : 400, padding: 0, fontSize: 13 }}>
            All {currentStep.type}
          </button>
          {selectedPath.map((item, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--text-light)', fontSize: 13 }}>/</span>
              <span style={{ color: i === selectedPath.length - 1 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === selectedPath.length - 1 ? 700 : 400 }}>
                {item.name}
              </span>
            </span>
          ))}
        </div>
        <button onClick={() => navigate('/user/my-notes')} className="btn-rounded btn-ghost" style={{ padding: '8px 14px', fontSize: 12, marginLeft: 'auto' }}>Cancel</button>
      </div>

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
                <span className="hierarchy-card-badge" style={{ background: c.bg, color: c.color }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <button onClick={goBackToSelect} className="btn-rounded btn-ghost" style={{ padding: '8px 12px', flexShrink: 0, fontSize: 12, marginRight: 4 }}>
            <ChevronLeft size={14} />
          </button>
          {selectedPath.map((item, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--text-light)', fontSize: 13 }}>/</span>
              <span style={{ color: i === selectedPath.length - 1 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === selectedPath.length - 1 ? 700 : 400 }}>{item.name}</span>
            </span>
          ))}
        </div>
        <button onClick={() => navigate('/user/my-notes')} className="btn-rounded btn-ghost" style={{ padding: '8px 14px', fontSize: 12, marginLeft: 'auto' }}>Cancel</button>
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
          </div>
          <div className="upload-h-dropzone">
            <label>PDF File <span style={{ color: 'var(--danger)' }}>*</span></label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
              onDrop={e => { e.preventDefault(); setDragOver(false); setFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`upload-dropzone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            >
              {file ? (
                <>
                  <div className="upload-dropzone-icon" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
                    <UploadIcon size={22} />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)', marginBottom: 2 }}>{file.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
                </>
              ) : (
                <>
                  <div className="upload-dropzone-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    <UploadIcon size={22} />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)', marginBottom: 4 }}>Drop PDF here</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>or click to browse (max 10 MB)</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".pdf" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, paddingTop: 24, borderTop: '1px solid var(--border-color)', marginTop: 24 }}>
          <button type="submit" className="btn-rounded btn-primary" style={{ padding: '12px 32px', fontSize: 14, gap: 8 }} disabled={uploading}>
            {uploading ? <><Loader2 size={16} className="spin" /> Uploading...</> : <><UploadIcon size={18} /> Upload Note</>}
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
