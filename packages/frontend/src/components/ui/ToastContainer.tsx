import { useState, useEffect } from 'react';
import { useToast, type ToastType } from '../../context/ToastContext';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons: Record<ToastType, { icon: typeof CheckCircle; color: string; bg: string }> = {
  success: { icon: CheckCircle, color: 'var(--secondary)', bg: 'var(--secondary-light)' },
  error: { icon: XCircle, color: 'var(--danger)', bg: 'var(--danger-light)' },
  warning: { icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-light)' },
  info: { icon: Info, color: 'var(--primary)', bg: 'var(--primary-light)' },
};

function ToastItem({ id, type, message, onRemove }: { id: number; type: ToastType; message: string; onRemove: (id: number) => void }) {
  const [exiting, setExiting] = useState(false);
  const cfg = icons[type];
  const Icon = cfg.icon;

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(id), 250);
  };

  useEffect(() => {
    const timer = setTimeout(handleClose, 4000);
    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <div className={`toast ${exiting ? 'toast-exit' : ''}`} style={{ borderLeft: `3px solid ${cfg.color}` }}>
      <div className="toast-icon" style={{ background: cfg.bg, color: cfg.color }}>
        <Icon size={16} />
      </div>
      <p className="toast-msg">{message}</p>
      <button className="toast-close" onClick={handleClose}><X size={14} /></button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <ToastItem key={t.id} id={t.id} type={t.type} message={t.message} onRemove={removeToast} />
      ))}
    </div>
  );
}
