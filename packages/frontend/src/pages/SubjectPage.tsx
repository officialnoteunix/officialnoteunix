import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { subjectApi } from '../api/subject';
import { ArrowLeft, BookOpen, ChevronRight, FileText, Download, Upload, BadgeCheck } from 'lucide-react';
import StarRating from '../components/ui/StarRating';
import Pagination from '../components/ui/Pagination';
import FileTypePlaceholder from '../components/ui/FileTypePlaceholder';
import { getThumbnailUrl } from '../utils/cloudinary';
import { formatResourceType, RESOURCE_TYPES } from '../constants/resourceTypes';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/constants';
import SEO from '../components/seo/SEO';

const NOTE_TABS = RESOURCE_TYPES.filter(r => r.value).map(r => ({ value: r.value, label: r.label }));

export default function SubjectPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    subjectApi.get(id)
      .then(res => setSubject(res.data.data))
      .catch(err => showToast('error', getApiError(err, 'Failed to load subject')))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const fetchNotes = useCallback(async (p = 1, resourceType = '') => {
    if (!id) return;
    setNotesLoading(true);
    try {
      const res = await subjectApi.notes(id, p, 12, resourceType || undefined);
      setNotes(res.data.data.items);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
      setPage(p);
    } catch (err) {
      setNotes([]);
      showToast('error', getApiError(err, 'Failed to load notes'));
    } finally {
      setNotesLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchNotes(1, activeTab);
  }, [activeTab, fetchNotes]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!subject) return <div className="empty-state"><h3>Subject not found</h3></div>;

  const uni = subject.semesterId?.courseId?.universityId;
  const stats = subject.stats || { totalNotes: 0, totalDownloads: 0, averageRating: 0, resourceTypeCounts: [] };
  const activeTypes = (stats.resourceTypeCounts || []).filter((rt: any) => rt.count > 0);
  const availableTabs = NOTE_TABS.filter(t => activeTypes.some((at: any) => at.type === t.value));
  const typeCount = (type: string) => activeTypes.find((at: any) => at.type === type)?.count || 0;

  return (
    <div className="subject-page">
      <SEO title={subject.name} description={subject.description || `${subject.name} - study notes and resources`} />

      <div className="subject-page-nav">
        <Link to="/notes" className="subject-page-back">
          <ArrowLeft size={16} /> Browse
        </Link>
      </div>

      <div className="subject-page-header">
        <div className="subject-page-header-top">
          <div className="subject-page-icon">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="subject-page-title">{subject.name}</h1>
            {subject.code && (
              <span className="subject-page-code">{subject.code}</span>
            )}
          </div>
        </div>

        {subject.description && (
          <p className="subject-page-desc">{subject.description}</p>
        )}

        <div className="subject-page-breadcrumb">
          {uni?.name && <span>{uni.name}</span>}
          {uni?.name && <ChevronRight size={12} />}
          <Link to={`/courses/${subject.semesterId?.courseId?._id}`}>{subject.semesterId?.courseId?.name}</Link>
          <ChevronRight size={12} />
          <Link to={`/semesters/${subject.semesterId?._id}`}>{subject.semesterId?.title}</Link>
          <ChevronRight size={12} />
          <span className="subject-page-breadcrumb-current">{subject.name}</span>
        </div>

        <div className="subject-page-stats">
          <div className="subject-page-stat">
            <FileText size={18} />
            <div>
              <span className="subject-page-stat-value">{stats.totalNotes}</span>
              <span className="subject-page-stat-label">{stats.totalNotes === 1 ? 'Resource' : 'Resources'}</span>
            </div>
          </div>
          {stats.averageRating > 0 && (
            <div className="subject-page-stat">
              <StarRating rating={stats.averageRating} size={14} />
              <div>
                <span className="subject-page-stat-value">{stats.averageRating}</span>
                <span className="subject-page-stat-label">{stats.ratingsCount} ratings</span>
              </div>
            </div>
          )}
          {stats.totalDownloads > 0 && (
            <div className="subject-page-stat">
              <Download size={18} />
              <div>
                <span className="subject-page-stat-value">{stats.totalDownloads.toLocaleString()}</span>
                <span className="subject-page-stat-label">Downloads</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {availableTabs.length > 0 && (
        <div className="subject-page-tabs">
          <button
            className={`subject-page-tab ${activeTab === '' ? 'active' : ''}`}
            onClick={() => setActiveTab('')}
          >
            All <span className="subject-page-tab-count">{stats.totalNotes}</span>
          </button>
          {availableTabs.map(tab => (
            <button
              key={tab.value}
              className={`subject-page-tab ${activeTab === tab.value ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label} <span className="subject-page-tab-count">{typeCount(tab.value)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="subject-page-content">
        {notesLoading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}>
            <div className="spinner" />
          </div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No {activeTab ? formatResourceType(activeTab).toLowerCase() : 'resources'} found</h3>
            {user ? (
              <>
                <p>Be the first to upload!</p>
                <Link to="/user/upload" className="btn-rounded btn-primary" style={{ padding: '10px 24px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', marginTop: 12 }}>
                  <Upload size={16} /> Upload a note
                </Link>
              </>
            ) : (
              <p>Log in to upload resources for this subject.</p>
            )}
          </div>
        ) : (
          <>
            <div className="subject-page-notes-grid">
              {notes.map(note => {
                const ft = note.files?.[0]?.fileType || note.fileType;
                const thumbUrl = getThumbnailUrl(note.files?.[0]?.url || note.cloudinaryUrl, ft, note.thumbnailUrl);
                return (
                  <Link key={note._id} to={`/notes/${note._id}`} className="subject-page-note-card">
                    <div className="subject-page-note-thumb">
                      {thumbUrl ? (
                        <div style={{
                          width: '100%', height: '100%',
                          backgroundImage: `url(${thumbUrl})`,
                          backgroundSize: 'cover', backgroundPosition: 'center',
                          borderRadius: 'var(--radius-sm)',
                        }} />
                      ) : (
                        <FileTypePlaceholder fileType={ft} height={120} />
                      )}
                    </div>
                    <div className="subject-page-note-info">
                      <span className="subject-page-note-type">{formatResourceType(note.resourceType || 'study_notes')}</span>
                      <div className="subject-page-note-title">{note.title}</div>
                      <div className="subject-page-note-desc">{note.description || 'No description'}</div>
                      <div className="subject-page-note-meta">
                        <span>by {note.userId?.fullname || 'Unknown'}{note.userId?.isVerified && <BadgeCheck size={11} style={{ color: 'var(--primary)' }} />}</span>
                        {note.averageRating > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <StarRating rating={note.averageRating} size={10} />
                            ({note.ratingsCount})
                          </span>
                        )}
                        {note.downloads > 0 && <span>{note.downloads} downloads</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={(p) => fetchNotes(p, activeTab)} />
          </>
        )}
      </div>
    </div>
  );
}
