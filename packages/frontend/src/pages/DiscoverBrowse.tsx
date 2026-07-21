import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, BookOpen } from 'lucide-react';
import { subjectApi, DiscoverParams } from '../api/subject';
import { universityApi } from '../api/university';
import { courseApi } from '../api/course';
import { semesterApi } from '../api/semester';
import FilterChips, { FilterState } from '../components/discover/FilterChips';
import SubjectCard, { SubjectCardData } from '../components/discover/SubjectCard';
import Pagination from '../components/ui/Pagination';
import SEO from '../components/seo/SEO';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/constants';

const STORAGE_KEY = 'discover_browse_filters';

export default function DiscoverBrowse() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const [filters, setFilters] = useState<FilterState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      universityId: searchParams.get('university') || '',
      courseId: searchParams.get('course') || '',
      semesterId: searchParams.get('semester') || '',
      resourceType: searchParams.get('type') || '',
    };
  });

  const [subjects, setSubjects] = useState<SubjectCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [universities, setUniversities] = useState<{ value: string; label: string }[]>([]);
  const [courses, setCourses] = useState<{ value: string; label: string }[]>([]);
  const [semesters, setSemesters] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    universityApi.list().then(res => {
      setUniversities(res.data.data.map((u: any) => ({ value: u._id, label: u.name })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (filters.universityId) {
      courseApi.list(filters.universityId).then(res => {
        setCourses(res.data.data.map((c: any) => ({ value: c._id, label: c.name })));
      }).catch(() => {});
    } else {
      setCourses([]);
    }
  }, [filters.universityId]);

  useEffect(() => {
    if (filters.courseId) {
      semesterApi.list(filters.courseId).then(res => {
        setSemesters(res.data.data.map((s: any) => ({
          value: s._id,
          label: s.title || `Semester ${s.semesterNumber}`,
        })));
      }).catch(() => {});
    } else {
      setSemesters([]);
    }
  }, [filters.courseId]);

  const fetchSubjects = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: DiscoverParams = { page: p, limit: 20 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.universityId) params.universityId = filters.universityId;
      if (filters.courseId) params.courseId = filters.courseId;
      if (filters.semesterId) params.semesterId = filters.semesterId;

      const res = await subjectApi.discover(params);
      let items = res.data.data.items as SubjectCardData[];

      if (filters.resourceType) {
        items = items.filter((s: SubjectCardData) =>
          s.resourceTypeCounts.some(rt => rt.type === filters.resourceType && rt.count > 0)
        );
      }

      setSubjects(items);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
      setPage(p);
    } catch (err) {
      setSubjects([]);
      showToast('error', getApiError(err, 'Failed to load subjects'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters]);

  useEffect(() => {
    fetchSubjects(1);
  }, [fetchSubjects]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (filters.universityId) params.university = filters.universityId;
    if (filters.courseId) params.course = filters.courseId;
    if (filters.semesterId) params.semester = filters.semesterId;
    if (filters.resourceType) params.type = filters.resourceType;
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, filters, setSearchParams]);

  return (
    <div className="discover-page">
      <SEO title="Browse Notes" description="Discover study notes organized by subject. Search and filter by university, course, semester, and resource type." />
      <h1 className="discover-page-title">Browse Notes</h1>

      <div className="discover-search-bar">
        <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search subjects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <FilterChips
        filters={filters}
        onChange={setFilters}
        universities={universities}
        courses={courses}
        semesters={semesters}
      />

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}>
          <div className="spinner" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <h3>No subjects found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="discover-subjects-grid">
            {subjects.map(s => (
              <SubjectCard key={s._id} subject={s} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={fetchSubjects} />
        </>
      )}
    </div>
  );
}
