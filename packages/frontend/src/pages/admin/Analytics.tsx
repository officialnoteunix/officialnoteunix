import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, Download, FileText, Users } from 'lucide-react';
import { getApiError } from '../../utils/constants';

const PIE_COLORS = ['var(--palette-0)', 'var(--palette-1)', 'var(--palette-2)', 'var(--palette-3)', 'var(--palette-4)'];

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

function fillDownloads(data: { _id: string; downloads: number }[], monthsBack = 6) {
  const result: { month: string; downloads: number }[] = [];
  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const found = data.find(d => d._id === key);
    result.push({ month: key, downloads: found?.downloads || 0 });
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
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontWeight: 700, color: p.color || 'var(--text-main)' }}>
          {p.value} {p.name}
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.analytics()
      .then(res => setData(res.data.data))
      .catch(err => showToast('error', getApiError(err, 'Failed to load analytics')))
      .finally(() => setLoading(false));
  }, []);

  const notesChart = useMemo(() => data?.notesByMonth ? fillMonths(data.notesByMonth) : [], [data]);
  const usersChart = useMemo(() => data?.usersByMonth ? fillMonths(data.usersByMonth) : [], [data]);
  const downloadsChart = useMemo(() => data?.monthlyDownloads ? fillDownloads(data.monthlyDownloads) : [], [data]);

  const topNotesChart = useMemo(() => {
    if (!data?.topNotes?.length) return [];
    return [...data.topNotes].sort((a: any, b: any) => a.downloads - b.downloads).map((n: any) => ({
      title: n.title.length > 20 ? n.title.slice(0, 20) + '...' : n.title,
      downloads: n.downloads,
    }));
  }, [data]);

  const adImpressionsChart = useMemo(() => {
    if (!data?.ads?.length) return [];
    return data.ads.map((a: any) => ({
      name: (a.description || a.slot).length > 22 ? (a.description || a.slot).slice(0, 22) + '...' : (a.description || a.slot),
      impressions: a.impressions,
      clicks: a.clicks,
    }));
  }, [data]);

  const adBySlot = useMemo(() => {
    if (!data?.ads?.length) return [];
    const grouped: Record<string, number> = {};
    data.ads.forEach((a: any) => {
      grouped[a.slot] = (grouped[a.slot] || 0) + a.impressions;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [data]);

  const totalAdImpressions = useMemo(() => adBySlot.reduce((a, b) => a + b.value, 0), [adBySlot]);

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, fontFamily: 'var(--font-heading)' }}>Analytics</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>Platform traffic and engagement metrics</p>

      <div className="stat-grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">Total Notes</div>
              <div className="stat-value">{data?.totalNotes || 0}</div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <FileText size={18} />
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--palette-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{data?.totalUsers || 0}</div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--palette-2-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--palette-2)' }}>
              <Users size={18} />
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--palette-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">Total Downloads</div>
              <div className="stat-value">{data?.totalDownloads || 0}</div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--palette-3-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--palette-3)' }}>
              <Download size={18} />
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">Total Ads</div>
              <div className="stat-value">{data?.ads?.length || 0}</div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 2 }}>Notes Created</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Per month</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={notesChart} barCategoryGap="20%">
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-subtle)', radius: 4 }} />
              <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} name="Notes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 2 }}>User Registrations</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Per month</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={usersChart} barCategoryGap="20%">
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-subtle)', radius: 4 }} />
              <Bar dataKey="count" fill="var(--palette-2)" radius={[6, 6, 0, 0]} name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 2 }}>Downloads</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Per month</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={downloadsChart}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="downloads" stroke="var(--palette-3)" fill="var(--palette-3-bg)" strokeWidth={2} name="Downloads" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Top Notes by Downloads</h3>
          {topNotesChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topNotesChart} layout="vertical" barCategoryGap="25%">
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="title" width={120} tick={{ fontSize: 12, fill: 'var(--text-main)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
                <Bar dataKey="downloads" fill="var(--palette-4)" radius={[0, 6, 6, 0]} name="Downloads" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: 13 }}>No data yet</div>
          )}
        </div>

        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Ad Impressions vs Clicks</h3>
          {adImpressionsChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={adImpressionsChart} barCategoryGap="20%">
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-subtle)', radius: 4 }} />
                <Bar dataKey="impressions" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Impressions" />
                <Bar dataKey="clicks" fill="var(--palette-1)" radius={[4, 4, 0, 0]} name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: 13 }}>No ad data yet</div>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Impressions by Slot</h3>
          {adBySlot.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={adBySlot}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {adBySlot.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      borderRadius: 10, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    }}
                    itemStyle={{ color: 'var(--text-main)' }}
                    formatter={(value: number, name: string) => [`${value} (${((value / totalAdImpressions) * 100).toFixed(1)}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                {adBySlot.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-muted)' }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: PIE_COLORS[i] }} />
                    {d.name}
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {((d.value / totalAdImpressions) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: 13 }}>No ad data yet</div>
          )}
        </div>

        <div className="content-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 16 }}>CTR by Ad</h3>
          {adImpressionsChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={adImpressionsChart} layout="vertical" barCategoryGap="25%">
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: 'var(--text-main)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
                <Bar dataKey="impressions" fill="var(--primary)" radius={[0, 6, 6, 0]} name="Impressions" />
                <Bar dataKey="clicks" fill="var(--palette-1)" radius={[0, 6, 6, 0]} name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: 13 }}>No ad data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
