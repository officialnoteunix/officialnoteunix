import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Trash2, UserPlus, UserCheck, Send } from 'lucide-react';
import { feedApi } from '../../api/feed';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';
import PostCard from '../../components/community/PostCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await feedApi.post(id as string);
      setPost(res.data.data.post);
      setComments(res.data.data.comments || []);
    } catch (err) {
      showToast('error', getApiError(err, 'Failed to load post'));
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => { load(); }, [load]);

  const submitComment = async () => {
    if (!text.trim()) return;
    if (!user) return showToast('error', 'Please log in to comment');
    setSubmitting(true);
    try {
      await feedApi.comment(id as string, text.trim());
      setText('');
      showToast('success', 'Comment added');
      load();
    } catch (err) {
      showToast('error', getApiError(err, 'Comment failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!post) return <div className="empty-state content-card">Post not found.</div>;

  return (
    <div className="community-page">
      <Link to="/community" className="feed-back-link"><ArrowLeft size={16} /> Back to Community</Link>
      <div className="content-card">
        <PostCard post={post} onChanged={setPost} />
      </div>

      <div className="content-card feed-comments">
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Comments ({comments.length})</h3>
        <div className="feed-comment-box">
          <textarea
            className="feed-composer-input"
            placeholder="Write a comment..."
            value={text}
            maxLength={2000}
            rows={2}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn-rounded btn-primary" disabled={submitting || !text.trim()} onClick={submitComment}>
            <Send size={15} /> Comment
          </button>
        </div>
        <div className="feed-comment-list">
          {comments.map((c) => (
            <div key={c._id} className="feed-comment">
              <Link to={`/community/${c.userId?.username || c.userId?._id}`} className="feed-avatar sm">
                {c.userId?.avatar ? <img src={c.userId.avatar} alt="" /> : <span>{(c.userId?.fullname || 'U').slice(0, 1).toUpperCase()}</span>}
              </Link>
              <div>
                <Link to={`/community/${c.userId?.username || c.userId?._id}`} className="feed-comment-author">{c.userId?.fullname}</Link>
                <p className="feed-comment-text">{c.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No comments yet. Start the conversation!</p>}
        </div>
      </div>
    </div>
  );
}
