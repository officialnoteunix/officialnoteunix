import { useEffect, useCallback } from 'react';

const EVENT = 'stats-refresh';

export function emitStatsRefresh() {
  try { window.dispatchEvent(new CustomEvent(EVENT)); } catch {}
}

export function useStatsRefresh(callback: () => void) {
  const cb = useCallback(callback, [callback]);
  useEffect(() => {
    const handler = () => cb();
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [cb]);
}
