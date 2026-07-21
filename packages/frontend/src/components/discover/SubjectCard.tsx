import { Link } from 'react-router-dom';
import { BookOpen, FileText, Star, Download } from 'lucide-react';
import StarRating from '../ui/StarRating';

export interface SubjectCardData {
  _id: string;
  name: string;
  code?: string;
  slug: string;
  description?: string;
  totalNotes: number;
  totalDownloads: number;
  averageRating: number;
  ratingsCount: number;
  resourceTypeCounts: { type: string; count: number }[];
  semester?: { _id: string; title: string; semesterNumber: number };
  course?: { _id: string; name: string; slug: string };
  university?: { _id: string; name: string; slug: string };
}

interface SubjectCardProps {
  subject: SubjectCardData;
}

const PALETTE = [
  'var(--palette-0)',
  'var(--palette-1)',
  'var(--palette-2)',
  'var(--palette-3)',
  'var(--palette-4)',
  'var(--palette-5)',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export default function SubjectCard({ subject }: SubjectCardProps) {
  const color = PALETTE[hashString(subject._id) % PALETTE.length];
  const semesterLabel = subject.semester
    ? subject.semester.title || `Sem ${subject.semester.semesterNumber}`
    : '';
  const courseName = subject.course?.name || '';
  const uniName = subject.university?.name || '';

  return (
    <Link to={`/subjects/${subject._id}`} className="discover-subject-card" style={{ '--card-accent': color } as React.CSSProperties}>
      <div className="discover-subject-card-header">
        <div className="discover-subject-icon" style={{ background: color + '18', color }}>
          <BookOpen size={20} />
        </div>
        <div className="discover-subject-card-title-group">
          <h3 className="discover-subject-card-title">{subject.name}</h3>
          {subject.code && (
            <span className="discover-subject-card-code">{subject.code}</span>
          )}
        </div>
      </div>

      {(courseName || uniName) && (
        <div className="discover-subject-card-context">
          {uniName && <span>{uniName}</span>}
          {uniName && courseName && <span className="discover-subject-card-sep">/</span>}
          {courseName && <span>{courseName}</span>}
          {semesterLabel && (
            <>
              <span className="discover-subject-card-sep">/</span>
              <span>{semesterLabel}</span>
            </>
          )}
        </div>
      )}

      <div className="discover-subject-card-stats">
        <div className="discover-subject-stat">
          <FileText size={14} />
          <span>{subject.totalNotes} {subject.totalNotes === 1 ? 'note' : 'notes'}</span>
        </div>
        {subject.averageRating > 0 && (
          <div className="discover-subject-stat">
            <StarRating rating={subject.averageRating} size={12} />
            <span>{subject.averageRating}</span>
            <span className="discover-subject-stat-dim">({subject.ratingsCount})</span>
          </div>
        )}
        {subject.totalDownloads > 0 && (
          <div className="discover-subject-stat">
            <Download size={14} />
            <span>{subject.totalDownloads}</span>
          </div>
        )}
      </div>

      {subject.resourceTypeCounts.length > 0 && (
        <div className="discover-subject-card-types">
          {subject.resourceTypeCounts
            .filter(rt => rt.count > 0)
            .slice(0, 4)
            .map(rt => (
              <span key={rt.type} className="discover-subject-type-badge">
                {rt.type.replace(/_/g, ' ')} ({rt.count})
              </span>
            ))}
        </div>
      )}
    </Link>
  );
}
