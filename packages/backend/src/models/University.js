import mongoose from 'mongoose';

const universitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  logo: { type: String, default: null },
  description: { type: String, default: '' },
}, { timestamps: true });

universitySchema.index({ name: 'text' });

export default mongoose.model('University', universitySchema);
