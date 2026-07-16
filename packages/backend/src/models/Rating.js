import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: true });

ratingSchema.index({ noteId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Rating', ratingSchema);
