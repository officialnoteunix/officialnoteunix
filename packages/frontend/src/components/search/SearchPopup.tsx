import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchApi } from '../../api/search';
import { Search, X, FileText, BookOpen, University, Notebook, Loader2 } from 'lucide-react';

interface SearchPopupProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchPopup({ open, onClose }: SearchPopupProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (acRef.current) clearTimeout(acRef.current);
    const trimmed = input.trim();
    if (trimmed.length < 2) { setSuggestions([]); return; }
    acRef.current = setTimeout(() => {
      searchApi.autocomplete(trimmed)
        .then(res => { setSuggestions(res.data.data); setActiveIndex(-1); })
        .catch(() => {});
    }, 100);
    return () => { if (acRef.current) clearTimeout(acRef.current); };
  }, [input]);

  useEffect(() => {
    if (open) {
      setInput('');
      setResults(null);
      setHasSearched(false);
      setSuggestions([]);
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const ghostSuggestion = suggestions.find(s =>
    (s.name || s.label).toLowerCase().startsWith(input.trim().toLowerCase())
  );
  const ghostSuffix = ghostSuggestion && input.trim().length >= 2
    ? (ghostSuggestion.name || ghostSuggestion.label).slice(input.trim().length)
    : '';

  const navigateToSuggestion = useCallback((s: any) => {
    onClose();
    switch (s.type) {
      case 'university': navigate(`/notes?university=${s._id}`); break;
      case 'course': navigate(`/courses/${s._id}`); break;
      case 'subject': navigate(`/subjects/${s._id}`); break;
      case 'note': navigate(`/notes/${s._id}`); break;
    }
  }, [navigate, onClose]);

  const completeWithSuggestion = useCallback((name: string) => {
    setInput(name);
    setSuggestions([]);
    setHasSearched(false);
    setResults(null);
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed.length < 2) return;
    setLoading(true);
    setHasSearched(true);
    setSuggestions([]);
    searchApi.search(trimmed)
      .then(res => setResults(res.data.data))
      .catch(() => setResults({ universities: [], courses: [], subjects: [], notes: [], notesTotal: 0 }))
      .finally(() => setLoading(false));
  }, [input]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && ghostSuffix) {
      e.preventDefault();
      completeWithSuggestion((ghostSuggestion!.name || ghostSuggestion!.label));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        completeWithSuggestion(suggestions[activeIndex].name || suggestions[activeIndex].label);
      } else {
        doSearch();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [ghostSuffix, ghostSuggestion, suggestions, activeIndex, completeWithSuggestion, doSearch, onClose]);

  if (!open) return null;

  const inputPad = '14px 0';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', paddingTop: '10vh',
    }} onClick={onClose}>
      <div style={{
        width: 'min(640px, 92%)', background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        maxHeight: '70vh',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          padding: '4px 16px', borderBottom: '1px solid var(--border-color)',
          position: 'relative',
        }}>
          <Search size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
          <div style={{ flex: 1, position: 'relative', marginLeft: 12 }}>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              pointerEvents: 'none', fontSize: 15, fontFamily: 'inherit',
              padding: inputPad, whiteSpace: 'pre', overflow: 'hidden',
            }}>
              <span style={{ color: 'var(--text-main)' }}>{input}</span>
              {ghostSuffix && (
                <span style={{ color: 'var(--text-muted)', opacity: 0.3 }}>{ghostSuffix}</span>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => { setInput(e.target.value); setActiveIndex(-1); }}
              onKeyDown={handleKeyDown}
              placeholder="Search courses, subjects, notes..."
              autoComplete="off"
              style={{
                width: '100%', padding: inputPad, border: 'none', outline: 'none',
                background: 'transparent', color: 'transparent',
                caretColor: 'var(--text-main)',
                fontSize: 15, fontFamily: 'inherit', position: 'relative', zIndex: 1,
              }}
            />
          </div>
          {input && (
            <button type="button" onClick={() => { setInput(''); setSuggestions([]); setHasSearched(false); setResults(null); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-light)', flexShrink: 0 }}>
              <X size={16} />
            </button>
          )}
          <button type="button" onClick={doSearch} disabled={input.trim().length < 2}
            style={{
              background: 'var(--primary)', border: 'none', cursor: input.trim().length >= 2 ? 'pointer' : 'default',
              padding: '8px 16px', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 13, marginLeft: 8,
              opacity: input.trim().length < 2 ? 0.5 : 1, fontFamily: 'inherit',
            }}>
            Search
          </button>
        </div>

        {suggestions.length > 0 && !hasSearched && (
          <div className="dropdown-items" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {suggestions.map((s, i) => (
              <button key={`${s.type}-${s._id}`} type="button"
                onClick={() => navigateToSuggestion(s)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`dropdown-item ${activeIndex === i ? 'active' : ''}`}>
                {s.type === 'university' && <University size={16} className="dropdown-item-icon" data-type="university" />}
                {s.type === 'course' && <BookOpen size={16} className="dropdown-item-icon" data-type="course" />}
                {s.type === 'subject' && <Notebook size={16} className="dropdown-item-icon" data-type="subject" />}
                {s.type === 'note' && <FileText size={16} className="dropdown-item-icon" data-type="note" />}
                <div className="dropdown-item-body">
                  <div className="dropdown-item-label" style={{ fontWeight: activeIndex === i ? 600 : 400 }}>{s.label}</div>
                </div>
                <span className="dropdown-item-meta">{s.type}</span>
              </button>
            ))}
          </div>
        )}

        {hasSearched && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} className="spin" style={{ color: 'var(--text-muted)' }} /></div>
            ) : results && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {results.notesTotal > 0 && (
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Notes ({results.notesTotal})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {results.notes.slice(0, 5).map((n: any) => (
                        <Link key={n._id} to={`/notes/${n._id}`} onClick={onClose}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-main)', fontSize: 14, background: 'var(--bg-subtle)' }}>
                          <FileText size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{n.downloads || 0} downloads</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {results.courses?.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Courses ({results.courses.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {results.courses.map((c: any) => (
                        <Link key={c._id} to={`/courses/${c._id}`} onClick={onClose}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-main)', fontSize: 14, background: 'var(--bg-subtle)' }}>
                          <BookOpen size={14} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{c.universityId?.name || ''}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {results.subjects?.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Subjects ({results.subjects.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {results.subjects.map((s: any) => (
                        <Link key={s._id} to={`/subjects/${s._id}`} onClick={onClose}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-main)', fontSize: 14, background: 'var(--bg-subtle)' }}>
                          <Notebook size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{s.code || ''}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {!results.notesTotal && !results.courses?.length && !results.subjects?.length && (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No results found</p>
                  </div>
                )}
                <button type="button" onClick={onClose}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit', background: 'var(--bg-subtle)', border: 'none', cursor: 'pointer', width: '100%' }}>
                  Close <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
