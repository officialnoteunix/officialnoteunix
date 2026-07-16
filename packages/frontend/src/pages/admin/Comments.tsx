import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Trash2, Search, Clock, ExternalLink } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import { emitStatsRefresh } from '../../utils/statsRefresh';
import ConfirmModal from '../../components/ui/ConfirmModal';
import DetailModal from '../../components/ui/DetailModal';
import Pagination from '../../components/ui/Pagination';
import { getApiError } from '../../utils/constants';

interface AdminComment {
  _id: string;
  content: string;
  userId?: { _id: string; fullname: string; avatar?: string | null };
  noteId?: { _id: string; title: string };
  parentComment?: string | null;
  createdAt: string;
}

export default function AdminComments() {
  const { showToast } = useToast();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminComment | null>(null);
  const [detailTarget, setDetailTarget] = useState<AdminComment | null>(null);

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
                <th>Comment</th>
                <th>Date</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id} onClick={() => window.innerWidth <= 640 && setDetailTarget(c)}>
                  <td data-card-title="Comment">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                        {c.userId?.fullname?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{c.userId?.fullname || 'Unknown'}</span>
                      {c.parentComment && (
                        <span className="badge badge-muted" style={{ fontSize: 10 }}>Reply</span>
                      )}
                    </div>
                    <div className="comment-text-truncate" style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5, marginBottom: 4, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {c.content}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--primary)' }}>{c.noteId?.title || 'Untitled'}</span>
                      <span>·</span>
                      <Clock size={10} />
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    <Clock size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                        className="btn-rounded"
                        style={{
                          padding: '5px 10px', fontSize: 10,
                          backgroundColor: 'var(--danger-light)', color: 'var(--danger)',
                          border: 'none', cursor: 'pointer', flexShrink: 0,
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

      <DetailModal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.noteId?.title || 'Comment'}
        fields={[
          { label: 'Author', value: detailTarget?.userId?.fullname || 'Unknown' },
          { label: 'Comment', value: detailTarget?.content || '-' },
          { label: 'Type', value: detailTarget?.parentComment ? 'Reply' : 'Top-level' },
          { label: 'Date', value: detailTarget?.createdAt ? new Date(detailTarget.createdAt).toLocaleDateString() : '-' },
        ]}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to={`/notes/${detailTarget?.noteId?._id}`} target="_blank" rel="noopener noreferrer"
            className="btn-rounded btn-primary" style={{ padding: '7px 14px', fontSize: 12, display: 'flex', gap: 4, alignItems: 'center', textDecoration: 'none' }}
            onClick={() => setDetailTarget(null)}>
            <ExternalLink size={13} /> View Note
          </Link>
          <button onClick={() => { setDetailTarget(null); setDeleteTarget(detailTarget); }} className="btn-rounded" style={{ padding: '7px 14px', fontSize: 12, backgroundColor: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', gap: 4, alignItems: 'center' }}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </DetailModal>

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
