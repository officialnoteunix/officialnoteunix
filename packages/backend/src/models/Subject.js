import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, default: '' },
  slug: { type: String, required: true, lowercase: true },
  description: { type: String, default: '' },
}, { timestamps: true });

subjectSchema.index({ semesterId: 1, slug: 1 }, { unique: true });
subjectSchema.index({ name: 'text' });

export default mongoose.model('Subject', subjectSchema);
