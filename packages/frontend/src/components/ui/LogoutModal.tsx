import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from './Modal';

interface LogoutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LogoutModal({ open, onClose }: LogoutModalProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    navigate('/');
  };

  return (
    <Modal open={open} onClose={onClose} width="380px">
      <div className="logout-modal-body">
        <div className="logout-modal-icon-wrap">
          <LogOut size={22} strokeWidth={2.5} />
        </div>
        <h3 className="logout-modal-title">Sign Out</h3>
        <p className="logout-modal-desc">
          Are you sure you want to sign out? You'll need to log in again to access your notes and bookmarks.
        </p>
        <div className="logout-modal-actions">
          <button onClick={onClose} className="logout-modal-btn logout-modal-btn-cancel">
            Cancel
          </button>
          <button onClick={handleLogout} className="logout-modal-btn logout-modal-btn-confirm" disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : 'Sign Out'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
