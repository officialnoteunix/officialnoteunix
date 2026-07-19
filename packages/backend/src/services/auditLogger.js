import AuditLog from '../models/AuditLog.js';

export async function logAudit({ adminId, adminEmail, actor, actorEmail, action, targetType, targetId, targetTitle, details }) {
  try {
    const id = adminId || actor;
    if (!id) return;
    await AuditLog.create({ adminId: id, adminEmail: adminEmail || actorEmail, action, targetType, targetId, targetTitle, details });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

export default { logAudit };
