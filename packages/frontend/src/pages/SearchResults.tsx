import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { searchApi } from '../api/search';
import { Search, FileText, BookOpen, BookText, X, GraduationCap, ExternalLink } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/constants';
import Pagination from '../components/ui/Pagination';
import AdSlot from '../components/ad/AdSlot';

const cardPalette = [
  { bg: 'var(--palette-0-bg)', color: 'var(--palette-0)' },
  { bg: 'var(--palette-1-bg)', color: 'var(--palette-1)' },
  { bg: 'var(--palette-2-bg)', color: 'var(--palette-2)' },
  { bg: 'var(--palette-3-bg)', color: 'var(--palette-3)' },
  { bg: 'var(--palette-4-bg)', color: 'var(--palette-4)' },
  { bg: 'var(--palette-5-bg)', color: 'var(--palette-5)' },
];

function getCloudinaryThumbnail(note: any): string | null {
  if (!note.cloudinaryUrl) return null;
  const isImagePath = note.cloudinaryUrl.includes('/image/upload/');
  if (!isImagePath) return null;
  const parts = note.cloudinaryUrl.split('/upload/');
  if (parts.length !== 2) return null;
  return `${parts[0]}/upload/w_400,c_fill,pg_1/${parts[1]}`;
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState(q);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notePage, setNotePage] = useState(1);

  useEffect(() => {
    setInput(q);
  }, [q]);

  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const trimmed = input.trim();
    if (trimmed && trimmed.length >= 2) {
      timerRef.current = setTimeout(() => {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true });
      }, 500);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [input, navigate]);

  useEffect(() => {
    if (!q || q.length < 2) { setResults(null); return; }
    setLoading(true);
    searchApi.search(q, notePage)
      .then(res => setResults(res.data.data))
      .catch(err => showToast('error', getApiError(err, 'Search failed')))
      .finally(() => setLoading(false));
  }, [q, notePage, showToast]);

  useEffect(() => {
    setNotePage(1);
  }, [q]);

  const renderNoteCard = (note: any, i: number) => {
    const c = cardPalette[i % cardPalette.length];
    const thumb = getCloudinaryThumbnail(note);
    return (
      <Link key={note._id} to={`/notes/${note._id}`} className="note-card" style={{ textDecoration: 'none', position: 'relative' }}>
        {thumb && (
          <div style={{ width: '100%', height: 140, overflow: 'hidden', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', background: 'var(--bg-subtle)' }}>
            <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ padding: thumb ? '12px 16px 16px' : '16px' }}>
          <span className="hierarchy-card-badge" style={{ background: c.bg, color: c.color, marginBottom: 6 }}>Note</span>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--text-main)', lineHeight: 1.3 }}>{note.title}</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {note.description || 'No description'}
          </p>
          <div className="note-card-meta" style={{ marginTop: 10 }}>
            <span>{note.downloads || 0} downloads</span>
            {note.subjectId?.name && <span>· {note.subjectId.name}</span>}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div style={{ padding: '100px 5% 60px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)', marginBottom: q ? 32 : 0,
      }}>
        <div style={{
          padding: '0 16px', display: 'flex', alignItems: 'center',
          color: 'var(--text-light)', flexShrink: 0,
        }}>
          <Search size={18} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Search courses, subjects, notes..."
          style={{
            flex: 1, padding: '14px 0', border: 'none', outline: 'none',
            background: 'transparent', color: 'var(--text-main)', fontSize: 15,
            fontFamily: 'inherit',
          }}
        />
        {input && (
          <button type="button" onClick={() => { setInput(''); navigate('/search', { replace: true }); inputRef.current?.focus(); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0 12px', color: 'var(--text-light)',
            }}>
            <X size={16} />
          </button>
        )}
      </div>

      {!q ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 'var(--radius-full)',
            background: 'var(--primary-light)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <Search size={28} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Search Notes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Type at least 2 characters to find courses, subjects, and notes.
          </p>
        </div>
      ) : loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
      ) : results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>
            Results for "<span style={{ color: 'var(--primary)' }}>{q}</span>"
          </h2>

          {results.courses?.length > 0 && (
            <section>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--secondary)' }}>
                <BookOpen size={16} /> Courses ({results.courses.length})
              </h3>
              <div className="hierarchy-grid">
                {results.courses.map((c: any, i: number) => {
                  const pal = cardPalette[i % cardPalette.length];
                  return (
                    <Link key={c._id} to={`/courses/${c._id}`} className="hierarchy-card" style={{ borderLeftColor: pal.color, textDecoration: 'none' }}>
                      <span className="hierarchy-card-badge" style={{ background: pal.bg, color: pal.color }}>Course</span>
                      <div className="hierarchy-card-title">{c.name}</div>
                      <div className="hierarchy-card-sub">{c.universityId?.name || ''}</div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {results.subjects?.length > 0 && (
            <section>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--warning)' }}>
                <BookText size={16} /> Subjects ({results.subjects.length})
              </h3>
              <div className="hierarchy-grid">
                {results.subjects.map((s: any, i: number) => {
                  const pal = cardPalette[i % cardPalette.length];
                  return (
                    <Link key={s._id} to={`/subjects/${s._id}`} className="hierarchy-card" style={{ borderLeftColor: pal.color, textDecoration: 'none' }}>
                      <span className="hierarchy-card-badge" style={{ background: pal.bg, color: pal.color }}>Subject</span>
                      <div className="hierarchy-card-title">{s.name}</div>
                      <div className="hierarchy-card-sub">{s.code || ''}</div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <AdSlot slot="in_content" />

          {results.notes?.length > 0 && (
            <section>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}>
                <FileText size={16} /> Notes ({results.notesTotal || results.notes.length})
              </h3>
              <div className="note-grid">
                {results.notes.map((note: any, i: number) => renderNoteCard(note, i))}
              </div>
              <Pagination page={notePage} totalPages={results.notesTotalPages || 1} total={results.notesTotal || 0} onPageChange={setNotePage} />
            </section>
          )}

          {(!results.courses?.length && !results.subjects?.length && !results.notes?.length) && (
            <div className="empty-state">
              <Search size={48} />
              <h3>No results found</h3>
              <p>Try a different search term.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
