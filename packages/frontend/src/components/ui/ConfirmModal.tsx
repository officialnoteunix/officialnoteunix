import Modal from './Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="confirm-modal">
        <div className={`confirm-modal-icon ${variant}`}>
          {variant === 'danger' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
        </div>
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-msg">{message}</p>
        <div className="confirm-modal-actions">
          <button onClick={onClose} className="btn-rounded btn-ghost" style={{ padding: '10px 20px', fontSize: 13 }} disabled={loading}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-rounded"
            style={{
              padding: '10px 20px',
              fontSize: 13,
              backgroundColor: variant === 'danger' ? 'var(--danger)' : 'var(--primary)',
              color: '#fff',
            }}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
