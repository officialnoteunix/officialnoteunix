import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  cloudinaryUrl: { type: String, required: true },
  fileType: { type: String, default: 'pdf' },
  fileSize: { type: Number, default: 0 },
  approved: { type: Boolean, default: false, index: true },
  downloads: { type: Number, default: 0 },

  averageRating: { type: Number, default: 0 },
  ratingsCount: { type: Number, default: 0 },
}, { timestamps: true });

noteSchema.index({ subjectId: 1, createdAt: -1 });
noteSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Note', noteSchema);
