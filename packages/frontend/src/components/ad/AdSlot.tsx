import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { adApi } from '../../api/ad';
import { useAdImpression } from './useAdImpression';

interface AdSlotProps {
  slot: string;
  className?: string;
}

export default function AdSlot({ slot, className = '' }: AdSlotProps) {
  const [ads, setAds] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adApi.activeBySlot(slot)
      .then(res => setAds(res.data.data || []))
      .catch(() => {});
  }, [slot]);

  useEffect(() => {
    setIdx(0);
  }, [ads.length]);

  const next = useCallback(() => {
    setIdx(prev => (prev + 1) % ads.length);
  }, [ads.length]);

  const prev = useCallback(() => {
    setIdx(prev => (prev - 1 + ads.length) % ads.length);
  }, [ads.length]);

  useEffect(() => {
    if (ads.length <= 1 || paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(next, 4000);
    return () => clearInterval(intervalRef.current);
  }, [ads.length, paused, next]);

  if (!ads.length) return null;

  return (
    <div
      ref={containerRef}
      className={`ad-slot ad-slot--${slot}${className ? ' ' + className : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {ads.length > 1 && (
        <button className="ad-carousel-btn ad-carousel-btn--prev" onClick={prev} aria-label="Previous ad">
          <ChevronLeft size={16} />
        </button>
      )}

      <div className="ad-carousel-viewport">
        <div
          className="ad-carousel-track"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {ads.map(ad => (
            <div key={ad._id} className="ad-carousel-slide">
              <AdCard ad={ad} />
            </div>
          ))}
        </div>
      </div>

      {ads.length > 1 && (
        <button className="ad-carousel-btn ad-carousel-btn--next" onClick={next} aria-label="Next ad">
          <ChevronRight size={16} />
        </button>
      )}

      {ads.length > 1 && (
        <div className="ad-carousel-dots">
          {ads.map((_, i) => (
            <button
              key={i}
              className={`ad-carousel-dot${i === idx ? ' active' : ''}`}
              onClick={() => setIdx(i)}
              aria-label={`Go to ad ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AdCard({ ad }: { ad: any }) {
  const ref = useAdImpression(ad._id);

  const bgStyle = ad.imageUrl
    ? { backgroundImage: `url(${ad.imageUrl})` }
    : { background: '#e0e7ff' };

  const handleClick = () => {
    adApi.click(ad._id).catch(() => {});
  };

  const content = (
    <div ref={ref} className="ad-card" style={bgStyle}>
      <span className="ad-label">Ad</span>
      {ad.description && <p className="ad-desc">{ad.description}</p>}
    </div>
  );

  if (ad.linkUrl) {
    return (
      <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" onClick={handleClick}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        {content}
      </a>
    );
  }

  return content;
}
