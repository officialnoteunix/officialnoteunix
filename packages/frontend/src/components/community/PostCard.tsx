import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, UserPlus, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';
import { feedApi } from '../../api/feed';
import type { FeedPost } from '../../api/feed';

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function authorHref(author?: any) {
  if (!author) return '/community';
  return `/community/${author.username || author.id}`;
}

export default function PostCard({ post, onDeleted, onChanged }: { post: FeedPost; onDeleted?: (id: string) => void; onChanged?: (p: FeedPost) => void }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likes, setLikes] = useState(post.likesCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwner = user?.id === post.author?.id;
  const isMaintainer = user?.permissions?.includes('feed:moderate');

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return showToast('error', 'Please log in to like');
    try {
      const res = await feedApi.like(post.id);
      setLiked(res.data.data.isLiked);
      setLikes(res.data.data.likesCount);
      onChanged?.({ ...post, isLiked: res.data.data.isLiked, likesCount: res.data.data.likesCount });
    } catch (err) {
      showToast('error', getApiError(err, 'Action failed'));
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    try {
      await feedApi.remove(post.id);
      showToast('success', 'Post deleted');
      onDeleted?.(post.id);
    } catch (err) {
      showToast('error', getApiError(err, 'Delete failed'));
    }
  };

  return (
    <article className="content-card feed-post">
      <div className="feed-post-head">
        <Link to={authorHref(post.author)} className="feed-avatar">
          {post.author?.avatar ? (
            <img src={post.author.avatar} alt="" />
          ) : (
            <span>{(post.author?.fullname || 'U').slice(0, 1).toUpperCase()}</span>
          )}
        </Link>
        <div className="feed-post-meta">
          <Link to={authorHref(post.author)} className="feed-author-name">{post.author?.fullname || 'Unknown'}</Link>
          <span className="feed-post-time">· {timeAgo(post.createdAt)}</span>
        </div>
        {(isOwner || isMaintainer) && (
          <div className="feed-post-menu">
            <button onClick={() => setMenuOpen(o => !o)} aria-label="More"><MoreHorizontal size={18} /></button>
            {menuOpen && (
              <div className="feed-menu-dropdown">
                <button className="feed-menu-danger" onClick={handleDelete}><Trash2 size={14} /> Delete</button>
              </div>
            )}
          </div>
        )}
      </div>

      {post.content && <p className="feed-post-content">{post.content}</p>}

      {post.media?.length > 0 && (
        <div className={`feed-media-grid count-${Math.min(post.media.length, 4)}`}>
          {post.media.map((m, i) => (
            <a key={i} href={m.url} target="_blank" rel="noreferrer" className="feed-media-item" onClick={(e) => e.stopPropagation()}>
              {m.kind === 'video' ? (
                <video src={m.url} controls preload="metadata" />
              ) : (
                <img src={m.url} alt="" loading="lazy" />
              )}
            </a>
          ))}
        </div>
      )}

      {post.tags?.length > 0 && (
        <div className="feed-tags">
          {post.tags.map((t, i) => <span key={i} className="feed-tag">#{t}</span>)}
        </div>
      )}

      <div className="feed-post-actions">
        <button className={`feed-action ${liked ? 'liked' : ''}`} onClick={toggleLike}><Heart size={18} /> {likes}</button>
        <Link to={`/community/post/${post.id}`} className="feed-action"><MessageCircle size={18} /> {post.commentsCount}</Link>
        <button className="feed-action" onClick={(e) => { e.preventDefault(); navigator.clipboard?.writeText(`${window.location.origin}/community/post/${post.id}`); showToast('success', 'Link copied'); }}><Share2 size={18} /> {post.sharesCount}</button>
      </div>
    </article>
  );
}
