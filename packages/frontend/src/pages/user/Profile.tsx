import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Shield, Calendar, Camera, User } from 'lucide-react';
import { userApi } from '../../api/user';
import { feedApi } from '../../api/feed';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const handleAvatarClick = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('avatar', file);
      try {
        await userApi.uploadAvatar(fd);
        await refreshUser();
        showToast('success', 'Avatar updated');
      } catch (err) {
        showToast('error', getApiError(err, 'Avatar upload failed'));
      }
    };
    input.click();
  };

  const initials = user?.fullname?.split(' ').map(s => s[0]).join('').toUpperCase() || 'U';

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, fontFamily: 'var(--font-heading)' }}>Profile</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>Your personal information and account details</p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Avatar + Name Card */}
        <div className="content-card" style={{ flex: '0 0 320px', padding: 40, textAlign: 'center', alignSelf: 'start' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
            <div style={{
              width: 104, height: 104, borderRadius: '50%',
              background: user?.avatar ? `url(${user.avatar}) center/cover` : 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, fontWeight: 800, fontFamily: 'var(--font-heading)',
              border: '3px solid var(--border-color)',
              transition: 'var(--transition)',
            }}>
              {!user?.avatar && initials}
            </div>
            <button onClick={handleAvatarClick} style={{
              position: 'absolute', bottom: 2, right: 2,
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--primary)', color: '#fff',
              border: '2px solid var(--bg-surface)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, transition: 'var(--transition)',
            }}>
              <Camera size={14} />
            </button>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2, fontFamily: 'var(--font-heading)' }}>{user?.fullname}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 0, textTransform: 'capitalize' }}>{user?.role}</p>
        </div>

        {/* Details Card */}
        <div className="content-card" style={{ flex: '1 1 360px', padding: 32, alignSelf: 'start' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, fontFamily: 'var(--font-heading)' }}>Account Details</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="profile-info-row">
              <span className="profile-info-label"><Mail size={15} /> Email</span>
              <span className="profile-info-value">{user?.email}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label"><Shield size={15} /> Role</span>
              <span className="profile-info-value" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label"><User size={15} /> Full Name</span>
              <span className="profile-info-value">{user?.fullname}</span>
            </div>
            <div className="profile-info-row" style={{ borderBottom: 'none' }}>
              <span className="profile-info-label"><Calendar size={15} /> Member since</span>
              <span className="profile-info-value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Community Profile Card */}
      <div className="content-card" style={{ flex: '1 1 360px', padding: 32, alignSelf: 'start' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, fontFamily: 'var(--font-heading)' }}>Community Profile</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          This is your public identity in the <Link to="/community" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Community feed</Link>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="profile-info-label" style={{ marginBottom: 6, display: 'block' }}>Username</label>
            <input
              className="form-input"
              value={username}
              maxLength={20}
              placeholder="username"
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>3–20 chars: lowercase letters, numbers, underscore. Used at /community/@{username || 'you'}</span>
          </div>
          <div>
            <label className="profile-info-label" style={{ marginBottom: 6, display: 'block' }}>Bio</label>
            <textarea
              className="form-input"
              value={bio}
              maxLength={160}
              rows={3}
              placeholder="Tell the community about yourself..."
              onChange={(e) => setBio(e.target.value)}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bio.length}/160</span>
          </div>
          <button
            className="btn-rounded btn-primary"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await feedApi.updateProfile({ username: username || undefined, bio });
                await refreshUser();
                showToast('success', 'Community profile updated');
              } catch (err) {
                showToast('error', getApiError(err, 'Update failed'));
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Community Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
