import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Medal, Award, Download, Star, TrendingUp, Users,
  ArrowUpRight, ChevronRight,
} from 'lucide-react';
import { leaderboardApi } from '../api/leaderboard';
import StarRating from '../components/ui/StarRating';
import SEO from '../components/seo/SEO';

const RANK = [
  { icon: Trophy, color: '#f59e0b' },
  { icon: Medal, color: '#94a3b8' },
  { icon: Award, color: '#cd7f32' },
];

export default function Leaderboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardApi.get()
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="lb-page">
        <div className="loading-screen" style={{ minHeight: 400 }}>
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  const contributors = data?.topContributors || [];

  return (
    <div className="lb-page">
      <SEO title="Leaderboard" description="Top contributors and most popular notes on NoteUniX" />

      <div className="lb-header">
        <div className="lb-header-row">
          <Trophy size={24} style={{ color: 'var(--warning)' }} />
          <div>
            <h1>Leaderboard</h1>
            <p className="lb-header-sub">Top contributors and most popular notes on NoteUniX</p>
          </div>
        </div>
        <div className="lb-accent-bar" />
      </div>

      {contributors.length > 0 && (
        <section className="lb-section">
          <div className="lb-section-header">
            <Users size={16} style={{ color: 'var(--text-muted)' }} />
            <h2 className="lb-section-title">Top Contributors</h2>
          </div>

          <div className="lb-podium-top">
            {contributors[0] && <PodiumCard user={contributors[0]} rank={0} />}
            {contributors[1] && <PodiumCard user={contributors[1]} rank={1} />}
            {contributors[2] && <PodiumCard user={contributors[2]} rank={2} />}
          </div>

          {contributors.length > 3 && (
            <div className="lb-contributors-list">
              {contributors.slice(3).map((user: any, i: number) => (
                <div key={user._id} className="lb-contributor-row">
                  <span className="lb-contributor-rank">#{i + 4}</span>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullname} className="lb-contributor-avatar" />
                  ) : (
                    <div className="lb-contributor-avatar-fallback">
                      {user.fullname?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="lb-contributor-info">
                    <div className="lb-contributor-name">{user.fullname}</div>
                    <div className="lb-contributor-meta">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Download size={9} /> {user.totalDownloads || 0}
                      </span>
                      <span>{user.noteCount || 0} notes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="lb-notes-grid">
        <section className="lb-section" style={{ marginBottom: 0 }}>
          <div className="lb-section-header">
            <Star size={15} style={{ color: 'var(--primary)' }} />
            <h2 className="lb-section-title">Top Rated</h2>
          </div>
          {data?.topRated?.length > 0 ? (
            <div>
              {data.topRated.map((note: any, i: number) => (
                <Link key={note._id} to={`/notes/${note._id}`} className="lb-note-link">
                  <span className="lb-note-rank">#{i + 1}</span>
                  <div className="lb-note-info">
                    <div className="lb-note-title">{note.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <StarRating rating={note.averageRating || 0} size={10} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {note.averageRating?.toFixed(1) || '0.0'}
                        <span style={{ color: 'var(--text-light)' }}> ({note.ratingsCount || 0})</span>
                      </span>
                    </div>
                    <div className="lb-note-meta">
                      {note.user?.fullname || 'Unknown'}
                      <span style={{ margin: '0 2px' }}>·</span>
                      <Download size={9} /> {note.downloads || 0}
                    </div>
                  </div>
                  <ChevronRight size={13} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          ) : (
            <Empty message="No rated notes yet" />
          )}
        </section>

        <section className="lb-section" style={{ marginBottom: 0 }}>
          <div className="lb-section-header">
            <TrendingUp size={15} style={{ color: 'var(--secondary)' }} />
            <h2 className="lb-section-title">Most Downloaded</h2>
          </div>
          {data?.topDownloaded?.length > 0 ? (
            <div>
              {data.topDownloaded.map((note: any, i: number) => (
                <Link key={note._id} to={`/notes/${note._id}`} className="lb-note-link">
                  <div className="lb-note-download-badge">
                    <Download size={13} style={{ color: 'var(--secondary)' }} />
                  </div>
                  <div className="lb-note-info">
                    <div className="lb-note-title">{note.title}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                      <span className="lb-note-download-count">{note.downloads || 0}</span>
                      <span className="lb-note-download-label">downloads</span>
                    </div>
                    <div className="lb-note-meta">
                      {note.userId?.fullname || 'Unknown'}
                      <span style={{ margin: '0 2px' }}>·</span>
                      <StarRating rating={note.averageRating || 0} size={9} />
                      <span style={{ marginLeft: 2 }}>({note.ratingsCount || 0})</span>
                    </div>
                  </div>
                  <ArrowUpRight size={13} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          ) : (
            <Empty message="No downloads yet" />
          )}
        </section>
      </div>

      <div className="lb-footer-note">
        Rankings update in real-time based on user activity
      </div>
    </div>
  );
}

function PodiumCard({ user, rank }: { user: any; rank: number }) {
  const r = RANK[rank];
  return (
    <div className={`lb-podium-card rank-${rank}`}>
      <div className="lb-podium-rank">
        <r.icon size={22} style={{ color: r.color }} />
      </div>
      {user.avatar ? (
        <img src={user.avatar} alt={user.fullname} className="lb-podium-avatar" />
      ) : (
        <div className="lb-podium-avatar-fallback">
          {user.fullname?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="lb-podium-card-body">
        <div className="lb-podium-name">{user.fullname}</div>
        <div className="lb-podium-stats">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Download size={9} /> {user.totalDownloads || 0}
          </span>
          <span>{user.noteCount || 0} notes</span>
        </div>
      </div>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="empty-state" style={{ padding: 32 }}>
      <p>{message}</p>
    </div>
  );
}
