import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['copyright', 'inappropriate', 'spam', 'other'], required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending', index: true },
}, { timestamps: true });

reportSchema.index({ note: 1 });
reportSchema.index({ reportedBy: 1, createdAt: -1 });

export default mongoose.model('Report', reportSchema);
