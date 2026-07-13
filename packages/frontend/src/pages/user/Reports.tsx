import { useState, useEffect } from 'react';
import { reportApi } from '../../api/report';
import { Flag } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';
import Pagination from '../../components/ui/Pagination';

export default function Reports() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    reportApi.my(page)
      .then(res => {
        setReports(res.data.data.items);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
      })
      .catch(err => showToast('error', getApiError(err, 'Failed to load reports')))
      .finally(() => setLoading(false));
  }, [page, showToast]);

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>My Reports</h1>
      {reports.length === 0 ? (
        <div className="empty-state">
          <Flag size={48} />
          <h3>No reports submitted</h3>
          <p>You can report notes that contain incorrect or inappropriate content.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Note</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600 }}>{r.note?.title || 'Unknown'}</td>
                    <td><span className="badge badge-primary">{r.type}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.reason}</td>
                    <td>
                      <span className={`badge ${r.status === 'resolved' ? 'badge-secondary' : r.status === 'dismissed' ? 'badge-muted' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
