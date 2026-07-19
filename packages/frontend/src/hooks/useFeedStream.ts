import { useEffect, useRef } from 'react';

interface FeedStreamOptions {
  enabled?: boolean;
  onPost?: (post: any) => void;
  onReady?: () => void;
}

// Subscribes to the backend SSE live-feed endpoint. Pushes new public posts
// as they are created so the feed can update without polling.
export function useFeedStream({ enabled = true, onPost, onReady }: FeedStreamOptions) {
  const onPostRef = useRef(onPost);
  const onReadyRef = useRef(onReady);
  onPostRef.current = onPost;
  onReadyRef.current = onReady;

  useEffect(() => {
    if (!enabled) return;
    if (typeof EventSource === 'undefined') return; // graceful fallback (no live updates)

    const base = import.meta.env.VITE_BACKEND_URL || '';
    const url = `${base}/api/feed/stream`;
    const es = new EventSource(url, { withCredentials: true });

    es.addEventListener('ready', () => onReadyRef.current?.());
    es.addEventListener('post', (e: any) => {
      try {
        const post = JSON.parse(e.data);
        onPostRef.current?.(post);
      } catch { /* ignore */ }
    });
    es.onerror = () => { /* EventSource auto-reconnects */ };

    return () => es.close();
  }, [enabled]);
}

export default useFeedStream;
