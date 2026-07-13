import AuditLog from '../models/AuditLog.js';

export async function logAudit({ adminId, adminEmail, action, targetType, targetId, targetTitle, details }) {
  try {
    await AuditLog.create({ adminId, adminEmail, action, targetType, targetId, targetTitle, details });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

export default { logAudit };
