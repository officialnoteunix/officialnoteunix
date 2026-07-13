import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true },
  description: { type: String, default: '' },
}, { timestamps: true });

courseSchema.index({ universityId: 1, slug: 1 }, { unique: true });
courseSchema.index({ name: 'text' });

export default mongoose.model('Course', courseSchema);
