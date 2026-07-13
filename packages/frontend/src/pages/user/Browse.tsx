import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { universityApi } from '../../api/university';
import { courseApi } from '../../api/course';
import { semesterApi } from '../../api/semester';
import { subjectApi } from '../../api/subject';
import { getThumbnailUrl } from '../../utils/cloudinary';
import { Search, FileText, Building, ArrowLeft } from 'lucide-react';
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
          const res = await subjectApi.notes(hierarchy[3].id, p, 5);
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
  }, [hierarchy, level, search]);

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

  const levelLabel = level === 'universities' ? 'Universities'
    : level === 'courses' ? 'Courses'
    : level === 'semesters' ? 'Semesters'
    : level === 'subjects' ? 'Subjects'
    : 'Notes';

  const cardPalette = [
    { bg: 'var(--palette-0-bg)', color: 'var(--palette-0)' },
    { bg: 'var(--palette-1-bg)', color: 'var(--palette-1)' },
    { bg: 'var(--palette-2-bg)', color: 'var(--palette-2)' },
    { bg: 'var(--palette-3-bg)', color: 'var(--palette-3)' },
    { bg: 'var(--palette-4-bg)', color: 'var(--palette-4)' },
    { bg: 'var(--palette-5-bg)', color: 'var(--palette-5)' },
  ];

  const singular = level === 'universities' ? 'University'
    : level === 'courses' ? 'Course'
    : level === 'semesters' ? 'Semester'
    : level === 'subjects' ? 'Subject'
    : 'Note';

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, fontFamily: 'var(--font-heading)' }}>Browse Notes</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          {hierarchy.length > 0 && (
            <button onClick={goBack} className="btn-rounded btn-ghost" style={{ padding: '8px 12px', flexShrink: 0, fontSize: 12, marginRight: 4 }}>
              <ArrowLeft size={14} />
            </button>
          )}
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
        <div className="search-bar" style={{ maxWidth: 360, marginLeft: 'auto' }}>
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder={`Search ${levelLabel.toLowerCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
          <p>{level === 'notes' ? 'No notes have been uploaded for this subject yet.' : `No ${levelLabel.toLowerCase()} match your search.`}</p>
        </div>
      ) : level === 'notes' ? (
        <>
          <div className="hierarchy-grid">
            {items.map((note, i) => {
              const c = cardPalette[i % cardPalette.length];
              const thumbUrl = getThumbnailUrl(note.cloudinaryUrl);
              return (
              <Link key={note._id} to={`/notes/${note._id}`} className="hierarchy-card"
                style={{ borderLeftColor: c.color, textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', gap: 12, height: '100%' }}>
                  <div style={{
                    width: 72, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                    backgroundImage: `url(${thumbUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: c.color,
                  }} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '2px 0' }}>
                    <span className="hierarchy-card-badge" style={{ background: c.bg, color: c.color }}>
                      PDF · {note.fileSize ? `${(note.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}
                    </span>
                    <div className="hierarchy-card-title" style={{ marginTop: 4 }}>{note.title}</div>
                    <div className="hierarchy-card-sub" style={{ marginTop: 2, flex: 1 }}>
                      {note.description || 'No description'}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-light)', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span>by {note.userId?.fullname || 'Unknown'}</span>
                      <span>·</span>
                      <span>{note.downloads || 0} downloads</span>
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
            const c = cardPalette[i % cardPalette.length];
            return (
            <button key={item._id} onClick={() => select(item)} className="hierarchy-card"
              style={{ borderLeftColor: c.color } as React.CSSProperties}>
              <span className="hierarchy-card-badge" style={{ background: c.bg, color: c.color }}>
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
