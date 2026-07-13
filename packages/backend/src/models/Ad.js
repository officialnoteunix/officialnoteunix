import mongoose from 'mongoose';

const adSchema = new mongoose.Schema({
  slot: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  linkUrl: { type: String, default: '' },
  description: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
  clicks: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
}, { timestamps: true });

adSchema.index({ slot: 1, active: 1, startDate: 1, endDate: 1 });

export default mongoose.model('Ad', adSchema);
