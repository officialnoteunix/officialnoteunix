import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api/user';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { User, Mail, Lock, Save, Trash2, KeyRound, UserCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';

const TAB_KEY = 'settings_active_tab';

type TabId = 'profile' | 'password' | 'danger';

const tabs: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'password', label: 'Password', icon: KeyRound },
  { id: 'danger', label: 'Danger Zone', icon: Trash2 },
];

export default function Settings() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem(TAB_KEY);
    if (saved === 'profile' || saved === 'password' || saved === 'danger') return saved;
    return 'profile';
  });

  useEffect(() => {
    localStorage.setItem(TAB_KEY, activeTab);
  }, [activeTab]);

  const [fullname, setFullname] = useState(user?.fullname || '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userApi.updateProfile({ fullname });
      showToast('success', 'Profile updated successfully');
    } catch (err) {
      showToast('error', getApiError(err, 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters');
      return;
    }
    setChangingPwd(true);
    try {
      await userApi.updatePassword({ currentPassword, newPassword });
      showToast('success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('error', getApiError(err, 'Failed to change password'));
    } finally {
      setChangingPwd(false);
    }
  };

  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await userApi.deleteAccount();
      window.location.href = '/';
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to delete account. Please try again.'));
      setDeleting(false);
      setShowDelete(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, fontFamily: 'var(--font-heading)' }}>Settings</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>Manage your account settings and preferences</p>

      <div className="settings-tabs-bar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="settings-tab-content">
        {activeTab === 'profile' && (
          <div className="content-card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCircle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Profile Information</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Update your personal details</p>
              </div>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Full Name</label>
                <div className="settings-input-wrap">
                  <User size={15} className="settings-input-icon" />
                  <input className="form-input" value={fullname} onChange={e => setFullname(e.target.value)} required style={{ paddingLeft: 40 }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 28 }}>
                <label>Email</label>
                <div className="settings-input-wrap">
                  <Mail size={15} className="settings-input-icon" />
                  <input className="form-input" value={user?.email || ''} disabled style={{ paddingLeft: 40, opacity: 0.55 }} />
                </div>
              </div>
              <button type="submit" className="btn-rounded btn-primary" style={{ padding: '12px 28px', fontSize: 13, gap: 8 }} disabled={saving}>
                <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="content-card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--palette-4-bg)', color: 'var(--palette-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <KeyRound size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Change Password</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Update your account password</p>
              </div>
            </div>

            <form onSubmit={handlePassword}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Current Password</label>
                <div className="auth-input-group">
                  <Lock size={15} />
                  <input type={showPwd ? 'text' : 'password'} className="auth-input" placeholder="Enter current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                  <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>New Password</label>
                <div className="auth-input-group">
                  <Lock size={15} />
                  <input type={showNew ? 'text' : 'password'} className="auth-input" placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                  <button type="button" className="auth-pwd-toggle" onClick={() => setShowNew(!showNew)} tabIndex={-1}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label>Confirm New Password</label>
                <div className="auth-input-group">
                  <Lock size={15} />
                  <input type={showConfirm ? 'text' : 'password'} className="auth-input" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  <button type="button" className="auth-pwd-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-rounded btn-primary" style={{ padding: '12px 28px', fontSize: 13, gap: 8 }} disabled={changingPwd}>
                <KeyRound size={15} /> {changingPwd ? 'Changing...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="content-card" style={{ padding: 32, borderColor: 'var(--danger-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--danger)' }}>Danger Zone</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Irreversible account actions</p>
              </div>
            </div>

            <div style={{ padding: 20, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger-light)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--danger)', marginBottom: 6 }}>Delete Account</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.65, marginBottom: 16 }}>
                    Once you delete your account, all your data including uploaded notes, bookmarks, and activity will be permanently removed. This action cannot be undone.
                  </p>
                  <button onClick={() => setShowDelete(true)} className="btn-rounded" style={{ padding: '10px 24px', fontSize: 13, gap: 8, backgroundColor: 'var(--danger)', color: '#fff' }}>
                    <Trash2 size={15} /> Delete My Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you absolutely sure? This will permanently delete your account and all associated data. This action cannot be undone."
        confirmLabel={deleting ? 'Deleting...' : 'Delete My Account'}
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
