import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { semesterApi } from '../api/semester';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/constants';

const palette = [
  { bg: 'var(--palette-3-bg)', color: 'var(--palette-3)' },
  { bg: 'var(--palette-4-bg)', color: 'var(--palette-4)' },
  { bg: 'var(--palette-5-bg)', color: 'var(--palette-5)' },
  { bg: 'var(--palette-0-bg)', color: 'var(--palette-0)' },
  { bg: 'var(--palette-1-bg)', color: 'var(--palette-1)' },
  { bg: 'var(--palette-2-bg)', color: 'var(--palette-2)' },
];

export default function SemesterDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [semester, setSemester] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      semesterApi.get(id),
      semesterApi.subjects(id),
    ])
      .then(([s, subs]) => {
        setSemester(s.data.data);
        setSubjects(subs.data.data);
      })
      .catch(err => showToast('error', getApiError(err, 'Failed to load semester')))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!semester) return <div className="empty-state"><h3>Not found</h3></div>;

  return (
    <div style={{ padding: '100px 5% 60px', maxWidth: 1200, margin: '0 auto' }}>
      <Link to={`/courses/${semester.courseId?._id}`}
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 16, textDecoration: 'none' }}>
        <ArrowLeft size={16} /> {semester.courseId?.name}
      </Link>

      <div className="detail-grid" style={{ gridTemplateColumns: '1fr 420px' }}>
        <div>
          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--palette-3)', cursor: 'default' }}>
            <span className="hierarchy-card-badge" style={{ background: 'var(--palette-3-bg)', color: 'var(--palette-3)' }}>
              <BookOpen size={11} style={{ marginRight: 4 }} /> Semester
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 8, marginBottom: 6 }}>{semester.title}</h1>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChevronRight size={16} style={{ color: 'var(--primary)' }} /> Subjects ({subjects.length})
          </h2>
          <div className="hierarchy-grid">
            {subjects.map((s, i) => {
              const col = palette[i % palette.length];
              return (
              <Link key={s._id} to={`/subjects/${s._id}`} className="hierarchy-card"
                style={{ borderLeftColor: col.color, textDecoration: 'none', color: 'inherit' }}>
                <span className="hierarchy-card-badge" style={{ background: col.bg, color: col.color }}>Subject</span>
                <div className="hierarchy-card-title">{s.name}</div>
                {s.code && <div className="hierarchy-card-sub" style={{ marginTop: 4 }}>{s.code}</div>}
              </Link>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--palette-1)', cursor: 'default' }}>
            <span className="hierarchy-card-badge" style={{ background: 'var(--palette-1-bg)', color: 'var(--palette-1)' }}>
              Course
            </span>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <Link to={`/courses/${semester.courseId?._id}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                {semester.courseId?.name || 'N/A'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
