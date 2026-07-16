import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseApi } from '../api/course';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/constants';

const palette = [
  { bg: 'var(--palette-2-bg)', color: 'var(--palette-2)' },
  { bg: 'var(--palette-3-bg)', color: 'var(--palette-3)' },
  { bg: 'var(--palette-4-bg)', color: 'var(--palette-4)' },
  { bg: 'var(--palette-5-bg)', color: 'var(--palette-5)' },
  { bg: 'var(--palette-0-bg)', color: 'var(--palette-0)' },
  { bg: 'var(--palette-1-bg)', color: 'var(--palette-1)' },
];

export default function CourseDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      courseApi.get(id),
      courseApi.semesters(id),
    ])
      .then(([c, s]) => {
        setCourse(c.data.data);
        setSemesters(s.data.data);
      })
      .catch(err => showToast('error', getApiError(err, 'Failed to load course')))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!course) return <div className="empty-state"><h3>Not found</h3></div>;

  return (
    <div className="detail-page" style={{ padding: '100px 5% 60px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="mobile-breadcrumb">
        <Link to={`/universities/${course.universityId?._id}`} className="mobile-breadcrumb-back"><ArrowLeft size={14} /></Link>
        <span className="mobile-breadcrumb-text">{course.universityId?.name}</span>
        <span className="mobile-breadcrumb-sep">/</span>
        <span className="mobile-breadcrumb-current">{course.name}</span>
      </div>
      <Link to={`/notes?course=${id}&university=${course.universityId?._id}`} className="hide-mobile-breadcrumb"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 16, textDecoration: 'none' }}>
        <ArrowLeft size={16} /> {course.universityId?.name}
      </Link>

      <div className="detail-grid detail-grid-sidebar">
        <div>
          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--palette-2)', cursor: 'default' }}>
            <span className="hierarchy-card-badge" style={{ background: 'var(--palette-2-bg)', color: 'var(--palette-2)' }}>
              <BookOpen size={11} style={{ marginRight: 4 }} /> Course
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 8, marginBottom: 6 }}>{course.name}</h1>
            {course.description && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                {course.description}
              </p>
            )}
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChevronRight size={16} style={{ color: 'var(--primary)' }} /> Semesters ({semesters.length})
          </h2>
          <div className="hierarchy-grid">
            {semesters.map((s, i) => {
              const col = palette[i % palette.length];
              return (
              <Link key={s._id} to={`/semesters/${s._id}`} className="hierarchy-card"
                style={{ borderLeftColor: col.color, textDecoration: 'none', color: 'inherit' }}>
                <span className="hierarchy-card-badge" style={{ background: col.bg, color: col.color }}>Semester</span>
                <div className="hierarchy-card-title">{s.title}</div>
              </Link>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--palette-1)', cursor: 'default' }}>
            <span className="hierarchy-card-badge" style={{ background: 'var(--palette-1-bg)', color: 'var(--palette-1)' }}>
              University
            </span>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <Link to={`/notes?university=${course.universityId?._id}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                {course.universityId?.name || 'N/A'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
