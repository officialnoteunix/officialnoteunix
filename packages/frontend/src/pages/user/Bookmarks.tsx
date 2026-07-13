import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookmarkApi } from '../../api/bookmark';
import { Bookmark } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';
import { getThumbnailUrl } from '../../utils/cloudinary';
import Pagination from '../../components/ui/Pagination';

const palette = [
  { bg: 'var(--palette-0-bg)', color: 'var(--palette-0)' },
  { bg: 'var(--palette-1-bg)', color: 'var(--palette-1)' },
  { bg: 'var(--palette-2-bg)', color: 'var(--palette-2)' },
  { bg: 'var(--palette-3-bg)', color: 'var(--palette-3)' },
  { bg: 'var(--palette-4-bg)', color: 'var(--palette-4)' },
  { bg: 'var(--palette-5-bg)', color: 'var(--palette-5)' },
];

export default function Bookmarks() {
  const { showToast } = useToast();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    bookmarkApi.list(page)
      .then(res => {
        setBookmarks(res.data.data.items);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
      })
      .catch(err => showToast('error', getApiError(err, 'Failed to load bookmarks')))
      .finally(() => setLoading(false));
  }, [page, showToast]);

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, fontFamily: 'var(--font-heading)' }}>Bookmarks</h1>
      {bookmarks.length === 0 ? (
        <div className="empty-state">
          <Bookmark size={48} />
          <h3>No bookmarks yet</h3>
          <p>Bookmark notes to find them easily later.</p>
          <Link to="/user/browse" className="btn-rounded btn-primary" style={{ marginTop: 16, padding: '12px 24px', fontSize: 13, textDecoration: 'none' }}>
            Browse Notes
          </Link>
        </div>
      ) : (
        <>
          <div className="hierarchy-grid">
            {bookmarks.map((note, i) => {
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
                      <span className="hierarchy-card-badge" style={{ background: c.bg, color: c.color }}>
                        {note.fileType?.toUpperCase() || 'PDF'} · {note.fileSize ? `${(note.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}
                      </span>
                      <div className="hierarchy-card-title" style={{ marginTop: 4 }}>{note.title}</div>
                      <div className="hierarchy-card-sub" style={{ flex: 1, marginTop: 2 }}>
                        {note.description || 'No description'}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-light)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {note.subjectId && <span>{note.subjectId.name}</span>}
                        {note.subjectId && note.downloads !== undefined && <span>·</span>}
                        {note.downloads !== undefined && <span>{note.downloads} downloads</span>}
                        <span>·</span>
                        <span>Bookmarked {note.bookmarkedAt ? new Date(note.bookmarkedAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
