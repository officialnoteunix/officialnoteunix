import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | string)[] = [];
    const delta = window.innerWidth < 640 ? 1 : 2;
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);

    if (start > 1) pages.push(1);
    if (start > 2) pages.push('...');

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < totalPages - 1) pages.push('...');
    if (end < totalPages) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="pagination-bar">
      <span className="pagination-total">
        {total} result{total !== 1 ? 's' : ''}
      </span>
      <div className="pagination-pages">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-rounded btn-ghost"
          style={{ padding: '7px 10px', fontSize: 12, opacity: page <= 1 ? 0.4 : 1, display: 'flex', gap: 2, alignItems: 'center' }}
        >
          <ChevronLeft size={14} />
        </button>
        {getPages().map((p, i) =>
          typeof p === 'string' ? (
            <span key={`e${i}`} style={{ padding: '0 4px', fontSize: 12, color: 'var(--text-light)' }}>...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={p === page ? 'btn-rounded btn-primary' : 'btn-rounded btn-ghost'}
              style={{ padding: '7px 12px', fontSize: 12, minWidth: 32 }}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-rounded btn-ghost"
          style={{ padding: '7px 10px', fontSize: 12, opacity: page >= totalPages ? 0.4 : 1, display: 'flex', gap: 2, alignItems: 'center' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
