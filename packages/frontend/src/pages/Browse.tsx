import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { universityApi } from '../api/university';
import { courseApi } from '../api/course';
import { semesterApi } from '../api/semester';
import { subjectApi } from '../api/subject';
import { noteApi } from '../api/note';
import { getThumbnailUrl } from '../utils/cloudinary';
import FileTypePlaceholder from '../components/ui/FileTypePlaceholder';
import { Search, FileText, Building, ArrowLeft, ExternalLink, Star, Filter, Upload, BadgeCheck } from 'lucide-react';
import Select from '../components/ui/Select';
import Pagination from '../components/ui/Pagination';
import StarRating from '../components/ui/StarRating';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/constants';
import SEO from '../components/seo/SEO';

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

type HierarchyItem = { type: 'university' | 'course' | 'semester' | 'subject'; id: string; name: string };

type Level = 'universities' | 'courses' | 'semesters' | 'subjects' | 'notes';

const HIERARCHY_KEY = 'public_browse_hierarchy';

export default function Browse() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [hierarchy, setHierarchy] = useState<HierarchyItem[]>(() => {
    try {
      const saved = localStorage.getItem(HIERARCHY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const restoredFromParams = useRef(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const restoring = useRef(true);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search]);

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
          const res = await universityApi.list(debouncedSearch || undefined);
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
          const res = await noteApi.list({ page: p, limit: 9, subjectId: hierarchy[3].id, resourceType: resourceTypeFilter || undefined });
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
  }, [hierarchy, level, debouncedSearch, resourceTypeFilter]);

  useEffect(() => {
    restoring.current = false;
  }, []);

  useEffect(() => {
    if (restoredFromParams.current || hierarchy.length > 0) return;
    const subjectId = searchParams.get('subject');
    const semesterId = searchParams.get('semester');
    const courseId = searchParams.get('course');

    if (subjectId) {
      restoredFromParams.current = true;
      subjectApi.get(subjectId).then(res => {
        const sub = res.data.data;
        const sem = sub.semesterId;
        const course = sem?.courseId;
        const uni = course?.universityId;
        const newHierarchy: HierarchyItem[] = [];
        if (uni) newHierarchy.push({ type: 'university', id: uni._id, name: uni.name });
        if (course) newHierarchy.push({ type: 'course', id: course._id, name: course.name });
        if (sem) newHierarchy.push({ type: 'semester', id: sem._id, name: sem.title || `Semester ${sem.semesterNumber}` });
        if (sub) newHierarchy.push({ type: 'subject', id: sub._id, name: sub.name });
        setHierarchy(newHierarchy);
      }).catch(() => {});
    } else if (semesterId) {
      restoredFromParams.current = true;
      semesterApi.get(semesterId).then(res => {
        const sem = res.data.data;
        const course = sem.courseId;
        const newHierarchy: HierarchyItem[] = [];
        if (course) newHierarchy.push({ type: 'course', id: course._id, name: course.name });
        if (sem) newHierarchy.push({ type: 'semester', id: sem._id, name: sem.title || `Semester ${sem.semesterNumber}` });
        setHierarchy(newHierarchy);
      }).catch(() => {});
    } else if (courseId) {
      restoredFromParams.current = true;
      courseApi.get(courseId).then(res => {
        const course = res.data.data;
        const newHierarchy: HierarchyItem[] = [];
        if (course.universityId) newHierarchy.push({ type: 'university', id: course.universityId._id, name: course.universityId.name });
        if (course) newHierarchy.push({ type: 'course', id: course._id, name: course.name });
        setHierarchy(newHierarchy);
      }).catch(() => {});
    }
  }, [searchParams, hierarchy]);

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
    <div className="browse-page">
      <SEO title="Browse Notes" description="Browse and search study notes organized by university, course, semester, and subject." />
      <h1 className="browse-page-title">Browse Notes</h1>
      <div className="browse-toolbar">
        <div className="breadcrumb-row">
          {hierarchy.length > 0 && (
            <button onClick={goBack} className="btn-rounded btn-ghost" style={{ padding: '8px 12px', flexShrink: 0, fontSize: 12, marginRight: 4 }}>
              <ArrowLeft size={14} />
            </button>
          )}
          <div className="breadcrumb">
            <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: hierarchy.length === 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: hierarchy.length === 0 ? 700 : 400, padding: 0, fontSize: 13 }}>
              All {levelLabel}
            </button>
            {hierarchy.map((item, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--text-light)', fontSize: 13 }}>/</span>
                <span style={{ color: i === hierarchy.length - 1 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === hierarchy.length - 1 ? 700 : 400 }}>
                  {item.name}
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="filter-search-row">
          <Select
            value={resourceTypeFilter}
            onChange={(val) => { setResourceTypeFilter(val); setPage(1); }}
            options={RESOURCE_TYPES}
            icon={<Filter size={14} />}
          />
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
          <div className="hierarchy-grid notes-grid">
            {items.map((note, i) => {
              const c = accentColor;
              const ft = note.files?.[0]?.fileType || note.fileType;
              const thumbUrl = getThumbnailUrl(note.files?.[0]?.url || note.cloudinaryUrl, ft, note.thumbnailUrl);
              return (
              <Link key={note._id} to={`/notes/${note._id}`} className="hierarchy-card note-card"
                style={{ borderLeftColor: c.color, textDecoration: 'none', color: 'inherit', minHeight: 180 }}>
                <div style={{ display: 'flex', gap: 16, height: '100%' }}>
                  {thumbUrl ? (
                  <div className="note-thumb" style={{
                    width: 100, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                    backgroundImage: `url(${thumbUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }} />
                  ) : (
                  <div className="note-thumb" style={{ width: 100, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-subtle)' }}>
                    <FileTypePlaceholder fileType={ft} height={160} />
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
                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-light)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>by {note.userId?.fullname || 'Unknown'}{note.userId?.isVerified && <BadgeCheck size={11} style={{ color: 'var(--primary)' }} />}</span>
                      <span>·</span>
                      <span style={{ textTransform: 'capitalize' }}>{(note.resourceType || 'study_notes').replace(/_/g, ' ')}</span>
                      {note.averageRating > 0 && (
                        <>
                          <span>·</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                            <StarRating rating={note.averageRating} size={10} />
                            <span>({note.ratingsCount})</span>
                          </span>
                        </>
                      )}
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
            const detailPath = level === 'universities' ? `/universities/${item._id}`
              : level === 'courses' ? `/courses/${item._id}`
              : level === 'semesters' ? `/semesters/${item._id}`
              : level === 'subjects' ? `/subjects/${item._id}`
              : null;
            return (
            <button key={item._id} onClick={() => select(item)} className="hierarchy-card"
              style={{ borderLeftColor: c.color, position: 'relative' } as React.CSSProperties}>
              {detailPath && (
                <Link to={detailPath} onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: 10, right: 10, width: 28, height: 28,
                    borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-light)', textDecoration: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  title="View details"
                >
                  <ExternalLink size={14} />
                </Link>
              )}
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
