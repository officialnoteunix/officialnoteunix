import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/ui/Pagination';
import type { AuditLog, PaginatedData, APIResponse } from '../../types';
import { Shield, ShieldAlert, Trash2, Ban, UserX, CheckCircle, XCircle, MessageCircle, Clock } from 'lucide-react';
import { getApiError } from '../../utils/constants';

const actionMeta: Record<string, { label: string; icon: any; color: string }> = {
  note_approve: { label: 'Note Approved', icon: CheckCircle, color: '#059669' },
  note_reject: { label: 'Note Rejected', icon: XCircle, color: '#dc2626' },
  note_delete: { label: 'Note Deleted', icon: Trash2, color: '#dc2626' },
  user_ban: { label: 'User Banned', icon: Ban, color: '#dc2626' },
  user_unban: { label: 'User Unbanned', icon: Shield, color: '#059669' },
  user_suspend: { label: 'User Suspended', icon: Clock, color: '#d97706' },
  user_delete: { label: 'User Deleted', icon: UserX, color: '#dc2626' },
  comment_delete: { label: 'Comment Deleted', icon: MessageCircle, color: '#dc2626' },
  report_resolve: { label: 'Report Resolved', icon: Shield, color: '#059669' },
  report_dismiss: { label: 'Report Dismissed', icon: ShieldAlert, color: '#6b7280' },
  send_email: { label: 'Email Sent', icon: MessageCircle, color: '#2563eb' },
  ad_create: { label: 'Ad Created', icon: CheckCircle, color: '#059669' },
  ad_update: { label: 'Ad Updated', icon: Shield, color: '#d97706' },
  ad_delete: { label: 'Ad Deleted', icon: Trash2, color: '#dc2626' },
  content_create: { label: 'Content Created', icon: CheckCircle, color: '#059669' },
  content_update: { label: 'Content Updated', icon: Shield, color: '#d97706' },
  content_delete: { label: 'Content Deleted', icon: Trash2, color: '#dc2626' },
};

export default function AuditLogs() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch = useCallback((p = 1) => {
    setLoading(true);
    adminApi.auditLogs(p)
      .then(res => {
        const d = (res.data as APIResponse<PaginatedData<AuditLog>>).data;
        setLogs(d.items); setPage(d.page); setTotalPages(d.totalPages); setTotal(d.total);
      })
      .catch(err => showToast('error', getApiError(err, 'Failed to load audit logs')))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Audit Logs</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Track all admin actions</p>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state"><Shield size={48} /><h3>No audit logs found</h3></div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const meta = actionMeta[log.action] || { label: log.action, icon: Shield, color: 'var(--text-muted)' };
                  const Icon = meta.icon;
                  return (
                    <tr key={log._id}>
                      <td data-card-title="Admin" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="user-avatar" style={{ width: 24, height: 24, fontSize: 9 }}>
                          {log.adminId?.fullname?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{log.adminId?.fullname || 'Unknown'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.adminId?.email || ''}</div>
                        </div>
                      </td>
                      <td data-card-title="Action">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                          <Icon size={14} style={{ color: meta.color }} />
                          <span style={{ color: meta.color }}>{meta.label}</span>
                        </span>
                      </td>
                      <td data-card-title="Target" style={{ fontSize: 13 }}>
                        <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: 11 }}>{log.targetType}</span>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{log.targetTitle || log.targetId}</div>
                      </td>
                      <td data-card-title="Details" style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.details || '-'}
                      </td>
                      <td data-card-title="Date" style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={fetch} />
        </>
      )}
    </div>
  );
}
