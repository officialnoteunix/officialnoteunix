import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../../api/user';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList,
} from 'recharts';
import { Upload, Bookmark, FileText, BookOpen, ArrowRight, Download } from 'lucide-react';

const PIE_COLORS = ['var(--palette-1)', 'var(--palette-4)'];

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

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 2, fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
        {payload[0].value} {payload[0].name}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.dashboardStats()
      .then(res => setStats(res.data.data))
      .catch(err => showToast('error', getApiError(err, 'Failed to load dashboard')))
      .finally(() => setLoading(false));
  }, []);

  const notesChart = useMemo(() => stats?.notesByMonth ? fillMonths(stats.notesByMonth) : [], [stats]);

  const statusPie = useMemo(() => [
    { name: 'Approved', value: stats?.approvedNotes || 0 },
    { name: 'Pending', value: stats?.pendingNotes || 0 },
  ], [stats]);

  const totalStatus = useMemo(() => statusPie.reduce((a, b) => a + b.value, 0), [statusPie]);

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  const statCards = [
    { label: 'Total Notes', value: stats?.totalNotes || 0, icon: FileText, paletteIdx: 0, to: '/user/my-notes' },
    { label: 'Bookmarks', value: stats?.totalBookmarks || 0, icon: Bookmark, paletteIdx: 1, to: '/user/bookmarks' },
    { label: 'Downloads', value: stats?.totalDownloads || 0, icon: Download, paletteIdx: 2, to: '/user/my-notes' },
  ];

  const quickActions = [
    { to: '/user/upload', label: 'Upload Note', icon: Upload, desc: 'Share your study materials' },
    { to: '/user/browse', label: 'Browse Notes', icon: BookOpen, desc: 'Discover notes from peers' },
    { to: '/user/bookmarks', label: 'Bookmarks', icon: Bookmark, desc: 'View your saved notes' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 4 }}>
          Welcome back, {user?.fullname?.split(' ')[0] || 'User'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link key={i} to={card.to} className="stat-card" style={{
              borderLeft: `3px solid var(--palette-${card.paletteIdx})`,
              padding: '20px 24px', textDecoration: 'none', display: 'block', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value">{card.value}</div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `var(--palette-${card.paletteIdx}-bg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: `var(--palette-${card.paletteIdx})`,
                }}>
                  <Icon size={20} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        <div className="content-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Your Activity</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last 6 months</span>
          </div>
          {notesChart.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={notesChart} barCategoryGap="20%">
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-subtle)', radius: 4 }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} name="Notes" animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: 13 }}>
              No activity data yet
            </div>
          )}
        </div>

        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Note Status</h3>
          {totalStatus > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusPie}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={75}
                    dataKey="value"
                    paddingAngle={4}
                    animationDuration={800}
                  >
                    {statusPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="outside"
                      formatter={(v: number) => v > 0 ? v : ''}
                      style={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }}
                    />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      borderRadius: 10, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    }}
                    itemStyle={{ color: 'var(--text-main)' }}
                    formatter={(value: number, name: string) => [`${value} (${((value / totalStatus) * 100).toFixed(1)}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
                {statusPie.filter(d => d.value > 0).map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: PIE_COLORS[i] }} />
                    {d.name}
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {((d.value / totalStatus) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: 13 }}>
              No notes uploaded yet
            </div>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Quick Actions</h3>
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={i} to={action.to} className="content-card" style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                textDecoration: 'none', cursor: 'pointer',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', flexShrink: 0,
                }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>{action.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{action.desc}</div>
                </div>
                <ArrowRight size={14} color="var(--text-light)" />
              </Link>
            );
          })}
        </div>

        <div className="content-card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Recent Notes</h3>
            {stats?.recentNotes?.length > 0 && (
              <Link to="/user/my-notes" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
            )}
          </div>
          {stats?.recentNotes?.length > 0 ? (
            <div>
              {stats.recentNotes.map((note: any, i: number) => (
                <Link key={note._id} to={`/notes/${note._id}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 24px', textDecoration: 'none',
                  borderBottom: i < stats.recentNotes.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(note.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                    background: note.approved ? 'var(--secondary-light)' : 'var(--warning-light)',
                    color: note.approved ? 'var(--secondary)' : 'var(--warning)',
                  }}>{note.approved ? 'Approved' : 'Pending'}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <FileText size={32} color="var(--text-light)" style={{ marginBottom: 8, opacity: 0.4 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No notes uploaded yet.</p>
              <Link to="/user/upload" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>Upload your first note</Link>
            </div>
          )}
        </div>
      </div>

      <div className="content-card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Recent Bookmarks</h3>
          {stats?.recentBookmarks?.length > 0 && (
            <Link to="/user/bookmarks" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
          )}
        </div>
        {stats?.recentBookmarks?.length > 0 ? (
          <div>
            {stats.recentBookmarks.map((bm: any, i: number) => (
              <Link key={bm._id} to={`/notes/${bm.noteId?._id}`} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 24px', textDecoration: 'none',
                borderBottom: i < stats.recentBookmarks.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `var(--palette-${i % 6}-bg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: `var(--palette-${i % 6})`, flexShrink: 0,
                }}>
                  <Bookmark size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bm.noteId?.title || 'Unknown'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(bm.createdAt).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <Bookmark size={32} color="var(--text-light)" style={{ marginBottom: 8, opacity: 0.4 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No bookmarks yet.</p>
            <Link to="/user/browse" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>Browse notes</Link>
          </div>
        )}
      </div>
    </div>
  );
}
