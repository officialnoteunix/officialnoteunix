import { useState, useEffect, useMemo } from 'react';
import { adApi } from '../../api/ad';
import { useToast } from '../../context/ToastContext';
import { emitStatsRefresh } from '../../utils/statsRefresh';
import ConfirmModal from '../../components/ui/ConfirmModal';
import DetailModal from '../../components/ui/DetailModal';
import Pagination from '../../components/ui/Pagination';
import type { Ad } from '../../types';
import { Megaphone, Plus, Edit2, Trash2, Eye, MousePointer, Check, ChevronLeft, Calendar, Image as ImageIcon, Link, AlignLeft, ToggleLeft, Filter } from 'lucide-react';
import { getApiError } from '../../utils/constants';

type ViewMode = 'table' | 'form';

const slots = [
  { key: 'marquee', label: 'Marquee (Top Strip)' },
  { key: 'sidebar', label: 'Sidebar' },
  { key: 'in_content', label: 'In Content' },
];

const PER_PAGE = 5;

export default function AdminAds() {
  const { showToast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('table');
  const [editAd, setEditAd] = useState<Ad | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);
  const [detailTarget, setDetailTarget] = useState<Ad | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formSlot, setFormSlot] = useState('sidebar');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [imgError, setImgError] = useState(false);

  const [filterSlot, setFilterSlot] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [page, setPage] = useState(1);

  const fetchAds = () => {
    setLoading(true);
    Promise.all([
      adApi.list(),
      adApi.stats(),
    ])
      .then(([adsRes, statsRes]) => {
        setAds(adsRes.data.data);
        setStats(statsRes.data.data);
      })
      .catch(err => showToast('error', getApiError(err, 'Failed to load ads')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAds(); }, []);

  const filtered = useMemo(() => {
    let list = ads;
    if (filterSlot !== 'all') list = list.filter(a => a.slot === filterSlot);
    if (filterActive === 'active') list = list.filter(a => a.active);
    if (filterActive === 'inactive') list = list.filter(a => !a.active);
    return list;
  }, [ads, filterSlot, filterActive]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  useEffect(() => { setPage(1); }, [filterSlot, filterActive]);

  const openCreate = () => {
    setEditAd(null);
    setFormSlot('sidebar');
    setFormImageUrl('');
    setFormLinkUrl('');
    setFormDesc('');
    setFormStart(new Date().toISOString().split('T')[0]);
    setFormEnd(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setFormActive(true);
    setView('form');
  };

  const openEdit = (ad: any) => {
    setEditAd(ad);
    setFormSlot(ad.slot);
    setFormImageUrl(ad.imageUrl);
    setFormLinkUrl(ad.linkUrl || '');
    setFormDesc(ad.description || '');
    setFormStart(new Date(ad.startDate).toISOString().split('T')[0]);
    setFormEnd(new Date(ad.endDate).toISOString().split('T')[0]);
    setFormActive(ad.active);
    setView('form');
  };

  const cancelForm = () => { setView('table'); };

  const isMarquee = formSlot === 'marquee';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMarquee && !formImageUrl) { showToast('error', 'Image URL is required'); return; }
    setSaveLoading(true);
    const payload = {
      slot: formSlot, imageUrl: formImageUrl, linkUrl: formLinkUrl,
      description: formDesc, startDate: formStart, endDate: formEnd, active: formActive,
    };
    try {
      if (editAd) await adApi.update(editAd._id, payload);
      else await adApi.create(payload);
      showToast('success', `Ad ${editAd ? 'updated' : 'created'}`);
      emitStatsRefresh();
      setView('table');
      fetchAds();
    } catch (err) { showToast('error', getApiError(err, 'Failed to save ad')); }
    finally { setSaveLoading(false); }
  };

  const toggleActive = async (ad: any) => {
    try {
      await adApi.update(ad._id, { active: !ad.active });
      showToast('success', `Ad ${ad.active ? 'deactivated' : 'activated'}`);
      emitStatsRefresh();
      fetchAds();
    } catch (err) { showToast('error', getApiError(err, 'Failed to toggle ad')); }
  };

  const deleteAd = async () => {
    if (!deleteTarget) return;
    try {
      await adApi.delete(deleteTarget._id);
      showToast('success', 'Ad deleted');
      emitStatsRefresh();
      setDeleteTarget(null);
      fetchAds();
    } catch (err) { showToast('error', getApiError(err, 'Failed to delete ad')); }
  };

  if (loading) return <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  const renderTable = () => (
    <>
      <div className="stat-grid-4">
        <div className="stat-card" style={{ borderLeft: '3px solid var(--palette-0)' }}>
          <div className="stat-label">Total Ads</div>
          <div className="stat-value">{ads.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--palette-1)' }}>
          <div className="stat-label">Active</div>
          <div className="stat-value">{ads.filter(a => a.active).length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--palette-3)' }}>
          <div className="stat-label">Total Impressions</div>
          <div className="stat-value">{stats?.totals?.impressions || 0}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--palette-4)' }}>
          <div className="stat-label">CTR</div>
          <div className="stat-value">{stats?.ctr || '0.00'}%</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-subtle)', borderRadius: 10, padding: '0 12px', border: '1.5px solid var(--border-color)' }}>
          <Filter size={14} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
          <select value={filterSlot} onChange={e => setFilterSlot(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '8px 0', fontSize: 13, color: 'var(--text-main)', outline: 'none' }}>
            <option value="all">All Slots</option>
            {slots.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-subtle)', borderRadius: 10, padding: '0 12px', border: '1.5px solid var(--border-color)' }}>
          <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '8px 0', fontSize: 13, color: 'var(--text-main)', outline: 'none' }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} of {ads.length} ads</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><Megaphone size={48} /><h3>No ads match filters</h3><p>Try changing the filter criteria.</p></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Slot</th>
                <th>Image</th>
                <th>Description</th>
                <th>Active</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>Period</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(ad => (
                <tr key={ad._id} onClick={() => window.innerWidth <= 640 && setDetailTarget(ad)}>
                  <td data-card-title><span className="badge badge-primary" style={{ fontSize: 11 }}>{ad.slot}</span></td>
                  <td>
                    <div style={{ width: 40, height: 28, borderRadius: 4, overflow: 'hidden', background: 'var(--bg-subtle)' }}>
                      {ad.imageUrl ? <img src={ad.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Eye size={14} style={{ margin: 7, color: 'var(--text-light)' }} />}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.description || '-'}</td>
                  <td>
                    <button onClick={() => toggleActive(ad)} className={`badge ${ad.active ? 'badge-secondary' : 'badge-muted'}`} style={{ border: 'none', cursor: 'pointer', fontSize: 11 }}>
                      {ad.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} style={{ color: 'var(--text-muted)' }} /> {ad.impressions || 0}
                  </td>
                  <td style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MousePointer size={12} style={{ color: 'var(--text-muted)' }} /> {ad.clicks || 0}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(ad)} className="btn-rounded btn-ghost" style={{ padding: '5px 10px', fontSize: 11, display: 'flex', gap: 3, alignItems: 'center' }}>
                        <Edit2 size={11} /> Edit
                      </button>
                      <button onClick={() => setDeleteTarget(ad)} className="btn-rounded" style={{ padding: '5px 10px', fontSize: 11, backgroundColor: 'var(--danger)', color: '#fff', display: 'flex', gap: 3, alignItems: 'center' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={safePage} totalPages={totalPages} total={filtered.length} onPageChange={setPage} />
    </>
  );

  const renderForm = () => {
    const slotLabel = slots.find(s => s.key === formSlot)?.label || 'Sidebar';
    return (
    <div className="content-card" style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <button onClick={cancelForm} className="btn-rounded btn-ghost" style={{ padding: '7px 12px', fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
          <ChevronLeft size={15} /> Back
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--palette-3-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--palette-3)', flexShrink: 0 }}>
          <Megaphone size={16} />
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{editAd ? 'Edit' : 'Create'} Ad</h2>
      </div>

      <div className="form-preview-layout">
        <form onSubmit={handleSave} style={{ flex: 1, minWidth: 0 }}>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Slot <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
                <Megaphone size={15} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                <select className="form-select" value={formSlot} onChange={e => setFormSlot(e.target.value)} required style={{ border: 'none', background: 'transparent', padding: '11px 0', width: '100%', fontSize: 13.5 }}>
                  {slots.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Active</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-subtle)', height: 44 }}>
                <ToggleLeft size={15} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: formActive ? 600 : 400, color: formActive ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    <input type="radio" checked={formActive} onChange={() => setFormActive(true)} style={{ accentColor: 'var(--primary)' }} /> Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: !formActive ? 600 : 400, color: !formActive ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    <input type="radio" checked={!formActive} onChange={() => setFormActive(false)} style={{ accentColor: 'var(--primary)' }} /> No
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>
              Image URL {!isMarquee && <span style={{ color: 'var(--danger)' }}>*</span>}
              {isMarquee && <span style={{ color: 'var(--text-light)', fontWeight: 400, fontSize: 12 }}> (optional for marquee)</span>}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
              <ImageIcon size={15} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
              <input className="form-input" value={formImageUrl} onChange={e => setFormImageUrl(e.target.value)} placeholder={isMarquee ? 'Optional — not shown in marquee' : 'https://example.com/ad.jpg'} required={!isMarquee} style={{ border: 'none', background: 'transparent', padding: '11px 0', width: '100%', fontSize: 13.5 }} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Link URL (optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
              <Link size={15} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
              <input className="form-input" value={formLinkUrl} onChange={e => setFormLinkUrl(e.target.value)} placeholder="https://example.com/landing" style={{ border: 'none', background: 'transparent', padding: '11px 0', width: '100%', fontSize: 13.5 }} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>
              Description
              {isMarquee && <span style={{ color: 'var(--primary)', fontWeight: 400, fontSize: 12 }}> (scrolling text shown in marquee)</span>}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
              <AlignLeft size={15} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
              <input className="form-input" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder={isMarquee ? 'Scrolling ticker text' : 'Ad description'} style={{ border: 'none', background: 'transparent', padding: '11px 0', width: '100%', fontSize: 13.5 }} />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 28 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Start Date <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
                <Calendar size={15} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                <input className="form-input" type="date" value={formStart} onChange={e => setFormStart(e.target.value)} required style={{ border: 'none', background: 'transparent', padding: '11px 0', width: '100%', fontSize: 13.5 }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>End Date <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
                <Calendar size={15} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                <input className="form-input" type="date" value={formEnd} onChange={e => setFormEnd(e.target.value)} required style={{ border: 'none', background: 'transparent', padding: '11px 0', width: '100%', fontSize: 13.5 }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-rounded btn-primary" style={{ padding: '12px 28px', fontSize: 13.5, display: 'flex', gap: 6, alignItems: 'center' }} disabled={saveLoading}>
              <Check size={16} /> {saveLoading ? 'Saving...' : editAd ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={cancelForm} className="btn-rounded btn-ghost" style={{ padding: '12px 28px', fontSize: 13.5 }}>Cancel</button>
          </div>
        </form>

        <div style={{ width: 320, flexShrink: 0 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Preview</label>
          <div style={{
            borderRadius: 14, overflow: 'hidden', border: '1.5px solid var(--border-color)',
            background: 'var(--bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: '100%', height: 200, background: formImageUrl ? 'var(--bg-subtle)' : 'var(--bg-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {formImageUrl ? (
                <img src={formImageUrl} alt="Ad preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: imgError ? 'none' : 'block' }}
                  onError={() => setImgError(true)}
                />
              ) : null}
              {(!formImageUrl || imgError) && (
                <ImageIcon size={36} style={{ color: 'var(--text-light)' }} />
              )}
              {imgError && <div style={{ color: 'var(--text-light)', fontSize: 12, textAlign: 'center', paddingBottom: 8 }}>Invalid image URL</div>}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="badge badge-primary" style={{ fontSize: 10.5 }}>{slotLabel}</span>
                <span className={`badge ${formActive ? 'badge-secondary' : 'badge-muted'}`} style={{ fontSize: 10.5 }}>
                  {formActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {formDesc && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 6 }}>{formDesc}</div>}
              {formLinkUrl && <div style={{ fontSize: 11, color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formLinkUrl}</div>}
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>
                {formStart && formEnd ? `${new Date(formStart).toLocaleDateString()} — ${new Date(formEnd).toLocaleDateString()}` : 'Set dates'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Ad Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage advertisement campaigns</p>
        </div>
        {view === 'table' && (
          <button onClick={openCreate} className="btn-rounded btn-primary" style={{ padding: '10px 20px', fontSize: 13, display: 'flex', gap: 6 }}>
            <Plus size={15} /> Create Ad
          </button>
        )}
      </div>

      {view === 'table' && renderTable()}
      {view === 'form' && renderForm()}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteAd}
        title="Delete Ad"
        message="Permanently delete this ad? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      <DetailModal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.slot || 'Ad'}
        fields={[
          { label: 'Description', value: detailTarget?.description || '-' },
          { label: 'Active', value: detailTarget?.active ? 'Yes' : 'No' },
          { label: 'Impressions', value: detailTarget?.impressions || 0 },
          { label: 'Clicks', value: detailTarget?.clicks || 0 },
          { label: 'Period', value: detailTarget?.startDate && detailTarget?.endDate ? `${new Date(detailTarget.startDate).toLocaleDateString()} - ${new Date(detailTarget.endDate).toLocaleDateString()}` : '-' },
        ]}
      >
        {detailTarget && (
          <>
            <button onClick={() => { setDetailTarget(null); openEdit(detailTarget); }} className="btn-rounded btn-ghost" style={{ padding: '7px 14px', fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
              <Edit2 size={13} /> Edit
            </button>
            <button onClick={() => { setDetailTarget(null); setDeleteTarget(detailTarget); }} className="btn-rounded" style={{ padding: '7px 14px', fontSize: 12, backgroundColor: 'var(--danger)', color: '#fff', display: 'flex', gap: 4, alignItems: 'center' }}>
              <Trash2 size={13} /> Delete
            </button>
          </>
        )}
      </DetailModal>
    </div>
  );
}
