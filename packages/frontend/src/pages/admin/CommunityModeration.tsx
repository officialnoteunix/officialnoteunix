import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, Users, Filter, ShieldAlert } from 'lucide-react';
import { feedApi } from '../../api/feed';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';
import ConfirmModal from '../../components/ui/ConfirmModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';

export default function CommunityModeration() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<any>(null);
  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feedApi.adminPosts({ page, limit: 20, q: search || undefined, author: authorFilter || undefined });
      setPosts(res.data.data.posts || []);
      setTotal(res.data.data.total || 0);
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to load posts'));
    } finally {
      setLoading(false);
    }
  }, [page, search, authorFilter, showToast]);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await feedApi.adminDelete(toDelete.id);
      showToast('success', 'Post removed');
      setPosts(prev => prev.filter(p => p.id !== toDelete.id));
      setTotal(t => Math.max(0, t - 1));
    } catch (err) {
      showToast('error', getApiError(err, 'Delete failed'));
    } finally {
      setToDelete(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <ShieldAlert size={22} color="var(--primary)" />
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Community Moderation</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
        {isAdmin
          ? 'Full control: review and remove any community post across the platform.'
          : 'Review and remove community posts flagged or surfaced for moderation.'}
      </p>

      <div className="content-card" style={{ padding: 16, marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            placeholder="Search post content or tag..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
          <Users size={16} color="var(--text-muted)" />
          <input
            placeholder="Filter by author user id..."
            value={authorFilter}
            onChange={(e) => { setAuthorFilter(e.target.value); setPage(1); }}
          />
        </div>
        {(search || authorFilter) && (
          <button className="btn-rounded btn-outline" onClick={() => { setSearch(''); setAuthorFilter(''); setPage(1); }}>
            <Filter size={14} /> Clear
          </button>
        )}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
          {posts.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>No posts found.</div>
          ) : (
            posts.map((p) => (
              <div key={p.id} style={{ display: 'flex', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--border-color)', alignItems: 'flex-start' }}>
                {p.media?.[0]?.kind === 'image' && (
                  <img src={p.media[0].url} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                    <Link to={`/community/${p.author?.username || p.author?.id}`} style={{ fontWeight: 700, color: 'var(--text-main)', textDecoration: 'none' }}>
                      {p.author?.fullname || 'Unknown'}
                    </Link>
                    <span style={{ color: 'var(--text-muted)' }}>· {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.content || '(media only)'}
                  </p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>♥ {p.likesCount}</span>
                    <span>💬 {p.commentsCount}</span>
                    {p.tags?.length > 0 && <span>{p.tags.map((t: string) => `#${t}`).join(' ')}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Link to={`/community/post/${p.id}`} className="btn-rounded btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}>View</Link>
                  <button className="btn-rounded btn-danger" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setToDelete(p)}>
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: 16 }}>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      )}

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Remove post?"
        message={`This will permanently delete the post by ${toDelete?.author?.fullname || 'this user'} and its comments. This cannot be undone.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
