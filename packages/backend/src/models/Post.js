import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  fileType: { type: String, default: 'bin' },
  fileSize: { type: Number, default: 0 },
  publicId: { type: String, default: '' },
  kind: { type: String, enum: ['image', 'video'], default: 'image' },
}, { _id: false });

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, default: '', trim: true, maxlength: 2000 },
  media: { type: [mediaSchema], default: [] },
  visibility: { type: String, enum: ['public', 'followers'], default: 'public', index: true },
  tags: { type: [String], default: [], index: true },
  topic: { type: String, default: '', trim: true, maxlength: 40 },
  likesCount: { type: Number, default: 0, min: 0, index: true },
  commentsCount: { type: Number, default: 0, min: 0 },
  sharesCount: { type: Number, default: 0, min: 0 },
  viewsCount: { type: Number, default: 0, min: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  score: { type: Number, default: 0, index: true },
}, { timestamps: true });

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ text: 'text', tags: 'text' });

postSchema.methods.toSummary = function () {
  return {
    id: this._id,
    content: this.content,
    media: this.media,
    visibility: this.visibility,
    tags: this.tags || [],
    topic: this.topic || '',
    likesCount: this.likesCount || 0,
    commentsCount: this.commentsCount || 0,
    sharesCount: this.sharesCount || 0,
    viewsCount: this.viewsCount || 0,
    score: this.score || 0,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('Post', postSchema);
