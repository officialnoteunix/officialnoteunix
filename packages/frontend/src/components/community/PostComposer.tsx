import { useState, useRef } from 'react';
import { Image, Video, X, Send, Globe, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../utils/constants';
import { feedApi } from '../../api/feed';

export default function PostComposer({ onPosted }: { onPosted?: (post: any) => void }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'followers'>('public');
  const [tags, setTags] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const MAX_MEDIA = 8;
  const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime';

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    setFiles(prev => [...prev, ...incoming].slice(0, MAX_MEDIA));
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!content.trim() && files.length === 0) return;
    if (!user) return showToast('error', 'Please log in to post');
    const fd = new FormData();
    fd.append('content', content);
    fd.append('visibility', visibility);
    const tagArr = tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean).slice(0, 10);
    fd.append('tags', JSON.stringify(tagArr));
    files.forEach(f => fd.append('media', f));

    setSubmitting(true);
    try {
      const res = await feedApi.create(fd);
      showToast('success', 'Posted!');
      setContent('');
      setFiles([]);
      setTags('');
      onPosted?.(res.data.data);
    } catch (err) {
      showToast('error', getApiError(err, 'Post failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="content-card feed-composer feed-composer-locked">
        <p>Log in to share a post with the community.</p>
      </div>
    );
  }

  return (
    <div className="content-card feed-composer">
      <div className="feed-composer-head">
        <div className="feed-avatar sm">
          {user.avatar ? <img src={user.avatar} alt="" /> : <span>{user.fullname.slice(0, 1).toUpperCase()}</span>}
        </div>
        <textarea
          className="feed-composer-input"
          placeholder="Share something with the community..."
          value={content}
          maxLength={2000}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
      </div>

      {files.length > 0 && (
        <div className="feed-composer-previews">
          {files.map((f, i) => (
            <div key={i} className="feed-composer-preview">
              {f.type.startsWith('video/')
                ? <video src={URL.createObjectURL(f)} muted />
                : <img src={URL.createObjectURL(f)} alt="" />}
              <button onClick={() => removeFile(i)} aria-label="Remove"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="feed-composer-bar">
        <div className="feed-composer-tools">
          <button onClick={() => fileRef.current?.click()} aria-label="Add image/video"><Image size={18} /> Media</button>
          <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => handleFiles(e.target.files)} />
          <input
            className="feed-composer-tags"
            placeholder="tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <button
            className={`feed-visibility ${visibility}`}
            onClick={() => setVisibility(v => v === 'public' ? 'followers' : 'public')}
            title="Toggle visibility"
          >
            {visibility === 'public' ? <Globe size={16} /> : <Users size={16} />}
            {visibility === 'public' ? 'Public' : 'Followers'}
          </button>
        </div>
        <button className="btn-rounded btn-primary feed-post-btn" disabled={submitting || (!content.trim() && !files.length)} onClick={submit}>
          <Send size={15} /> {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}
