import { useState, useEffect, useCallback } from 'react';
import { universityApi } from '../../api/university';
import { courseApi } from '../../api/course';
import { semesterApi } from '../../api/semester';
import { subjectApi } from '../../api/subject';
import { useToast } from '../../context/ToastContext';
import { emitStatsRefresh } from '../../utils/statsRefresh';
import ConfirmModal from '../../components/ui/ConfirmModal';
import {
  Building2, BookOpen, Library, BookMarked, Plus, Edit2, Trash2, Check, ChevronLeft
} from 'lucide-react';
import { getApiError } from '../../utils/constants';

interface Entity {
  _id: string; name?: string; title?: string; code?: string;
}

const hierarchyLevels = [
  { key: 'universities', label: 'Universities', singular: 'University', icon: Building2, color: 'var(--palette-0)', bg: 'var(--palette-0-bg)' },
  { key: 'courses', label: 'Courses', singular: 'Course', icon: BookOpen, color: 'var(--palette-1)', bg: 'var(--palette-1-bg)' },
  { key: 'semesters', label: 'Semesters', singular: 'Semester', icon: Library, color: 'var(--palette-2)', bg: 'var(--palette-2-bg)' },
  { key: 'subjects', label: 'Subjects', singular: 'Subject', icon: BookMarked, color: 'var(--palette-3)', bg: 'var(--palette-3-bg)' },
];

const cardPalette = [
  { bg: 'var(--palette-0-bg)', color: 'var(--palette-0)' },
  { bg: 'var(--palette-1-bg)', color: 'var(--palette-1)' },
  { bg: 'var(--palette-2-bg)', color: 'var(--palette-2)' },
  { bg: 'var(--palette-3-bg)', color: 'var(--palette-3)' },
  { bg: 'var(--palette-4-bg)', color: 'var(--palette-4)' },
  { bg: 'var(--palette-5-bg)', color: 'var(--palette-5)' },
];

type ViewMode = 'browse' | 'form';

export default function Content() {
  const { showToast } = useToast();

  const [universities, setUniversities] = useState<Entity[]>([]);
  const [courses, setCourses] = useState<Entity[]>([]);
  const [semesters, setSemesters] = useState<Entity[]>([]);
  const [subjects, setSubjects] = useState<Entity[]>([]);

  const [view, setView] = useState<ViewMode>('browse');
  const [hLevel, setHLevel] = useState(0);
  const [browseItems, setBrowseItems] = useState<Entity[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browsePath, setBrowsePath] = useState<{ key: string; id: string; name: string }[]>([]);

  const [editItem, setEditItem] = useState<Entity | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [formParentId, setFormParentId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Entity | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const currentLevel = hierarchyLevels[hLevel];
  const isLeaf = hLevel === 3;

  const loadLevel = useCallback((level: number, parentId?: string) => {
    setBrowseLoading(true);
    const key = hierarchyLevels[level]?.key;
    let promise: Promise<any> = Promise.resolve({ data: { data: [] } });
    switch (key) {
      case 'universities': promise = universityApi.list(); break;
      case 'courses': promise = courseApi.list(parentId); break;
      case 'semesters': promise = semesterApi.list(parentId); break;
      case 'subjects': promise = subjectApi.list(parentId); break;
      default: promise = Promise.resolve({ data: { data: [] } });
    }
    promise.then(r => {
      const d = r.data.data;
      setBrowseItems(Array.isArray(d) ? d : d.items || []);
    }).catch(() => setBrowseItems([])).finally(() => setBrowseLoading(false));
  }, []);

  useEffect(() => { loadLevel(0); }, []);

  const refreshAll = () => {
    const parentId = hLevel >= 1 ? browsePath[hLevel - 1]?.id : undefined;
    loadLevel(hLevel, parentId);
    universityApi.list().then(r => setUniversities(r.data.data)).catch(err => showToast('error', getApiError(err, 'Failed to refresh universities')));
    courseApi.list().then(r => setCourses(r.data.data)).catch(err => showToast('error', getApiError(err, 'Failed to refresh courses')));
    semesterApi.list().then(r => setSemesters(r.data.data)).catch(err => showToast('error', getApiError(err, 'Failed to refresh semesters')));
    subjectApi.list().then(r => setSubjects(r.data.data)).catch(err => showToast('error', getApiError(err, 'Failed to refresh subjects')));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const key = currentLevel.key;
      if (key === 'universities') await universityApi.delete(deleteTarget._id);
      else if (key === 'courses') await courseApi.delete(deleteTarget._id);
      else if (key === 'semesters') await semesterApi.delete(deleteTarget._id);
      else if (key === 'subjects') await subjectApi.delete(deleteTarget._id);
      showToast('success', `${currentLevel.singular} deleted successfully`);
      emitStatsRefresh();
      setDeleteTarget(null);
      refreshAll();
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to delete'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCardClick = (item: Entity) => {
    if (!isLeaf) {
      const newPath = [...browsePath.slice(0, hLevel), { key: currentLevel.key, id: item._id, name: item.name || item.title || '' }];
      setBrowsePath(newPath);
      setHLevel(hLevel + 1);
      setBrowseItems([]);
      loadLevel(hLevel + 1, item._id);
    }
  };

  const handleBack = () => {
    if (hLevel > 0) {
      const nl = hLevel - 1;
      setHLevel(nl);
      const newPath = browsePath.slice(0, nl);
      setBrowsePath(newPath);
      const parentId = nl >= 1 ? newPath[nl - 1]?.id : undefined;
      loadLevel(nl, parentId);
    }
  };

  const resetBrowse = () => {
    setHLevel(0);
    setBrowsePath([]);
    loadLevel(0);
  };

  const openAdd = () => {
    setEditItem(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormParentId(hLevel >= 1 ? browsePath[hLevel - 1]?.id : '');
    setView('form');
  };

  const openEdit = (item: Entity) => {
    setEditItem(item);
    setFormName(item.name || item.title || '');
    setFormCode((item as any).code || '');
    setFormDescription((item as any).description || '');
    setFormParentId(hLevel >= 1 ? browsePath[hLevel - 1]?.id : '');
    setView('form');
  };

  const cancelForm = () => { setEditItem(null); setFormName(''); setFormCode(''); setFormDescription(''); setView('browse'); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) { showToast('error', 'Name is required'); return; }
    setSaveLoading(true);
    try {
      const key = currentLevel.key;
      const payload: Record<string, any> = {};

      if (key === 'universities') {
        payload.name = formName;
        payload.description = formDescription;
        if (editItem) await universityApi.update(editItem._id, payload);
        else await universityApi.create(payload);
      } else if (key === 'courses') {
        if (!formParentId) { showToast('error', 'Select a parent university'); setSaveLoading(false); return; }
        payload.name = formName;
        payload.description = formDescription;
        payload.universityId = formParentId;
        if (editItem) await courseApi.update(editItem._id, payload);
        else await courseApi.create(payload);
      } else if (key === 'semesters') {
        if (!formParentId) { showToast('error', 'Select a parent course'); setSaveLoading(false); return; }
        payload.title = formName;
        payload.description = formDescription;
        payload.courseId = formParentId;
        if (editItem) await semesterApi.update(editItem._id, payload);
        else await semesterApi.create(payload);
      } else if (key === 'subjects') {
        if (!formParentId) { showToast('error', 'Select a parent semester'); setSaveLoading(false); return; }
        payload.name = formName;
        payload.description = formDescription;
        payload.code = formCode;
        payload.semesterId = formParentId;
        if (editItem) await subjectApi.update(editItem._id, payload);
        else await subjectApi.create(payload);
      }
      showToast('success', `${editItem ? 'Updated' : 'Created'} successfully`);
      emitStatsRefresh();
      setView('browse');
      refreshAll();
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to save'));
    } finally {
      setSaveLoading(false);
    }
  };

  const getParentName = (item: Entity) => {
    if (currentLevel.key === 'courses') return universities.find(u => u._id === (item as any).universityId)?.name;
    if (currentLevel.key === 'semesters') return courses.find(c => c._id === (item as any).courseId)?.name;
    if (currentLevel.key === 'subjects') return semesters.find(s => s._id === (item as any).semesterId)?.title;
    return '';
  };

  const renderBrowse = () => (
    <div>
      <div className="content-manage-header" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div className="browse-crumb-scroll">
          <div className="browse-crumb-inner">
            {hLevel > 0 && (
              <button onClick={handleBack} className="btn-rounded btn-ghost browse-crumb-back">
                <ChevronLeft size={14} />
              </button>
            )}
            <button onClick={resetBrowse} className="browse-crumb-link" style={{ color: browsePath.length === 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: browsePath.length === 0 ? 700 : 400 }}>
              All {currentLevel.label}
            </button>
            {browsePath.map((item, i) => (
              <span key={i} className="browse-crumb-item">
                <span className="browse-crumb-sep">/</span>
                <span style={{ color: i === browsePath.length - 1 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === browsePath.length - 1 ? 700 : 400 }}>
                  {item.name}
                </span>
              </span>
            ))}
          </div>
        </div>
        <button onClick={openAdd} className="btn-rounded btn-primary" style={{ padding: '8px 14px', fontSize: 12, display: 'flex', gap: 4, marginLeft: 'auto' }}>
          <Plus size={14} /> Add {currentLevel.singular}
        </button>
      </div>

      {browseLoading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
      ) : browseItems.length === 0 ? (
        <div className="empty-state">
          <currentLevel.icon size={48} />
          <h3>No {currentLevel.label.toLowerCase()} found</h3>
          <p>{hLevel > 0 ? `This ${hierarchyLevels[hLevel - 1].singular.toLowerCase()} has no ${currentLevel.label.toLowerCase()} yet.` : `Create your first ${currentLevel.singular.toLowerCase()} to get started.`}</p>
        </div>
      ) : (
        <div className="hierarchy-grid">
          {browseItems.map((item, i) => {
            const c = cardPalette[i % cardPalette.length];
            return (
              <div key={item._id}
                onClick={() => handleCardClick(item)}
                className="hierarchy-card"
                style={{ borderLeftColor: c.color, cursor: isLeaf ? 'default' : 'pointer' } as React.CSSProperties}
              >
                <span className="hierarchy-card-badge" style={{ color: c.color }}>
                  {currentLevel.singular}
                </span>
                <div className="hierarchy-card-title">{item.name || item.title}</div>
                <div className="hierarchy-card-sub">
                  {!isLeaf ? `View ${hierarchyLevels[hLevel + 1]?.label.toLowerCase()}` : getParentName(item) || ''}
                  {item.code && !isLeaf && ` · ${item.code}`}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={e => { e.stopPropagation(); openEdit(item); }}
                    className="btn-rounded btn-ghost" style={{ padding: '4px 10px', fontSize: 10.5, display: 'flex', gap: 3, alignItems: 'center' }}>
                    <Edit2 size={10} /> Edit
                  </button>
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(item); }}
                    className="btn-rounded" style={{ padding: '4px 10px', fontSize: 10.5, display: 'flex', gap: 3, alignItems: 'center', backgroundColor: 'var(--danger)', color: '#fff' }}>
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderForm = () => {
    const parentLabel = hLevel >= 1 ? hierarchyLevels[hLevel - 1] : null;

    const treeConnectorLevels = [
      { key: 'universities', label: 'All Universities', icon: Building2, data: universities, parentField: null },
      { key: 'courses', label: 'All Courses', icon: BookOpen, data: courses, parentField: 'universityId' },
      { key: 'semesters', label: 'All Semesters', icon: Library, data: semesters, parentField: 'courseId' },
      { key: 'subjects', label: 'All Subjects', icon: BookMarked, data: subjects, parentField: 'semesterId' },
    ];

    const activeParents = browsePath.reduce((acc, p) => ({ ...acc, [p.key]: p.id }), {} as Record<string, string>);
    activeParents.universities = browsePath[0]?.id || '';

    const getChildren = (levelKey: string, parentId: string) => {
      const level = treeConnectorLevels.find(l => l.key === levelKey);
      if (!level || !level.parentField) return [];
      return level.data.filter((item: any) => item[level.parentField!] === parentId);
    };

    return (
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        <div className="content-form-panel">
          <div className="content-form-back">
            <button onClick={cancelForm} className="btn-rounded btn-ghost" style={{ padding: '7px 12px', flexShrink: 0, fontSize: 11, display: 'flex', gap: 4, alignItems: 'center' }}>
              <ChevronLeft size={13} /> Back
            </button>
            <div className="content-form-breadcrumb">
              {browsePath.map((item, i) => (
                <span key={i}><span className="crumb-sep">/</span><span>{item.name}</span></span>
              ))}
            </div>
          </div>

          <div className="content-form-body">
            <h2 className="content-form-title">{editItem ? 'Edit' : 'Add'} {currentLevel.singular}</h2>
            <p className="content-form-sub">
              {parentLabel
                ? `This will be created under ${parentLabel.singular.toLowerCase()} "${browsePath.map(p => p.name).join(' › ')}"`
                : `Create a new ${currentLevel.singular.toLowerCase()} at the root level`}
            </p>

            <form onSubmit={handleSave} autoComplete="off" className="content-form-fields">
              <div className="form-group">
                <label>Name <span className="required-star">*</span></label>
                <input className="form-input" value={formName} onChange={e => setFormName(e.target.value)} placeholder={`e.g. ${currentLevel.singular} name`} required autoComplete="off" />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder={`Brief description of this ${currentLevel.singular.toLowerCase()}`} rows={3} />
              </div>

              {currentLevel.key === 'subjects' && (
                <div className="form-group">
                  <label>Code <span className="optional-badge">optional</span></label>
                  <input className="form-input" value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="e.g. CSC101" autoComplete="off" />
                </div>
              )}

              <div className="content-form-actions">
                <button type="submit" className="btn-rounded btn-primary" style={{ padding: '12px 32px', fontSize: 13.5, display: 'flex', gap: 6, alignItems: 'center' }} disabled={saveLoading}>
                  <Check size={16} /> {saveLoading ? 'Saving...' : editItem ? 'Update' : `Create ${currentLevel.singular}`}
                </button>
                <button type="button" onClick={cancelForm} className="btn-rounded btn-ghost" style={{ padding: '12px 28px', fontSize: 13.5 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>

        <div className="content-tree-panel">
          <div className="content-tree-header">
            {hierarchyLevels.slice(0, hLevel + 1).map((l, i) => {
              const Icon = l.icon;
              return (
                <span key={l.key} className="tree-header-crumb">
                  {i > 0 && <span className="tree-header-sep">›</span>}
                  <Icon size={13} />
                  <span>{i === hLevel ? (editItem ? 'Editing' : `New ${l.singular}`) : browsePath[i]?.name || l.label}</span>
                </span>
              );
            })}
          </div>
          <div className="content-tree">
            {treeConnectorLevels.slice(0, hLevel + 1).map((level, li) => {
              const LevelIcon = level.icon;
              const parentId = activeParents[level.key];
              const selectedParent = level.data.find((e: any) => e._id === parentId);
              const isCurrentLevel = li === browsePath.length;
              const isPastLevel = li < browsePath.length;

              return (
                <div key={level.key} className={`tree-tier ${isCurrentLevel ? 'current' : ''} ${isPastLevel ? 'past' : ''}`}>
                  <div className="tree-tier-label">
                    <div className="tree-tier-dot" />
                    <LevelIcon size={13} />
                    <span>{level.label}</span>
                  </div>
                  {selectedParent ? (
                    <div className="tree-tier-selected">
                      <div className="tree-tier-arrow" />
                      <LevelIcon size={11} />
                      <span>{selectedParent.name || selectedParent.title}</span>
                    </div>
                  ) : li === 0 ? null : (
                    <div className="tree-tier-selected muted">
                      <span>None selected</span>
                    </div>
                  )}
                  {isCurrentLevel && (
                    <div className="tree-tier-current">
                      <Plus size={13} />
                      <span>{editItem ? `Editing: ${editItem.name || editItem.title}` : `New ${currentLevel.singular}`}</span>
                    </div>
                  )}
                  {isPastLevel && parentId && (
                    <div className="tree-tier-children">
                      {getChildren(level.key, parentId).slice(0, 5).map((child: any) => {
                        const isCurrent = editItem?._id === child._id;
                        return (
                          <div key={child._id} className={`tree-tier-child ${isCurrent ? 'current' : ''}`}>
                            <div className="tree-child-bullet" />
                            <span>{child.name || child.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="content-manage-h1" style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Content Management</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Navigate the education hierarchy to manage content</p>
      </div>

      {view === 'browse' && renderBrowse()}
      {view === 'form' && renderForm()}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${currentLevel.singular}`}
        message={`Permanently delete "${deleteTarget?.name || deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
