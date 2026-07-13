import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  semesterNumber: { type: Number },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
}, { timestamps: true });

semesterSchema.index({ courseId: 1, semesterNumber: 1 }, { unique: true });

export default mongoose.model('Semester', semesterSchema);
