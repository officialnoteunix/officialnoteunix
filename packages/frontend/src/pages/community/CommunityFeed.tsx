import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Users, Clock, TrendingUp } from 'lucide-react';
import { feedApi } from '../../api/feed';
import type { FeedPost } from '../../api/feed';
import PostCard from '../../components/community/PostCard';
import PostComposer from '../../components/community/PostComposer';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useFeedStream } from '../../hooks/useFeedStream';

const TABS = [
  { key: 'for-you', label: 'For You', icon: Sparkles },
  { key: 'following', label: 'Following', icon: Users },
  { key: 'new', label: 'New', icon: Clock },
  { key: 'top', label: 'Top', icon: TrendingUp },
];

export default function CommunityFeed() {
  const [tab, setTab] = useState('for-you');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const res = await feedApi.feed(tab, reset ? null : cursor, 20);
      const { posts: newPosts, nextCursor } = res.data.data;
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setCursor(nextCursor || null);
      setHasMore(Boolean(nextCursor));
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [tab, cursor]);

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    setLiveCount(0);
    load(true);
  }, [tab]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const ob = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) load(false);
    }, { rootMargin: '300px' });
    ob.observe(el);
    return () => ob.disconnect();
  }, [hasMore, loading, load]);

  // SSE live updates: prepend new posts for the active tab (for-you/new/top)
  useFeedStream({
    onPost: (post: FeedPost) => {
      setPosts(prev => {
        if (prev.some(p => p.id === post.id)) return prev;
        if (tab === 'top') return prev; // top is score-sorted; ignore live
        return [post, ...prev];
      });
      if (tab !== 'following') setLiveCount(c => c + 1);
    },
  });

  const flushLive = () => {
    setLiveCount(0);
  };

  const handlePosted = (post: FeedPost) => {
    setPosts(prev => [post, ...prev]);
  };

  const handleDeleted = (id: string) => setPosts(prev => prev.filter(p => p.id !== id));

  return (
    <div className="community-page">
      <div className="community-header">
        <h1>Community</h1>
      </div>

      <PostComposer onPosted={handlePosted} />

      <div className="feed-tabs">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} className={`feed-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {liveCount > 0 && (
        <button className="feed-live-banner" onClick={flushLive}>
          {liveCount} new {liveCount === 1 ? 'post' : 'posts'} — tap to refresh
        </button>
      )}

      <div className="feed-list">
        {posts.map(p => (
          <PostCard key={p.id} post={p} onDeleted={handleDeleted} />
        ))}
      </div>

      {loading && <LoadingSpinner />}
      {!loading && posts.length === 0 && (
        <div className="empty-state content-card">
          {tab === 'following'
            ? 'No posts yet from people you follow. Explore For You and follow creators you like!'
            : 'No posts yet. Be the first to share something!'}
        </div>
      )}
      <div ref={sentinel} style={{ height: 1 }} />
    </div>
  );
}
