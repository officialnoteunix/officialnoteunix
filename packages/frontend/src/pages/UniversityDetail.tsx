import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { universityApi } from '../api/university';
import { ArrowLeft, Building, ChevronRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/constants';

const palette = [
  { bg: 'var(--palette-0-bg)', color: 'var(--palette-0)' },
  { bg: 'var(--palette-1-bg)', color: 'var(--palette-1)' },
  { bg: 'var(--palette-2-bg)', color: 'var(--palette-2)' },
  { bg: 'var(--palette-3-bg)', color: 'var(--palette-3)' },
  { bg: 'var(--palette-4-bg)', color: 'var(--palette-4)' },
  { bg: 'var(--palette-5-bg)', color: 'var(--palette-5)' },
];

export default function UniversityDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [university, setUniversity] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      universityApi.get(id),
      universityApi.courses(id),
    ])
      .then(([u, c]) => {
        setUniversity(u.data.data);
        setCourses(c.data.data);
      })
      .catch(err => showToast('error', getApiError(err, 'Failed to load university')))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!university) return <div className="empty-state"><h3>Not found</h3></div>;

  return (
    <div className="detail-page" style={{ padding: '100px 5% 60px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="mobile-breadcrumb">
        <Link to="/notes" className="mobile-breadcrumb-back"><ArrowLeft size={14} /></Link>
        <span className="mobile-breadcrumb-text">Browse</span>
        <span className="mobile-breadcrumb-sep">/</span>
        <span className="mobile-breadcrumb-current">{university.name}</span>
      </div>
      <Link to="/notes" className="hide-mobile-breadcrumb"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 16, textDecoration: 'none' }}>
        <Building size={16} /> Browse
      </Link>

      <div>
        <div className="hierarchy-card" style={{ borderLeftColor: 'var(--palette-0)', cursor: 'default' }}>
          <span className="hierarchy-card-badge" style={{ background: 'var(--palette-0-bg)', color: 'var(--palette-0)' }}>
            <Building size={11} style={{ marginRight: 4 }} /> University
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 8, marginBottom: 6 }}>{university.name}</h1>
          {university.description && (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
              {university.description}
            </p>
          )}
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChevronRight size={16} style={{ color: 'var(--primary)' }} /> Courses ({courses.length})
        </h2>
        <div className="hierarchy-grid">
          {courses.map((c, i) => {
            const col = palette[i % palette.length];
            return (
            <Link key={c._id} to={`/courses/${c._id}`} className="hierarchy-card"
              style={{ borderLeftColor: col.color, textDecoration: 'none', color: 'inherit' }}>
              <span className="hierarchy-card-badge" style={{ background: col.bg, color: col.color }}>Course</span>
              <div className="hierarchy-card-title">{c.name}</div>
              {c.description && (
                <div className="hierarchy-card-sub" style={{ marginTop: 4 }}>
                  {c.description.slice(0, 80)}{c.description.length > 80 ? '...' : ''}
                </div>
              )}
            </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
