import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { noteApi } from '../../api/note';
import Pagination from '../../components/ui/Pagination';
import { FileText, Upload } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';
import { getThumbnailUrl } from '../../utils/cloudinary';

const palette = [
  { bg: 'var(--palette-0-bg)', color: 'var(--palette-0)' },
  { bg: 'var(--palette-1-bg)', color: 'var(--palette-1)' },
  { bg: 'var(--palette-2-bg)', color: 'var(--palette-2)' },
  { bg: 'var(--palette-3-bg)', color: 'var(--palette-3)' },
  { bg: 'var(--palette-4-bg)', color: 'var(--palette-4)' },
  { bg: 'var(--palette-5-bg)', color: 'var(--palette-5)' },
];

export default function MyNotes() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchNotes = (p = 1) => {
    setLoading(true);
    noteApi.my(p, 5)
      .then(res => { setNotes(res.data.data.items); setPage(res.data.data.page); setTotalPages(res.data.data.totalPages); setTotal(res.data.data.total); })
      .catch(err => showToast('error', getApiError(err, 'Failed to load notes')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotes(); }, []);

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex-wrap" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', margin: 0 }}>My Notes</h1>
        <Link to="/user/upload" className="btn-rounded btn-primary" style={{ padding: '10px 20px', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={16} />
          Upload Note
        </Link>
      </div>
      {notes.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No notes uploaded</h3>
          <p>Upload your first note to share with others.</p>
          <Link to="/user/upload" className="btn-rounded btn-primary" style={{ marginTop: 16, padding: '12px 24px', fontSize: 13, textDecoration: 'none' }}>
            Upload Note
          </Link>
        </div>
      ) : (
        <>
          <div className="hierarchy-grid">
            {notes.map((note, i) => {
              const c = palette[i % palette.length];
              const thumbUrl = getThumbnailUrl(note.cloudinaryUrl);
              return (
                <Link key={note._id} to={`/notes/${note._id}`} className="hierarchy-card"
                  style={{ borderLeftColor: c.color, textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', gap: 12, height: '100%' }}>
                    <div style={{
                      width: 72, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                      backgroundImage: `url(${thumbUrl})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat', backgroundColor: c.color,
                    }} />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '2px 0' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                        <span className="hierarchy-card-badge" style={{ background: c.bg, color: c.color }}>
                          {note.approved ? 'Approved' : 'Pending'}
                        </span>
                        {note.subjectId && (
                          <span style={{ fontSize: 10, color: 'var(--text-light)' }}>
                            {note.subjectId.name}
                          </span>
                        )}
                      </div>
                      <div className="hierarchy-card-title">{note.title}</div>
                      <div className="hierarchy-card-sub" style={{ flex: 1 }}>
                        {note.description || 'No description'}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-light)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span>{note.downloads || 0} downloads</span>
                        <span>·</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={fetchNotes} />
        </>
      )}
    </div>
  );
}
