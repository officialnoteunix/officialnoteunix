import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  adminEmail: { type: String, default: '' },
  action: {
    type: String,
    enum: [
      'note_approve', 'note_reject', 'note_delete', 'note_edit',
      'user_ban', 'user_unban', 'user_suspend', 'user_delete',
      'user_verify', 'user_unverify',
      'comment_delete',
      'report_resolve', 'report_dismiss',
      'send_email', 'ad_create', 'ad_update', 'ad_delete',
      'content_create', 'content_update', 'content_delete',
      'user_role_change',
      'post_create', 'post_delete', 'post_moderate',
    ],
    required: true,
  },
  targetType: {
    type: String,
    enum: ['note', 'user', 'comment', 'report', 'email', 'ad', 'content', 'post'],
    required: true,
  },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetTitle: { type: String, default: '' },
  details: { type: String, default: '' },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
