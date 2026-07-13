import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import { emitStatsRefresh } from '../../utils/statsRefresh';
import ConfirmModal from '../../components/ui/ConfirmModal';
import DetailModal from '../../components/ui/DetailModal';
import RestrictModal from '../../components/ui/RestrictModal';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../context/AuthContext';
import type { User, PaginatedData } from '../../types';
import { Users as UsersIcon, Ban, CheckCircle, Shield, ArrowUpRight, Clock, ShieldOff } from 'lucide-react';
import { getApiError } from '../../utils/constants';

function formatRemaining(suspendedUntil: string): string | null {
  const diff = new Date(suspendedUntil).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function isSuspended(u: User): boolean {
  return u.banned && !!u.suspendedUntil && new Date(u.suspendedUntil).getTime() > Date.now();
}

export default function Users() {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [restrictTarget, setRestrictTarget] = useState<User | null>(null);
  const [confirmBan, setConfirmBan] = useState<User | null>(null);
  const [restrictLoading, setRestrictLoading] = useState(false);
  const [detailTarget, setDetailTarget] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchUsers = useCallback((p = 1) => {
    setLoading(true);
    adminApi.users(p, 5)
      .then(res => {
        const d = res.data.data as PaginatedData<User>;
        setUsers(d.items); setPage(d.page); setTotalPages(d.totalPages); setTotal(d.total);
      })
      .catch(err => showToast('error', getApiError(err, 'Failed to load users')))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const handleLift = useCallback(async (u: User) => {
    try {
      await adminApi.toggleBan(u._id);
      showToast('success', `Restriction lifted for ${u.fullname}`);
      fetchUsers(page); emitStatsRefresh();
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to lift restriction'));
    }
  }, [fetchUsers, page, showToast]);

  const handlePermanentBan = useCallback(async () => {
    if (!confirmBan) return;
    setRestrictLoading(true);
    try {
      await adminApi.toggleBan(confirmBan._id);
      showToast('success', `${confirmBan.fullname} has been banned permanently`);
      setConfirmBan(null);
      fetchUsers(page); emitStatsRefresh();
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to ban user'));
    } finally {
      setRestrictLoading(false);
    }
  }, [confirmBan, fetchUsers, page, showToast]);

  const handleRestrict = useCallback(async (durationHours: number | 'permanent') => {
    if (!restrictTarget) return;
    setRestrictLoading(true);
    try {
      if (durationHours === 'permanent') {
        setConfirmBan(restrictTarget);
        setRestrictTarget(null);
      } else {
        await adminApi.suspendUser(restrictTarget._id, durationHours);
        showToast('success', `${restrictTarget.fullname} has been restricted for ${durationHours}h`);
        setRestrictTarget(null);
        fetchUsers(page); emitStatsRefresh();
      }
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to restrict user'));
    } finally {
      setRestrictLoading(false);
    }
  }, [restrictTarget, fetchUsers, page, showToast]);

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex-wrap" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Users</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{total} registered users</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="empty-state"><UsersIcon size={48} /><h3>No users</h3></div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const suspended = isSuspended(u);
                  const remaining = u.suspendedUntil ? formatRemaining(u.suspendedUntil) : null;
                  return (
                  <tr key={u._id} onClick={() => window.innerWidth <= 640 && setDetailTarget(u)}>
                    <td data-card-title>
                      <Link to={`/admin/users/${u._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12, background: u.avatar ? `url(${u.avatar}) center/cover` : undefined, color: u.avatar ? 'transparent' : undefined }}>{u.avatar ? '' : (u.fullname?.charAt(0).toUpperCase() || '?')}</div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{u.fullname}</span>
                        <ArrowUpRight size={12} style={{ color: 'var(--text-light)' }} />
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-ghost'}`}>
                        {u.role === 'admin' && <Shield size={11} style={{ marginRight: 3 }} />}
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {suspended ? (
                        <span className="badge badge-warning" title={`Remaining: ${remaining || 'expired'}`}>
                          <Clock size={11} style={{ marginRight: 3 }} />
                          Suspended ({remaining})
                        </span>
                      ) : (
                        <span className={`badge ${u.banned ? 'badge-danger' : 'badge-secondary'}`}>
                          {u.banned ? <Ban size={11} style={{ marginRight: 3 }} /> : <CheckCircle size={11} style={{ marginRight: 3 }} />}
                          {u.banned ? 'Banned' : 'Active'}
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {currentUser?.id === u._id ? (
                        <span style={{ color: 'var(--text-light)', fontSize: 12, fontStyle: 'italic' }}>You</span>
                      ) : suspended || u.banned ? (
                        <button onClick={() => handleLift(u)} className="btn-rounded" style={{ padding: '6px 12px', fontSize: 11, backgroundColor: 'var(--secondary)', color: '#fff', display: 'flex', gap: 4, alignItems: 'center' }}>
                          <CheckCircle size={12} /> Lift
                        </button>
                      ) : (
                        <button onClick={() => { setRestrictTarget(u); }} className="btn-rounded" style={{ padding: '6px 12px', fontSize: 11, backgroundColor: 'var(--danger)', color: '#fff', display: 'flex', gap: 4, alignItems: 'center' }}>
                          <ShieldOff size={12} /> Restrict
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={fetchUsers} />
        </>
      )}

      <RestrictModal
        open={!!restrictTarget}
        onClose={() => { setRestrictTarget(null); }}
        userName={restrictTarget?.fullname || ''}
        onRestrict={handleRestrict}
        loading={restrictLoading}
      />

      <ConfirmModal
        open={!!confirmBan}
        onClose={() => setConfirmBan(null)}
        onConfirm={handlePermanentBan}
        title="Permanent Ban"
        message={`This will permanently block ${confirmBan?.fullname} from accessing the platform. They will not be able to log in or use any features.`}
        confirmLabel="Ban Permanently"
        variant="danger"
        loading={restrictLoading}
      />

      <DetailModal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.fullname || ''}
        fields={[
          { label: 'Email', value: detailTarget?.email || '-' },
          { label: 'Role', value: detailTarget?.role || '-' },
          { label: 'Status', value: detailTarget ? isSuspended(detailTarget) ? `Suspended (${formatRemaining(detailTarget.suspendedUntil!)})` : detailTarget.banned ? 'Banned' : 'Active' : '-' },
          { label: 'Joined', value: detailTarget?.createdAt ? new Date(detailTarget.createdAt).toLocaleDateString() : '-' },
        ]}
      >
        {detailTarget && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {isSuspended(detailTarget) || detailTarget.banned ? (
              <button onClick={() => { const u = detailTarget; setDetailTarget(null); handleLift(u); }} className="btn-rounded" style={{ padding: '7px 14px', fontSize: 12, backgroundColor: 'var(--secondary)', color: '#fff', display: 'flex', gap: 4, alignItems: 'center' }}>
                <CheckCircle size={13} /> Lift Restriction
              </button>
            ) : (
              <button onClick={() => { setDetailTarget(null); setRestrictTarget(detailTarget); }} className="btn-rounded" style={{ padding: '7px 14px', fontSize: 12, backgroundColor: 'var(--danger)', color: '#fff', display: 'flex', gap: 4, alignItems: 'center' }}>
                <ShieldOff size={13} /> Restrict
              </button>
            )}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
