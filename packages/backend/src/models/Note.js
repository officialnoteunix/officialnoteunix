import mongoose from 'mongoose';

const resourceTypes = [
  'study_notes', 'past_question', 'assignment', 'lab_report',
  'practical_file', 'reference_book', 'syllabus', 'study_guide',
  'important_question', 'mcq', 'department_resource',
];

const fileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  fileType: { type: String, default: 'pdf' },
  fileSize: { type: Number, default: 0 },
  publicId: { type: String, default: '' },
}, { _id: false });

const noteSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  resourceType: { type: String, enum: resourceTypes, default: 'study_notes' },
  files: { type: [fileSchema], default: [] },
  thumbnailUrl: { type: String, default: '' },
  approved: { type: Boolean, default: false, index: true },
  rejectionReason: { type: String, default: null },
  downloads: { type: Number, default: 0 },

  averageRating: { type: Number, default: 0 },
  ratingsCount: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(doc, ret) {
      if (!ret.files || ret.files.length === 0) {
        const raw = doc._doc || {};
        if (raw.cloudinaryUrl) ret.cloudinaryUrl = raw.cloudinaryUrl;
        if (raw.fileType) ret.fileType = raw.fileType;
        if (raw.fileSize) ret.fileSize = raw.fileSize;
      }
      return ret;
    },
  },
  toObject: { virtuals: true },
});

noteSchema.virtual('cloudinaryUrl').get(function () {
  return this.files?.[0]?.url;
});
noteSchema.virtual('fileType').get(function () {
  return this.files?.[0]?.fileType || 'pdf';
});
noteSchema.virtual('fileSize').get(function () {
  return this.files?.[0]?.fileSize || 0;
});

noteSchema.index({ subjectId: 1, createdAt: -1 });
noteSchema.index({ title: 'text', description: 'text' });
noteSchema.index({ downloads: -1 });
noteSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Note', noteSchema);
