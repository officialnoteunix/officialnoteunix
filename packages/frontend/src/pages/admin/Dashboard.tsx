import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList,
} from 'recharts';
import { Users, FileText, Building2, Clock, Bookmark, AlertTriangle, BookOpen, Library, MessageSquare } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import { getApiError } from '../../utils/constants';

const PIE_COLORS = ['var(--palette-0)', 'var(--palette-1)', 'var(--palette-2)', 'var(--palette-3)', 'var(--palette-4)', 'var(--palette-5)'];

const statCards = [
  { label: 'Total Users', key: 'totalUsers', icon: Users, idx: 0, to: '/admin/users' },
  { label: 'Total Notes', key: 'totalNotes', icon: FileText, idx: 1, to: '/admin/notes' },
  { label: 'Universities', key: 'totalUniversities', icon: Building2, idx: 2, to: '/admin/content' },
  { label: 'Courses', key: 'totalCourses', icon: BookOpen, idx: 3, to: '/admin/content' },
  { label: 'Semesters', key: 'totalSemesters', icon: Library, idx: 4, to: '/admin/content' },
  { label: 'Subjects', key: 'totalSubjects', icon: Bookmark, idx: 5, to: '/admin/content' },
  { label: 'Messages', key: 'totalContactMessages', icon: MessageSquare, idx: 0, to: '/admin/messages' },
];

const pendingCards = [
  { label: 'Pending Notes', key: 'pendingNotes', icon: Clock, idx: 0, cls: 'warning', to: '/admin/notes' },
  { label: 'Pending Reports', key: 'pendingReports', icon: AlertTriangle, idx: 1, cls: 'danger', to: '/admin/reports' },
  { label: 'Unread Messages', key: 'unreadContactMessages', icon: MessageSquare, idx: 2, cls: 'primary', to: '/admin/messages' },
];

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
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats()
      .then(res => setStats(res.data.data))
      .catch(err => showToast('error', getApiError(err, 'Failed to load dashboard stats')))
      .finally(() => setLoading(false));
  }, []);

  const notesChart = useMemo(() => stats?.notesByMonth ? fillMonths(stats.notesByMonth) : [], [stats]);
  const usersChart = useMemo(() => stats?.usersByMonth ? fillMonths(stats.usersByMonth) : [], [stats]);

  const pieData = useMemo(() => [
    { name: 'Universities', value: stats?.totalUniversities || 0 },
    { name: 'Courses', value: stats?.totalCourses || 0 },
    { name: 'Semesters', value: stats?.totalSemesters || 0 },
    { name: 'Subjects', value: stats?.totalSubjects || 0 },
    { name: 'Notes', value: stats?.totalNotes || 0 },
  ], [stats]);

  const totalPie = useMemo(() => pieData.reduce((a, b) => a + b.value, 0), [pieData]);

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  return (
    <div>
      <SEO title="Admin Dashboard" />
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, fontFamily: 'var(--font-heading)' }}>Admin Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>Platform overview and analytics</p>

      <div className="stat-grid-4">
        {[...statCards.slice(0, 4)].map(c => {
          const Icon = c.icon;
          return (
            <Link key={c.key} to={c.to} className="stat-card" style={{ borderLeft: `3px solid var(--palette-${c.idx})`, textDecoration: 'none', display: 'block', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="stat-label">{c.label}</div>
                  <div className="stat-value">{(stats as any)?.[c.key] || 0}</div>
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `var(--palette-${c.idx}-bg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `var(--palette-${c.idx})` }}>
                  <Icon size={18} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 2 }}>Notes Created</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Last 6 months</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={notesChart} barCategoryGap="20%">
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-subtle)', radius: 4 }} />
              <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} name="Notes" animationBegin={0} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 2 }}>Users Created</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Last 6 months</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={usersChart} barCategoryGap="20%">
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-subtle)', radius: 4 }} />
              <Bar dataKey="count" fill="var(--palette-2)" radius={[6, 6, 0, 0]} name="Users" animationBegin={150} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Content Distribution</h3>
          {totalPie > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                    animationBegin={300}
                    animationDuration={800}
                  >
                    {pieData.map((_, i) => (
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
                    formatter={(value: number, name: string) => [`${value} (${((value / totalPie) * 100).toFixed(1)}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                {pieData.filter(d => d.value > 0).map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-muted)' }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: PIE_COLORS[i] }} />
                    {d.name}
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {((d.value / totalPie) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: 13 }}>
              No content data yet
            </div>
          )}
        </div>

        <div className="grid-2" style={{ gap: 16, alignContent: 'start' }}>
          {[...statCards.slice(4), ...pendingCards].map((c: any) => {
            const Icon = c.icon;
            const isDanger = c.cls === 'danger';
            const isWarning = c.cls === 'warning';
            const isPrimary = c.cls === 'primary';
            return (
              <Link key={c.key} to={c.to} className="stat-card" style={{
                borderLeft: `3px solid ${isDanger ? 'var(--danger)' : isWarning ? 'var(--warning)' : isPrimary ? 'var(--primary)' : `var(--palette-${c.idx})`}`,
                textDecoration: 'none', display: 'block', cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div className="stat-label">{c.label}</div>
                    <div className="stat-value">{(stats as any)?.[c.key] || 0}</div>
                  </div>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: isDanger ? 'var(--danger-light)' : isWarning ? 'var(--warning-light)' : isPrimary ? 'var(--primary-light)' : `var(--palette-${c.idx}-bg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isDanger ? 'var(--danger)' : isWarning ? 'var(--warning)' : isPrimary ? 'var(--primary)' : `var(--palette-${c.idx})`,
                  }}>
                    <Icon size={18} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
