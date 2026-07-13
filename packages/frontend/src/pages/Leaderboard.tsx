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
      <div style={{ padding: '100px 5% 60px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="loading-screen" style={{ minHeight: 400 }}>
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  const contributors = data?.topContributors || [];

  return (
    <div style={{ padding: '100px 5% 60px', maxWidth: 1200, margin: '0 auto' }}>
      <SEO title="Leaderboard" description="Top contributors and most popular notes on NoteUniX" />
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <Trophy size={24} style={{ color: 'var(--warning)' }} />
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px' }}>Leaderboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>
              Top contributors and most popular notes on NoteUniX
            </p>
          </div>
        </div>
        <div style={{
          height: 3, width: 60, borderRadius: 2,
          background: 'var(--warning)', marginTop: 8,
        }} />
      </div>

      {contributors.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} style={{ color: 'var(--text-muted)' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Top Contributors</h2>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16,
            marginBottom: 12,
          }}>
            <div />
            <div>
              {contributors[0] && <PodiumCard user={contributors[0]} rank={0} />}
            </div>
            <div />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {contributors[1] && <PodiumCard user={contributors[1]} rank={1} />}
            {contributors[2] && <PodiumCard user={contributors[2]} rank={2} />}
          </div>

          {contributors.length > 3 && (
            <div style={{
              border: '1px solid var(--border-color)', borderRadius: 14,
              overflow: 'hidden',
            }}>
              {contributors.slice(3).map((user: any, i: number) => (
                <div key={user._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px',
                  borderBottom: i < contributors.length - 4 ? '1px solid var(--border-color)' : 'none',
                }}>
                  <span style={{
                    width: 28, textAlign: 'center', fontSize: 12,
                    fontWeight: 600, color: 'var(--text-light)', flexShrink: 0,
                  }}>#{i + 4}</span>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullname}
                      style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'var(--primary-light)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 11, flexShrink: 0,
                    }}>{user.fullname?.charAt(0).toUpperCase()}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: 13,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{user.fullname}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 48 }}>
        <section>
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={15} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Top Rated</h2>
          </div>
          {data?.topRated?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.topRated.map((note: any, i: number) => (
                <Link key={note._id} to={`/notes/${note._id}`} className="leaderboard-note-link"
                  style={{
                    border: '1px solid var(--border-color)', borderRadius: 12,
                    padding: '11px 14px', textDecoration: 'none', color: 'inherit',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--text-light)',
                    minWidth: 20, flexShrink: 0,
                  }}>#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: 13, lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{note.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <StarRating rating={note.averageRating || 0} size={10} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {note.averageRating?.toFixed(1) || '0.0'}
                        <span style={{ color: 'var(--text-light)' }}> ({note.ratingsCount || 0})</span>
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 1 }}>
                      {note.user?.fullname || 'Unknown'}
                      <span style={{ margin: '0 4px' }}>·</span>
                      <Download size={9} style={{ verticalAlign: -1 }} /> {note.downloads || 0}
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

        <section>
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={15} style={{ color: 'var(--secondary)' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Most Downloaded</h2>
          </div>
          {data?.topDownloaded?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.topDownloaded.map((note: any, i: number) => (
                <Link key={note._id} to={`/notes/${note._id}`} className="leaderboard-note-link"
                  style={{
                    border: '1px solid var(--border-color)', borderRadius: 12,
                    padding: '11px 14px', textDecoration: 'none', color: 'inherit',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'var(--secondary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Download size={13} style={{ color: 'var(--secondary)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: 13, lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{note.title}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--secondary)' }}>
                        {note.downloads || 0}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-light)' }}>downloads</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 1 }}>
                      {note.userId?.fullname || 'Unknown'}
                      <span style={{ margin: '0 4px' }}>·</span>
                      <StarRating rating={note.averageRating || 0} size={9} />
                      <span style={{ marginLeft: 2, fontSize: 10 }}>({note.ratingsCount || 0})</span>
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

      <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
        <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
          Rankings update in real-time based on user activity
        </p>
      </div>
    </div>
  );
}

function PodiumCard({ user, rank }: { user: any; rank: number }) {
  const r = RANK[rank];
  return (
    <div style={{
      border: '1px solid var(--border-color)', borderRadius: 14,
      padding: '18px 16px', textAlign: 'center',
      transition: 'all 0.2s',
    }}>
      <div style={{ marginBottom: 10 }}>
        <r.icon size={20} style={{ color: r.color }} />
      </div>
      {user.avatar ? (
        <img src={user.avatar} alt={user.fullname}
          style={{
            width: 48, height: 48, borderRadius: 12,
            objectFit: 'cover', margin: '0 auto 10px', display: 'block',
          }} />
      ) : (
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'var(--primary-light)', color: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 18, margin: '0 auto 10px',
        }}>{user.fullname?.charAt(0).toUpperCase()}</div>
      )}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
        {user.fullname}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'center', gap: 8 }}>
        <span><Download size={9} style={{ verticalAlign: -1 }} /> {user.totalDownloads || 0}</span>
        <span>{user.noteCount || 0} notes</span>
      </div>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div style={{
      border: '1px solid var(--border-color)', borderRadius: 12,
      padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
    }}>
      {message}
    </div>
  );
}
