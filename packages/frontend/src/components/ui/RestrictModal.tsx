import { useState } from 'react';
import Modal from './Modal';
import { Clock, Ban, ShieldOff, UserX } from 'lucide-react';

interface RestrictModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
  onRestrict: (durationHours: number | 'permanent') => void;
  loading?: boolean;
}

const DURATION_OPTIONS = [
  { label: '1h', value: 1 },
  { label: '6h', value: 6 },
  { label: '12h', value: 12 },
  { label: '24h', value: 24 },
  { label: '48h', value: 48 },
  { label: '7d', value: 168 },
];

export default function RestrictModal({ open, onClose, userName, userAvatar, onRestrict, loading }: RestrictModalProps) {
  const [mode, setMode] = useState<'timed' | 'permanent' | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  const handleClose = () => {
    setMode(null);
    setDuration(null);
    onClose();
  };

  const handleApply = () => {
    if (mode === 'permanent') {
      onRestrict('permanent');
      handleClose();
    } else if (mode === 'timed' && duration) {
      onRestrict(duration);
      handleClose();
    }
  };

  const canApply = (mode === 'timed' && duration !== null) || mode === 'permanent';

  return (
    <Modal open={open} onClose={handleClose} width="460px">
      <div className="restrict-modal">
        <div className="restrict-modal-user">
          <div className="restrict-modal-avatar">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} />
            ) : (
              userName?.charAt(0).toUpperCase() || '?'
            )}
          </div>
          <div className="restrict-modal-user-info">
            <div className="restrict-modal-user-name">{userName}</div>
            <div className="restrict-modal-user-label">Select restriction type</div>
          </div>
        </div>

        <div className="restrict-modal-body">
          <button
            type="button"
            className={`restrict-mode-card ${mode === 'timed' ? 'active' : ''}`}
            onClick={() => setMode('timed')}
          >
            <div className="restrict-mode-card-header">
              <div className="restrict-mode-icon timed">
                <Clock size={18} />
              </div>
              <div className="restrict-mode-card-info">
                <div className="restrict-mode-card-title">Timed Suspension</div>
                <div className="restrict-mode-card-desc">Restrict access for a specific duration</div>
              </div>
              <div className={`restrict-radio ${mode === 'timed' ? 'checked' : ''}`}>
                {mode === 'timed' && <div className="restrict-radio-dot" />}
              </div>
            </div>
            {mode === 'timed' && (
              <div className="restrict-duration-chips">
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`restrict-chip ${duration === opt.value ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setDuration(opt.value); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </button>

          <div className="restrict-mode-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className={`restrict-mode-card permanent ${mode === 'permanent' ? 'active' : ''}`}
            onClick={() => setMode('permanent')}
          >
            <div className="restrict-mode-card-header">
              <div className="restrict-mode-icon permanent">
                <Ban size={18} />
              </div>
              <div className="restrict-mode-card-info">
                <div className="restrict-mode-card-title">Permanent Ban</div>
                <div className="restrict-mode-card-desc">Irreversible — blocks access indefinitely</div>
              </div>
              <div className={`restrict-radio ${mode === 'permanent' ? 'checked danger' : ''}`}>
                {mode === 'permanent' && <div className="restrict-radio-dot danger" />}
              </div>
            </div>
          </button>
        </div>

        <div className="restrict-modal-footer">
          <button onClick={handleClose} className="btn-rounded btn-ghost" style={{ padding: '10px 20px', fontSize: 13 }} disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="btn-rounded"
            style={{
              padding: '10px 24px', fontSize: 13, fontWeight: 700,
              backgroundColor: !canApply ? 'var(--text-light)' : mode === 'permanent' ? 'var(--danger)' : 'var(--warning)',
              color: '#fff', opacity: canApply ? 1 : 0.4, cursor: canApply ? 'pointer' : 'not-allowed',
              border: 'none',
            }}
            disabled={!canApply || !!loading}
          >
            {loading ? 'Processing...' : mode === 'permanent' ? (
              <><Ban size={14} /> Ban Permanently</>
            ) : duration ? (
              <><Clock size={14} /> Restrict for {duration}h</>
            ) : 'Apply Restriction'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
