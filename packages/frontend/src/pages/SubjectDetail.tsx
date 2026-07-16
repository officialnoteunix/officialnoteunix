import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { subjectApi } from '../api/subject';
import { ArrowLeft, BookOpen, ChevronRight, FileText } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/constants';
import { getThumbnailUrl } from '../utils/cloudinary';
import FileTypePlaceholder from '../components/ui/FileTypePlaceholder';

const cardPalette = [
  { bg: 'var(--palette-0-bg)', color: 'var(--palette-0)' },
  { bg: 'var(--palette-1-bg)', color: 'var(--palette-1)' },
  { bg: 'var(--palette-2-bg)', color: 'var(--palette-2)' },
  { bg: 'var(--palette-3-bg)', color: 'var(--palette-3)' },
  { bg: 'var(--palette-4-bg)', color: 'var(--palette-4)' },
  { bg: 'var(--palette-5-bg)', color: 'var(--palette-5)' },
];

export default function SubjectDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [subject, setSubject] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [notesTotal, setNotesTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      subjectApi.get(id),
      subjectApi.notes(id, 1, 4),
    ])
      .then(([s, n]) => {
        setSubject(s.data.data);
        setNotes(n.data.data.items);
        setNotesTotal(n.data.data.total);
      })
      .catch(err => showToast('error', getApiError(err, 'Failed to load subject')))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!subject) return <div className="empty-state"><h3>Not found</h3></div>;

  const uni = subject.semesterId?.courseId?.universityId;

  return (
    <div className="detail-page" style={{ padding: '100px 5% 60px', maxWidth: 1000, margin: '0 auto' }}>
      <div className="mobile-breadcrumb">
        <Link to={`/semesters/${subject.semesterId?._id}`} className="mobile-breadcrumb-back"><ArrowLeft size={14} /></Link>
        <span className="mobile-breadcrumb-text">{subject.semesterId?.title}</span>
        <span className="mobile-breadcrumb-sep">/</span>
        <span className="mobile-breadcrumb-current">{subject.name}</span>
      </div>
      <Link to={`/semesters/${subject.semesterId?._id}`} className="hide-mobile-breadcrumb"
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        <ArrowLeft size={16} /> {subject.semesterId?.title}
      </Link>

      <div className="detail-grid detail-grid-sidebar">
        <div>
          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--palette-4)', cursor: 'default' }}>
            <span className="hierarchy-card-badge" style={{ background: 'var(--palette-4-bg)', color: 'var(--palette-4)' }}>
              <BookOpen size={11} style={{ marginRight: 4 }} /> Subject
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 8, marginBottom: 6 }}>{subject.name}</h1>
            {subject.code && (
              <span style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-full)',
                background: 'var(--primary-light)', color: 'var(--primary)',
                fontSize: 12, fontWeight: 600, marginBottom: 12,
              }}>{subject.code}</span>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
              {subject.description || 'No description available for this subject.'}
            </p>
          </div>

          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--palette-0)', cursor: 'default', marginTop: 16 }}>
            <span className="hierarchy-card-badge" style={{ background: 'var(--palette-0-bg)', color: 'var(--palette-0)' }}>
              Full Path
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, flexWrap: 'wrap', marginTop: 8 }}>
              <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>{uni?.name}</span>
              <ChevronRight size={12} style={{ color: 'var(--text-light)' }} />
              <Link to={`/courses/${subject.semesterId?.courseId?._id}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>{subject.semesterId?.courseId?.name}</Link>
              <ChevronRight size={12} style={{ color: 'var(--text-light)' }} />
              <Link to={`/semesters/${subject.semesterId?._id}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>{subject.semesterId?.title}</Link>
              <ChevronRight size={12} style={{ color: 'var(--text-light)' }} />
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{subject.name}</span>
            </div>
          </div>

          {notes.length > 0 && (
            <div className="hierarchy-card" style={{ borderLeftColor: 'var(--palette-1)', cursor: 'default' }}>
              <span className="hierarchy-card-badge" style={{ background: 'var(--palette-1-bg)', color: 'var(--palette-1)' }}>
                <FileText size={11} style={{ marginRight: 4 }} /> Notes ({notesTotal})
              </span>
              <div className="hierarchy-grid notes-grid" style={{ marginTop: 12 }}>
                {notes.map((note, i) => {
                  const c = cardPalette[i % cardPalette.length];
                  const ft = note.files?.[0]?.fileType || note.fileType;
                  const thumbUrl = getThumbnailUrl(note.files?.[0]?.url || note.cloudinaryUrl, ft, note.thumbnailUrl);
                  return (
                  <Link key={note._id} to={`/notes/${note._id}`} className="hierarchy-card"
                    style={{ borderLeftColor: c.color, textDecoration: 'none', color: 'inherit', minHeight: 140 }}>
                    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
                      {thumbUrl ? (
                      <div style={{
                        width: 100, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                        backgroundImage: `url(${thumbUrl})`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }} />
                      ) : (
                      <div style={{ width: 100, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-subtle)' }}>
                        <FileTypePlaceholder fileType={ft} height={140} />
                      </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
                        <span className="hierarchy-card-badge" style={{ color: c.color }}>
                          {note.fileType?.toUpperCase() || 'PDF'}
                        </span>
                        <div className="hierarchy-card-title" style={{ marginTop: 4 }}>{note.title}</div>
                        <div className="hierarchy-card-sub" style={{ marginTop: 2, flex: 1 }}>
                          {note.description || 'No description'}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-light)', display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span>by {note.userId?.fullname || 'Unknown'}</span>
                          <span>·</span>
                          <span style={{ textTransform: 'capitalize' }}>{(note.resourceType || 'study_notes').replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
              {notesTotal > 4 && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Link to={`/notes?subject=${id}&semester=${subject.semesterId?._id}&course=${subject.semesterId?.courseId?._id}&university=${uni?._id}`}
                    className="btn-rounded btn-ghost" style={{ padding: '10px 24px', fontSize: 13, textDecoration: 'none' }}>
                    View all {notesTotal} notes →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--palette-1)', cursor: 'default' }}>
            <span className="hierarchy-card-badge" style={{ background: 'var(--palette-1-bg)', color: 'var(--palette-1)' }}>
              <FileText size={11} style={{ marginRight: 4 }} /> Notes
            </span>
            <div style={{ marginTop: 8, textAlign: 'center', padding: '12px 0' }}>
              <FileText size={40} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                {notesTotal > 0 ? `${notesTotal} note${notesTotal > 1 ? 's' : ''} available` : 'No notes yet'}
              </div>
              <Link to={`/notes?subject=${id}&semester=${subject.semesterId?._id}&course=${subject.semesterId?.courseId?._id}&university=${uni?._id}`}
                className="btn-rounded btn-primary" style={{ padding: '10px 24px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                Browse Notes <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          <div className="hierarchy-card" style={{ borderLeftColor: 'var(--palette-2)', cursor: 'default' }}>
            <span className="hierarchy-card-badge" style={{ background: 'var(--palette-2-bg)', color: 'var(--palette-2)' }}>
              Related
            </span>
            <div style={{ marginTop: 8, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>← {uni?.name}</span>
              <Link to={`/courses/${subject.semesterId?.courseId?._id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>← {subject.semesterId?.courseId?.name}</Link>
              <Link to={`/semesters/${subject.semesterId?._id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>← {subject.semesterId?.title}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
