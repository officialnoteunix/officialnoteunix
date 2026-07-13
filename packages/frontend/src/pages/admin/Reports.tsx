import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reportApi } from '../../api/report';
import { useToast } from '../../context/ToastContext';
import { emitStatsRefresh } from '../../utils/statsRefresh';
import DetailModal from '../../components/ui/DetailModal';
import Pagination from '../../components/ui/Pagination';
import type { Report, PaginatedData, APIResponse } from '../../types';
import { Flag, CheckCircle, XCircle, Filter } from 'lucide-react';
import { getApiError } from '../../utils/constants';

interface ReportDetail extends Report {
  note?: { _id: string; title: string };
  reportedBy?: { _id: string; fullname: string; avatar?: string | null };
}

export default function AdminReports() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<ReportDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [detailTarget, setDetailTarget] = useState<ReportDetail | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReports = useCallback((status: string, p = 1) => {
    setLoading(true);
    const params: Record<string, string | number> = { page: p, limit: 5 };
    if (status) params.status = status;
    reportApi.list(params)
      .then(res => {
        const d = (res.data as APIResponse<PaginatedData<ReportDetail>>).data;
        setReports(d.items); setPage(d.page); setTotalPages(d.totalPages); setTotal(d.total);
      })
      .catch(err => showToast('error', getApiError(err, 'Failed to load reports')))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { setPage(1); fetchReports(statusFilter, 1); }, [statusFilter, fetchReports]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    try {
      await reportApi.updateStatus(id, status);
      showToast('success', `Report ${status}`);
      emitStatsRefresh();
      fetchReports(statusFilter, page);
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to update report'));
    }
  }, [statusFilter, page, fetchReports, showToast]);

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Reports</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage user-submitted reports</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: '', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'resolved', label: 'Resolved' },
          { key: 'dismissed', label: 'Dismissed' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`btn-rounded ${statusFilter === f.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 16px', fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}
          >
            {statusFilter === f.key && <Filter size={12} />}
            {f.label}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="empty-state"><Flag size={48} /><h3>No reports found</h3></div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Note</th>
                  <th>Reported By</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r._id} onClick={() => window.innerWidth <= 640 && setDetailTarget(r)}>
                    <td data-card-title style={{ fontWeight: 600, fontSize: 13 }}><Link to={`/notes/${r.note?._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{r.note?.title || 'Unknown'}</Link></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="user-avatar" style={{ width: 24, height: 24, fontSize: 9, background: r.reportedBy?.avatar ? `url(${r.reportedBy.avatar}) center/cover` : undefined, color: r.reportedBy?.avatar ? 'transparent' : undefined }}>{r.reportedBy?.avatar ? '' : (r.reportedBy?.fullname?.charAt(0) || '?')}</div>
                      {r.reportedBy?.fullname || 'Unknown'}
                    </td>
                    <td><span className="badge badge-primary" style={{ fontSize: 11 }}>{r.type}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</td>
                    <td>
                      <span className={`badge ${r.status === 'resolved' ? 'badge-secondary' : r.status === 'dismissed' ? 'badge-muted' : 'badge-warning'}`} style={{ fontSize: 11 }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      {r.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => updateStatus(r._id, 'resolved')} className="btn-rounded btn-secondary" style={{ padding: '5px 10px', fontSize: 10, display: 'flex', gap: 3, alignItems: 'center' }}>
                            <CheckCircle size={10} /> Resolve
                          </button>
                          <button onClick={() => updateStatus(r._id, 'dismissed')} className="btn-rounded" style={{ padding: '5px 10px', fontSize: 10, backgroundColor: 'var(--text-light)', color: '#fff', display: 'flex', gap: 3, alignItems: 'center' }}>
                            <XCircle size={10} /> Dismiss
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={(p) => fetchReports(statusFilter, p)} />
        </>
      )}

      <DetailModal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.note?.title || 'Report'}
        fields={[
          { label: 'Reported By', value: detailTarget?.reportedBy?.fullname || 'Unknown' },
          { label: 'Type', value: detailTarget?.type || '-' },
          { label: 'Reason', value: detailTarget?.reason || '-' },
          { label: 'Status', value: detailTarget?.status || '-' },
          { label: 'Date', value: detailTarget?.createdAt ? new Date(detailTarget.createdAt).toLocaleDateString() : '-' },
        ]}
      >
        {detailTarget?.status === 'pending' && (
          <>
            <button onClick={() => { setDetailTarget(null); updateStatus(detailTarget._id, 'resolved'); }} className="btn-rounded btn-secondary" style={{ padding: '7px 14px', fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
              <CheckCircle size={13} /> Resolve
            </button>
            <button onClick={() => { setDetailTarget(null); updateStatus(detailTarget._id, 'dismissed'); }} className="btn-rounded" style={{ padding: '7px 14px', fontSize: 12, backgroundColor: 'var(--text-light)', color: '#fff', display: 'flex', gap: 4, alignItems: 'center' }}>
              <XCircle size={13} /> Dismiss
            </button>
          </>
        )}
      </DetailModal>
    </div>
  );
}
