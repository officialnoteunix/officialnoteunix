import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Heart, Reply, Trash2, ChevronDown, ChevronRight, User } from 'lucide-react';
import { commentApi } from '../../api/comment';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface Comment {
  _id: string;
  noteId: string;
  userId: { _id: string; fullname: string; email: string; avatar?: string | null };
  content: string;
  parentComment: string | null;
  likes: string[];
  createdAt: string;
  replies: Comment[];
}

interface Props {
  noteId: string;
}

export default function CommentSection({ noteId }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await commentApi.list(noteId);
      setComments(res.data.data);
    } catch {
      showToast('error', 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [noteId, showToast]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleCreate = async () => {
    if (!user) { navigate('/login'); return; }
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await commentApi.create(noteId, newComment.trim());
      setComments(prev => [res.data.data, ...prev]);
      setNewComment('');
    } catch {
      showToast('error', 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await commentApi.delete(id);
      setComments(prev => prev.filter(c => c._id !== id));
    } catch {
      showToast('error', 'Failed to delete comment');
    }
  };

  return (
    <div className="comment-section">
      <div className="comment-header">
        <MessageSquare size={16} />
        <span>Comments ({comments.length})</span>
      </div>

      <div className="comment-form">
        <textarea
          className="form-input"
          placeholder={user ? 'Write a comment...' : 'Log in to comment'}
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          rows={3}
          disabled={!user}
        />
        {user && (
          <button
            className="btn-rounded btn-primary"
            style={{ alignSelf: 'flex-end', padding: '8px 20px', fontSize: 13 }}
            onClick={handleCreate}
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 100 }}>
          <div className="spinner" />
        </div>
      ) : comments.length === 0 ? (
        <div className="comment-empty">
          <MessageSquare size={32} />
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="comment-list">
          {comments.map(comment => (
            <CommentThread
              key={comment._id}
              comment={comment}
              currentUser={user}
              onReply={fetchComments}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentThread({ comment, currentUser, onReply, onDelete }: {
  comment: Comment;
  currentUser: { id: string; role: string } | null;
  onReply: () => void;
  onDelete: (id: string) => void;
}) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showReplies, setShowReplies] = useState(true);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [liked, setLiked] = useState(
    currentUser ? comment.likes.includes(currentUser.id) : false
  );
  const [likesCount, setLikesCount] = useState(comment.likes.length);

  const handleLike = async () => {
    if (!currentUser) { navigate('/login'); return; }
    try {
      const res = await commentApi.like(comment._id);
      setLiked(res.data.data.likes.some((id: string) => id === currentUser.id));
      setLikesCount(res.data.data.likesCount);
    } catch {
      showToast('error', 'Failed to like comment');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await commentApi.reply(comment._id, replyText.trim());
      setReplyText('');
      setReplying(false);
      onReply();
    } catch {
      showToast('error', 'Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const isOwner = currentUser && currentUser.id === comment.userId._id;
  const isAdmin = currentUser?.role === 'admin';
  const timeAgo = getTimeAgo(comment.createdAt);
  const initial = comment.userId.fullname.charAt(0).toUpperCase();

  return (
    <div className="comment-thread">
      <div className="comment-card">
        <div className="comment-avatar">{initial}</div>
        <div className="comment-body">
          <div className="comment-meta">
            <span className="comment-author">{comment.userId.fullname}</span>
            <span className="comment-time">{timeAgo}</span>
          </div>
          <div className="comment-content">{comment.content}</div>
          <div className="comment-actions">
            <button className="comment-action-btn" onClick={handleLike}>
              <Heart size={13} fill={liked ? 'var(--danger)' : 'none'} color={liked ? 'var(--danger)' : 'var(--text-light)'} />
              <span>{likesCount}</span>
            </button>
            {currentUser && (
              <button className="comment-action-btn" onClick={() => setReplying(!replying)}>
                <Reply size={13} />
                <span>Reply</span>
              </button>
            )}
            {(isOwner || isAdmin) && (
              <button className="comment-action-btn" onClick={() => onDelete(comment._id)}>
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}
          </div>

          {replying && (
            <div className="comment-form reply-form">
              <textarea
                className="form-input"
                placeholder="Write a reply..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={2}
                autoFocus
              />
              <div className="reply-form-actions">
                <button className="btn-rounded btn-primary" style={{ padding: '6px 16px', fontSize: 12 }} onClick={handleReply} disabled={submittingReply || !replyText.trim()}>
                  {submittingReply ? 'Posting...' : 'Reply'}
                </button>
                <button className="btn-rounded btn-ghost" style={{ padding: '6px 16px', fontSize: 12 }} onClick={() => { setReplying(false); setReplyText(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          <button className="comment-toggle-replies" onClick={() => setShowReplies(!showReplies)}>
            {showReplies ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {showReplies ? 'Hide replies' : `${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
          </button>
          {showReplies && comment.replies.map(reply => (
            <CommentThread
              key={reply._id}
              comment={reply}
              currentUser={currentUser}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: string): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}
