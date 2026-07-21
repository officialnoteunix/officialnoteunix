import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { RESOURCE_TYPES } from '../../constants/resourceTypes';

export interface FilterState {
  universityId: string;
  courseId: string;
  semesterId: string;
  resourceType: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (val: string) => void;
  icon?: React.ReactNode;
}

function FilterDropdown({ label, options, value, onChange, icon }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="filter-chip-dropdown" ref={ref}>
      <button
        type="button"
        className={`filter-chip-trigger ${open ? 'open' : ''} ${value ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
      >
        {icon && <span className="filter-chip-icon">{icon}</span>}
        <span>{value ? selected?.label : label}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="filter-chip-menu">
          <button
            className={`filter-chip-option ${!value ? 'selected' : ''}`}
            onClick={() => { onChange(''); setOpen(false); }}
          >
            All {label}s
          </button>
          {options.filter(o => o.value).map(opt => (
            <button
              key={opt.value}
              className={`filter-chip-option ${opt.value === value ? 'selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ActiveChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  universities: FilterOption[];
  courses: FilterOption[];
  semesters: FilterOption[];
}

export default function FilterChips({ filters, onChange, universities, courses, semesters }: FilterChipsProps) {
  const set = (key: keyof FilterState, val: string) => {
    const next = { ...filters, [key]: val };
    if (key === 'universityId') {
      next.courseId = '';
      next.semesterId = '';
    }
    if (key === 'courseId') {
      next.semesterId = '';
    }
    onChange(next);
  };

  const chips: ActiveChip[] = [];
  if (filters.universityId) {
    const u = universities.find(u => u.value === filters.universityId);
    chips.push({ key: 'uni', label: u?.label || filters.universityId, onRemove: () => set('universityId', '') });
  }
  if (filters.courseId) {
    const c = courses.find(c => c.value === filters.courseId);
    chips.push({ key: 'course', label: c?.label || filters.courseId, onRemove: () => set('courseId', '') });
  }
  if (filters.semesterId) {
    const s = semesters.find(s => s.value === filters.semesterId);
    chips.push({ key: 'semester', label: s?.label || filters.semesterId, onRemove: () => set('semesterId', '') });
  }
  if (filters.resourceType) {
    const rt = RESOURCE_TYPES.find(r => r.value === filters.resourceType);
    chips.push({ key: 'type', label: rt?.label || filters.resourceType, onRemove: () => set('resourceType', '') });
  }

  const clearAll = () => onChange({ universityId: '', courseId: '', semesterId: '', resourceType: '' });

  return (
    <div className="filter-chips-container">
      <div className="filter-chips-row">
        <div className="filter-chips-icon">
          <SlidersHorizontal size={16} />
        </div>
        <FilterDropdown
          label="University"
          options={universities}
          value={filters.universityId}
          onChange={v => set('universityId', v)}
        />
        <FilterDropdown
          label="Course"
          options={courses}
          value={filters.courseId}
          onChange={v => set('courseId', v)}
        />
        <FilterDropdown
          label="Semester"
          options={semesters}
          value={filters.semesterId}
          onChange={v => set('semesterId', v)}
        />
        <FilterDropdown
          label="Type"
          options={RESOURCE_TYPES.map(r => ({ value: r.value, label: r.label }))}
          value={filters.resourceType}
          onChange={v => set('resourceType', v)}
        />
      </div>
      {chips.length > 0 && (
        <div className="filter-chips-active">
          {chips.map(chip => (
            <span key={chip.key} className="filter-chip-badge">
              {chip.label}
              <button onClick={chip.onRemove} className="filter-chip-remove" aria-label={`Remove ${chip.label}`}>
                <X size={12} />
              </button>
            </span>
          ))}
          <button className="filter-chip-clear" onClick={clearAll}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
