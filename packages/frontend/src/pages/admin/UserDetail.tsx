import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import { emitStatsRefresh } from '../../utils/statsRefresh';
import { useAuth } from '../../context/AuthContext';
import type { UserDetail as UserDetailType, Note } from '../../types';
import {
  MAINTAINER_PERMISSIONS,
  DEFAULT_MAINTAINER_PERMISSIONS,
  ROLE_LABELS,
  type Permission,
  type UserRole,
} from '../../utils/constants';
import { ArrowLeft, Users, FileText, Bookmark, Download, Mail, Calendar, Shield, Ban, CheckCircle, Timer, ShieldOff, BadgeCheck, UserCog, Crown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import ConfirmModal from '../../components/ui/ConfirmModal';
import RestrictModal from '../../components/ui/RestrictModal';
import { getApiError } from '../../utils/constants';

function fillMonths(data: { _id: string; count: number }[], monthsBack = 6) {
  const result: { month: string; count: number }[] = [];
  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const found = data.find(d => d._id === key);
    result.push({ month: key, count: found?.count || 0 });
  }
  return result;
}

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

function isSuspended(u: { banned: boolean; suspendedUntil: string | null }): boolean {
  return u.banned && !!u.suspendedUntil && new Date(u.suspendedUntil).getTime() > Date.now();
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [restrictTarget, setRestrictTarget] = useState<UserDetailType | null>(null);
  const [confirmBan, setConfirmBan] = useState<UserDetailType | null>(null);
  const [restrictLoading, setRestrictLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const loadUser = useCallback(() => {
    if (!id) return;
    adminApi.userDetail(id)
      .then(res => setUser(res.data.data))
      .catch(err => showToast('error', getApiError(err, 'Failed to load user details')));
  }, [id, showToast]);

  useEffect(() => {
    setLoading(true);
    adminApi.userDetail(id!)
      .then(res => setUser(res.data.data))
      .catch(err => showToast('error', getApiError(err, 'Failed to load user details')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLift = useCallback(async () => {
    if (!user) return;
    try {
      await adminApi.toggleBan(user._id);
      showToast('success', `Restriction lifted for ${user.fullname}`);
      loadUser(); emitStatsRefresh();
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to lift restriction'));
    }
  }, [user, showToast, loadUser]);

  const handlePermanentBan = useCallback(async () => {
    if (!confirmBan) return;
    setRestrictLoading(true);
    try {
      await adminApi.toggleBan(confirmBan._id);
      showToast('success', `${confirmBan.fullname} has been banned permanently`);
      setConfirmBan(null);
      loadUser(); emitStatsRefresh();
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to ban user'));
    } finally {
      setRestrictLoading(false);
    }
  }, [confirmBan, showToast, loadUser]);

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
        loadUser(); emitStatsRefresh();
      }
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to restrict user'));
    } finally {
      setRestrictLoading(false);
    }
  }, [restrictTarget, showToast, loadUser]);

  const isSelf = currentUser?.id === user?._id;
  const canManageRole = currentUser?.role === 'admin' && !isSelf && user?.role !== 'admin';
  const [rolePanelOpen, setRolePanelOpen] = useState(false);
  const [roleForm, setRoleForm] = useState<UserRole>('student');
  const [permForm, setPermForm] = useState<Permission[]>([]);
  const [roleSaving, setRoleSaving] = useState(false);

  const openRolePanel = useCallback(() => {
    if (!user) return;
    setRoleForm(user.role === 'maintainer' ? 'maintainer' : 'student');
    setPermForm((user.permissions && user.permissions.length ? user.permissions : DEFAULT_MAINTAINER_PERMISSIONS) as Permission[]);
    setRolePanelOpen(true);
  }, [user]);

  const togglePerm = useCallback((key: Permission) => {
    setPermForm(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);
  }, []);

  const handleSaveRole = useCallback(async () => {
    if (!user) return;
    setRoleSaving(true);
    try {
      const payload = roleForm === 'maintainer'
        ? { role: roleForm, permissions: permForm }
        : { role: roleForm as Exclude<UserRole, 'admin'> };
      const res = await adminApi.setUserRole(user._id, payload);
      setUser(prev => prev ? { ...prev, role: res.data.data.role, permissions: res.data.data.permissions } : prev);
      showToast('success', `${user.fullname} is now ${ROLE_LABELS[res.data.data.role]}`);
      setRolePanelOpen(false);
      emitStatsRefresh();
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to update role'));
    } finally {
      setRoleSaving(false);
    }
  }, [user, roleForm, permForm, showToast]);

  const notesChart = useMemo(() => user?.notesByMonth ? fillMonths(user.notesByMonth) : [], [user]);

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;
  if (!user) return <div className="empty-state"><Users size={48} /><h3>User not found</h3></div>;

  const suspended = isSuspended(user);
  const remaining = user.suspendedUntil ? formatRemaining(user.suspendedUntil) : null;

  return (
    <div>
      <button onClick={() => navigate('/admin/users')} className="btn-rounded btn-ghost" style={{ padding: '8px 14px', fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to Users
      </button>

      <div className="flex-wrap" style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div className="user-detail-header">
          <div className="user-avatar" style={{ width: 56, height: 56, fontSize: 22, flexShrink: 0, background: user.avatar ? `url(${user.avatar}) center/cover` : undefined, color: user.avatar ? 'transparent' : undefined }}>{user.avatar ? '' : (user.fullname?.charAt(0).toUpperCase() || '?')}</div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 2 }}>{user.fullname}</h1>
            <div className="user-detail-meta">
              <span className="user-detail-email"><Mail size={13} /> <span className="user-detail-truncate">{user.email}</span></span>
              <span className="user-detail-actions-row">
                <Shield size={13} /> {user.role}
                {user.isVerified && (
                  <span className="badge badge-primary" style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <BadgeCheck size={11} /> Verified
                  </span>
                )}
                {suspended ? (
                  <span className="badge badge-warning" style={{ fontSize: 10 }} title={remaining ? `Remaining: ${remaining}` : ''}>
                    <Timer size={11} style={{ marginRight: 3 }} /> {remaining}
                  </span>
                ) : (
                  <span className={`badge ${user.banned ? 'badge-danger' : 'badge-secondary'}`} style={{ fontSize: 10 }}>
                    {user.banned ? <Ban size={11} style={{ marginRight: 3 }} /> : <CheckCircle size={11} style={{ marginRight: 3 }} />}
                    {user.banned ? 'Banned' : 'Active'}
                  </span>
                )}
                {currentUser?.id === user._id ? (
                  <span style={{ color: 'var(--text-light)', fontSize: 12, fontStyle: 'italic' }}>You</span>
                ) : suspended || user.banned ? (
                  <button onClick={handleLift} className="btn-rounded" style={{ padding: '5px 12px', fontSize: 11, backgroundColor: 'var(--secondary)', color: '#fff', display: 'flex', gap: 4, alignItems: 'center' }}>
                    <CheckCircle size={12} /> Lift Restriction
                  </button>
                ) : (
                  <button onClick={() => setRestrictTarget(user)} className="btn-rounded" style={{ padding: '5px 12px', fontSize: 11, backgroundColor: 'var(--danger)', color: '#fff', display: 'flex', gap: 4, alignItems: 'center' }}>
                    <ShieldOff size={12} /> Restrict
                  </button>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[
          { icon: FileText, label: 'Notes', value: user.stats?.totalNotes || 0, idx: 0 },
          { icon: Bookmark, label: 'Bookmarks', value: user.stats?.totalBookmarks || 0, idx: 1 },
          { icon: Download, label: 'Downloads', value: user.stats?.totalDownloads || 0, idx: 2 },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ borderLeft: `3px solid var(--palette-${s.idx})` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: `var(--palette-${s.idx}-bg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `var(--palette-${s.idx})` }}>
                <s.icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: 28 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
          <Calendar size={14} /> Joined {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {currentUser?.role === 'admin' && !isSelf && user.role !== 'admin' && (
        <div className="content-card" style={{ padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--palette-0-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--palette-0)' }}>
                <UserCog size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Role & Permissions</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {user.role === 'maintainer'
                    ? `${user.permissions?.length || 0} permission(s) granted`
                    : 'Currently a student account'}
                </p>
              </div>
            </div>
            <button onClick={openRolePanel} className="btn-rounded" style={{ padding: '7px 14px', fontSize: 12, backgroundColor: user.role === 'maintainer' ? 'var(--bg-subtle)' : 'var(--primary)', color: user.role === 'maintainer' ? 'var(--text-main)' : '#fff', display: 'flex', gap: 4, alignItems: 'center', border: user.role === 'maintainer' ? '1px solid var(--border-color)' : 'none' }}>
              <UserCog size={13} />
              {user.role === 'maintainer' ? 'Edit Access' : 'Promote to Maintainer'}
            </button>
          </div>

          {user.role === 'maintainer' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(user.permissions && user.permissions.length ? user.permissions : DEFAULT_MAINTAINER_PERMISSIONS).map(perm => {
                const def = MAINTAINER_PERMISSIONS.find(p => p.key === perm);
                return (
                  <span key={perm} className="badge badge-ghost" style={{ fontSize: 11 }}>{def ? def.label : perm}</span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {currentUser?.role === 'admin' && user.role === 'admin' && (
        <div className="content-card" style={{ padding: 20, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13 }}>
          <Crown size={16} style={{ color: 'var(--primary)' }} /> This is an administrator account. Role cannot be changed here.
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 28 }}>
        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Notes Created (6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={notesChart}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                labelStyle={{ color: 'var(--text-muted)', fontWeight: 600 }}
                itemStyle={{ color: 'var(--text-main)' }}
                cursor={{ fill: 'var(--bg-subtle)' }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Activity Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--palette-0-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--palette-0)' }}>
                  <FileText size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Notes</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{user.stats?.totalNotes || 0}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--palette-1-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--palette-1)' }}>
                  <Bookmark size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bookmarks</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{user.stats?.totalBookmarks || 0}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--palette-2-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--palette-2)' }}>
                  <Download size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Downloads</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{user.stats?.totalDownloads || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(() => {
        const recentNotes = user.recentNotes;
        const recentBookmarks = user.recentBookmarks;
        return (
      <div className="grid-2">
        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 14 }}>Recent Notes</h3>
          {recentNotes && recentNotes.length > 0 ? (
            <div>
              {recentNotes.map((n: Note) => (
                <div key={n._id} className="user-recent-item">
                  <span className="user-recent-title">{n.title}</span>
                  <div className="user-recent-meta">
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>{n.downloads} downloads</span>
                    <span className={`badge ${n.approved ? 'badge-secondary' : 'badge-warning'}`} style={{ fontSize: 10, flexShrink: 0 }}>
                      {n.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No notes yet</div>
          )}
        </div>

        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 14 }}>Recent Bookmarks</h3>
          {recentBookmarks && recentBookmarks.length > 0 ? (
            <div>
              {recentBookmarks.map((b) => (
                <div key={b._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                  <Link to={`/notes/${b.noteId?._id}`} style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}>{b.noteId?.title || 'Untitled'}</Link>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                    {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No bookmarks yet</div>
          )}
        </div>
      </div>
        );
      })()}

      {rolePanelOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }} onClick={() => !roleSaving && setRolePanelOpen(false)}>
          <div className="content-card" style={{ padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Manage Role</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>{user.fullname}</p>

            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Role</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {(['student', 'maintainer'] as UserRole[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRoleForm(r)}
                  className="btn-rounded"
                  style={{
                    flex: 1, padding: '10px 12px', fontSize: 13, fontWeight: 600,
                    backgroundColor: roleForm === r ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: roleForm === r ? '#fff' : 'var(--text-main)',
                    border: roleForm === r ? 'none' : '1px solid var(--border-color)',
                  }}
                >
                  {r === 'maintainer' ? 'Maintainer' : 'Student'}
                </button>
              ))}
            </div>

            {roleForm === 'maintainer' && (
              <>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 10 }}>Permissions</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {MAINTAINER_PERMISSIONS.map(p => {
                    const checked = permForm.includes(p.key);
                    return (
                      <label key={p.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 8, cursor: 'pointer', border: '1px solid transparent' }}>
                        <input type="checkbox" checked={checked} onChange={() => togglePerm(p.key)} style={{ marginTop: 2, accentColor: 'var(--primary)' }} />
                        <span>
                          <span style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>{p.label}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => !roleSaving && setRolePanelOpen(false)} className="btn-rounded btn-ghost" style={{ padding: '9px 16px', fontSize: 13 }}>Cancel</button>
              <button onClick={handleSaveRole} disabled={roleSaving} className="btn-rounded" style={{ padding: '9px 18px', fontSize: 13, backgroundColor: 'var(--primary)', color: '#fff', opacity: roleSaving ? 0.6 : 1 }}>
                {roleSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <RestrictModal
        open={!!restrictTarget}
        onClose={() => setRestrictTarget(null)}
        userName={restrictTarget?.fullname || ''}
        onRestrict={handleRestrict}
        loading={restrictLoading}
      />

      <ConfirmModal
        open={!!confirmBan}
        onClose={() => setConfirmBan(null)}
        onConfirm={handlePermanentBan}
        title="Ban User"
        message={`This will permanently block ${confirmBan?.fullname} from accessing the platform. They will not be able to log in or use any features.`}
        confirmLabel="Ban"
        variant="danger"
      />
    </div>
  );
}
