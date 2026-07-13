import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adApi } from '../../api/ad';

export default function AdMarquee() {
  const [items, setItems] = useState<{ _id: string; text: string; link: string }[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    adApi.activeBySlot('marquee')
      .then(res => {
        const data = res.data.data || [];
        setItems(data.map((ad: any) => ({
          _id: ad._id,
          text: ad.description || '',
          link: ad.linkUrl || '',
        })));
      })
      .catch(() => {});
  }, []);

  if (!items.length) return null;

  const duplicated = [...items, ...items];

  return (
    <div
      className="ad-marquee"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="ad-marquee-inner">
        <div className={`ad-marquee-track${paused ? ' ad-marquee--paused' : ''}`}>
          {duplicated.map((item, i) => (
            <span key={`${item._id}-${i}`} className="ad-marquee-item">
              <span className="ad-marquee-dot" />
              <span className="ad-marquee-badge">Ad</span>
              {item.link ? (
                String(item.link).startsWith('http') ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="ad-marquee-text">{item.text}</a>
                ) : (
                  <Link to={item.link} className="ad-marquee-text">{item.text}</Link>
                )
              ) : (
                <span className="ad-marquee-text">{item.text}</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
