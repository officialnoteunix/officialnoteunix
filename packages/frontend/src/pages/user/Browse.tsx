import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { universityApi } from '../../api/university';
import { courseApi } from '../../api/course';
import { semesterApi } from '../../api/semester';
import { subjectApi } from '../../api/subject';
import { getThumbnailUrl } from '../../utils/cloudinary';
import FileTypePlaceholder from '../../components/ui/FileTypePlaceholder';
import { Search, FileText, Building, ArrowLeft, Filter, Upload, BadgeCheck } from 'lucide-react';
import Select from '../../components/ui/Select';

const RESOURCE_TYPES = [
  { value: '', label: 'All Types' },
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
import Pagination from '../../components/ui/Pagination';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';

type HierarchyItem = { type: 'university' | 'course' | 'semester' | 'subject'; id: string; name: string };

type Level = 'universities' | 'courses' | 'semesters' | 'subjects' | 'notes';

const HIERARCHY_KEY = 'user_browse_hierarchy';

export default function Browse() {
  const { showToast } = useToast();
  const [hierarchy, setHierarchy] = useState<HierarchyItem[]>(() => {
    try {
      const saved = localStorage.getItem(HIERARCHY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const restoring = useRef(true);

  const level: Level = hierarchy.length === 0 ? 'universities'
    : hierarchy.length === 1 ? 'courses'
    : hierarchy.length === 2 ? 'semesters'
    : hierarchy.length === 3 ? 'subjects'
    : 'notes';

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      let data: any[] = [];
      let tp = 1, tt = 0;
      switch (level) {
        case 'universities': {
          const res = await universityApi.list(search || undefined);
          data = res.data.data; break;
        }
        case 'courses': {
          const res = await universityApi.courses(hierarchy[0].id);
          data = res.data.data; break;
        }
        case 'semesters': {
          const res = await courseApi.semesters(hierarchy[1].id);
          data = res.data.data; break;
        }
        case 'subjects': {
          const res = await semesterApi.subjects(hierarchy[2].id);
          data = res.data.data; break;
        }
        case 'notes': {
          const res = await subjectApi.notes(hierarchy[3].id, p, 5, resourceTypeFilter || undefined);
          data = res.data.data.items; tp = res.data.data.totalPages; tt = res.data.data.total;
          break;
        }
      }
      setItems(data); setTotalPages(tp); setTotal(tt); setPage(p);
    } catch (err) {
      setItems([]);
      showToast('error', getApiError(err, `Failed to load ${levelLabel.toLowerCase()}`));
    } finally {
      setLoading(false);
    }
  }, [hierarchy, level, search, resourceTypeFilter]);

  useEffect(() => {
    restoring.current = false;
  }, []);

  useEffect(() => {
    if (!restoring.current) {
      localStorage.setItem(HIERARCHY_KEY, JSON.stringify(hierarchy));
    }
  }, [hierarchy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const select = (item: any) => {
    setSearch('');
    setPage(1);
    if (level === 'notes') return;
    const type = level === 'universities' ? 'university'
      : level === 'courses' ? 'course'
      : level === 'semesters' ? 'semester'
      : 'subject';
    setHierarchy(prev => [...prev, { type, id: item._id, name: item.name || item.title || `Semester ${item.semesterNumber}` }]);
  };

  const goBack = () => {
    setSearch('');
    setPage(1);
    setHierarchy(prev => prev.slice(0, -1));
  };

  const reset = () => {
    setSearch('');
    setPage(1);
    setHierarchy([]);
  };

  const goToLevel = (index: number) => {
    setSearch('');
    setPage(1);
    setHierarchy(prev => prev.slice(0, index));
  };

  const levelLabel = level === 'universities' ? 'Universities'
    : level === 'courses' ? 'Courses'
    : level === 'semesters' ? 'Semesters'
    : level === 'subjects' ? 'Subjects'
    : 'Notes';

  const accentColor = { bg: 'var(--primary-light)', color: 'var(--primary)' };

  const singular = level === 'universities' ? 'University'
    : level === 'courses' ? 'Course'
    : level === 'semesters' ? 'Semester'
    : level === 'subjects' ? 'Subject'
    : 'Note';

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, fontFamily: 'var(--font-heading)' }}>Browse Notes</h1>

      <div className="browse-toolbar">
        <div className="breadcrumb-row">
          {hierarchy.length > 0 && (
            <button onClick={goBack} className="btn-rounded btn-ghost" style={{ padding: '8px 12px', flexShrink: 0, fontSize: 12, marginRight: 4 }}>
              <ArrowLeft size={14} />
            </button>
          )}
          <div className="breadcrumb">
            <button onClick={reset} className="bc-item-btn bc-root-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: hierarchy.length === 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: hierarchy.length === 0 ? 700 : 400, padding: 0, fontSize: 13 }}>
              All Notes
            </button>
            {hierarchy.map((item, i) => {
              const isLastTwo = i >= hierarchy.length - 2;
              return (
              <span key={i} className={isLastTwo ? '' : 'bc-mobile-hidden'} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="bc-sep" style={{ color: 'var(--text-light)', fontSize: 13 }}>/</span>
                <button onClick={() => goToLevel(i + 1)} className="bc-item-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: i === hierarchy.length - 1 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === hierarchy.length - 1 ? 700 : 400, padding: 0, fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                  {item.name}
                </button>
              </span>
              );
            })}
          </div>
        </div>
        <div className="filter-search-row">
          {level === 'notes' && (
            <Select
              value={resourceTypeFilter}
              onChange={(val) => { setResourceTypeFilter(val); setPage(1); }}
              options={RESOURCE_TYPES}
              icon={<Filter size={14} />}
            />
          )}
          <div className="search-bar">
            <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={`Search ${levelLabel.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}>
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          {level === 'notes' ? <FileText size={48} /> : <Building size={48} />}
          <h3>No {levelLabel.toLowerCase()} found</h3>
          {level === 'notes' ? (
            <>
              <p>No notes have been uploaded for this subject yet. Be the first to share!</p>
              <Link to="/user/upload" className="btn-rounded btn-primary"
                style={{ padding: '10px 24px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', marginTop: 12 }}>
                <Upload size={16} /> Upload a note
              </Link>
            </>
          ) : (
            <p>{`No ${levelLabel.toLowerCase()} match your search.`}</p>
          )}
        </div>
      ) : level === 'notes' ? (
        <>
          <div className="hierarchy-grid">
            {items.map((note, i) => {
              const c = accentColor;
              const ft = note.files?.[0]?.fileType || note.fileType;
              const thumbUrl = getThumbnailUrl(note.files?.[0]?.url || note.cloudinaryUrl, ft, note.thumbnailUrl);
              return (
              <Link key={note._id} to={`/notes/${note._id}`} className="hierarchy-card"
                style={{ borderLeftColor: c.color, textDecoration: 'none', color: 'inherit', minHeight: 180 }}>
                <div style={{ display: 'flex', gap: 16, height: '100%' }}>
                  {thumbUrl ? (
                  <div className="note-thumb" style={{
                    width: 72, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                    backgroundImage: `url(${thumbUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }} />
                  ) : (
                  <div style={{ width: 72, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-subtle)' }}>
                    <FileTypePlaceholder fileType={ft} height={140} />
                  </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
                    <span className="hierarchy-card-badge" style={{ color: c.color, textTransform: 'capitalize' }}>
                      {note.fileType || 'pdf'}
                    </span>
                    <div className="hierarchy-card-title" style={{ marginTop: 4 }}>{note.title}</div>
                    <div className="hierarchy-card-sub" style={{ marginTop: 2, flex: 1 }}>
                      {note.description || 'No description'}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-light)', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>by {note.userId?.fullname || 'Unknown'}{note.userId?.isVerified && <BadgeCheck size={11} style={{ color: 'var(--primary)' }} />}</span>
                      <span>·</span>
                      <span style={{ textTransform: 'capitalize' }}>{(note.resourceType || 'study_notes').replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={fetchData} />
        </>
      ) : (
        <div className="hierarchy-grid">
          {items.map((item, i) => {
            const c = accentColor;
            return (
            <button key={item._id} onClick={() => select(item)} className="hierarchy-card"
              style={{ borderLeftColor: c.color } as React.CSSProperties}>
              <span className="hierarchy-card-badge" style={{ color: c.color }}>
                {singular}
              </span>
              <div className="hierarchy-card-title">{item.title || item.name || `Semester ${item.semesterNumber}`}</div>
              <div className="hierarchy-card-sub">
                {level === 'universities' && (item.description ? item.description.slice(0, 60) + (item.description.length > 60 ? '...' : '') : '')}
                {level === 'courses' && (item.description ? item.description.slice(0, 60) + (item.description.length > 60 ? '...' : '') : `${item.name}`)}
                {level === 'semesters' && (item.title ? '' : `Semester ${item.semesterNumber}`) + (item.description ? (item.title ? '' : ' · ') + item.description.slice(0, 60) + (item.description.length > 60 ? '...' : '') : item.title || '')}
                {level === 'subjects' && (item.code || '') + (item.description ? ` · ${item.description.slice(0, 60)}${item.description.length > 60 ? '...' : ''}` : '')}
              </div>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
