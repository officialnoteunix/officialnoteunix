import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus, UserCheck, FileText } from 'lucide-react';
import { feedApi } from '../../api/feed';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';
import PostCard from '../../components/community/PostCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function CommunityProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await feedApi.userPosts(id as string);
      setProfile(res.data.data.user);
      setPosts(res.data.data.posts || []);
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to load profile'));
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!profile || !user) return;
    // Determine follow state by checking posts author vs followingCount is not reliable;
    // we infer via a lightweight follow-check not provided, so default false.
  }, [profile, user]);

  const toggleFollow = async () => {
    if (!user) return showToast('error', 'Please log in');
    try {
      const res = await feedApi.follow(id as string);
      setFollowing(res.data.data.isFollowing);
      setProfile((p: any) => ({ ...p, followersCount: res.data.data.followersCount }));
      showToast('success', res.data.data.isFollowing ? 'Following' : 'Unfollowed');
    } catch (err) {
      showToast('error', getApiError(err, 'Action failed'));
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!profile) return <div className="empty-state content-card">User not found.</div>;

  const isSelf = user?.id === profile.id;

  return (
    <div className="community-page">
      <div className="content-card community-profile-card">
        <div className="community-profile-banner" />
        <div className="community-profile-body">
          <div className="feed-avatar lg">
            {profile.avatar ? <img src={profile.avatar} alt="" /> : <span>{(profile.fullname || 'U').slice(0, 1).toUpperCase()}</span>}
          </div>
          <div className="community-profile-info">
            <h1>{profile.fullname}</h1>
            {profile.username && <span className="feed-post-time">@{profile.username}</span>}
            {profile.bio && <p className="community-profile-bio">{profile.bio}</p>}
            <div className="community-profile-stats">
              <span><strong>{profile.followersCount || 0}</strong> followers</span>
              <span><strong>{profile.followingCount || 0}</strong> following</span>
              <span><strong>{posts.length}</strong> posts</span>
            </div>
          </div>
          {!isSelf && user && (
            <button className={`btn-rounded ${following ? 'btn-outline' : 'btn-primary'}`} onClick={toggleFollow}>
              {following ? <><UserCheck size={15} /> Following</> : <><UserPlus size={15} /> Follow</>}
            </button>
          )}
        </div>
      </div>

      <h3 style={{ fontSize: 16, margin: '8px 4px' }}>Posts</h3>
      <div className="feed-list">
        {posts.map(p => <PostCard key={p.id} post={p} onDeleted={(pid) => setPosts(prev => prev.filter(x => x.id !== pid))} />)}
      </div>
      {posts.length === 0 && <div className="empty-state content-card">No public posts yet.</div>}
    </div>
  );
}
