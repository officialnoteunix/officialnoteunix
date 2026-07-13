import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Trash2, ExternalLink, Search, ArrowUpRight, Clock } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import { emitStatsRefresh } from '../../utils/statsRefresh';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Pagination from '../../components/ui/Pagination';
import { getApiError } from '../../utils/constants';

export default function AdminComments() {
  const { showToast } = useToast();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const fetchComments = async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.comments(p);
      setComments(res.data.data.items);
      setTotalPages(res.data.data.totalPages);
      setTotal(res.data.data.total);
      setPage(p);
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to load comments'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return comments;
    const q = search.toLowerCase();
    return comments.filter(c =>
      c.content?.toLowerCase().includes(q) ||
      c.userId?.fullname?.toLowerCase().includes(q) ||
      c.noteId?.title?.toLowerCase().includes(q)
    );
  }, [comments, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteComment(deleteTarget._id);
      showToast('success', 'Comment deleted');
      emitStatsRefresh();
      setDeleteTarget(null);
      fetchComments(page);
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to delete comment'));
    }
  };

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex-wrap" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Comments</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {total} total{filtered.length !== total && ` · ${filtered.length} filtered`}
          </p>
        </div>
        <div className="search-bar" style={{ maxWidth: 300 }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input type="text" placeholder="Search comments..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><MessageSquare size={48} /><h3>No comments found</h3></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Author</th>
                <th>Comment</th>
                <th>Note</th>
                <th>Date</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                        {c.userId?.fullname?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{c.userId?.fullname || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.content}
                    </div>
                    {c.parentComment && (
                      <span className="badge badge-muted" style={{ fontSize: 10, marginTop: 2, display: 'inline-block' }}>
                        Reply
                      </span>
                    )}
                  </td>
                  <td>
                    <Link to={`/notes/${c.noteId?._id}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {c.noteId?.title || 'Untitled'} <ExternalLink size={11} />
                    </Link>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    <Clock size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setDeleteTarget(c)}
                        className="btn-rounded"
                        style={{
                          padding: '5px 10px', fontSize: 10,
                          backgroundColor: 'var(--danger-light)', color: 'var(--danger)',
                          border: 'none', cursor: 'pointer',
                        }}>
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={fetchComments} />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message={
          deleteTarget
            ? `Are you sure you want to delete this comment by ${deleteTarget.userId?.fullname || 'Unknown'}? This will also remove any replies.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
