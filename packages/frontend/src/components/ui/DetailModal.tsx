import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface Field {
  label: string;
  value: ReactNode;
}

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: Field[];
  children?: ReactNode;
}

export default function DetailModal({ open, onClose, title, fields, children }: DetailModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-detail-card" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3 className="modal-header-title" style={{ fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-detail-scroll">
          {fields.map((f, i) => (
            <div key={i} className="detail-field-row">
              <span className="detail-field-label">{f.label}</span>
              <span className="detail-field-value">{f.value}</span>
            </div>
          ))}
        </div>
        {children && <div className="modal-detail-footer">{children}</div>}
      </div>
    </div>
  );
}
