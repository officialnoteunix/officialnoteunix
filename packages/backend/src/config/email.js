import nodemailer from 'nodemailer';

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS?.replace(/\s+/g, ''),
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
  });
}

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = createTransporter();
  if (!_transporter) {
    console.warn('[EMAIL] SMTP not configured — emails disabled');
  }
  return _transporter;
}

export function isEmailEnabled() {
  return !!createTransporter();
}

export async function verifySmtp() {
  const t = createTransporter();
  if (!t) {
    console.warn('[EMAIL] SMTP not configured — emails disabled');
    return false;
  }
  try {
    await t.verify();
    console.log('[EMAIL] SMTP connection verified');
    return true;
  } catch (err) {
    console.error('[EMAIL] SMTP verification failed:', err.message);
    if (err.response) console.error('[EMAIL] Server response:', err.response);
    return false;
  }
}

async function sendMail(options) {
  const t = getTransporter();
  if (!t) {
    console.warn(`[EMAIL] Skipped "${options.subject}" — SMTP not configured`);
    return;
  }
  await t.sendMail(options);
}

const SITE_URL = process.env.CORS_ORIGIN || 'http://localhost:5173';
const SITE_NAME = 'NoteUniX';

function wrapTemplate(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
        <tr><td style="padding-bottom:32px;text-align:center;">
          <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">${SITE_NAME}</span>
        </td></tr>
        <tr><td style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:36px 40px 32px;">
              <h2 style="margin:0 0 20px;color:#0f172a;font-size:19px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;letter-spacing:-0.3px;">${title}</h2>
              ${bodyHtml}
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:28px 0 0;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
            &copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(email, verifyUrl, fullname) {
  await sendMail({
    from: process.env.SMTP_FROM || `NoteUniX <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Verify your email — ${SITE_NAME}`,
    html: wrapTemplate('Verify Your Email', `
      <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.7;">Hi ${fullname},</p>
      <p style="margin:0 0 20px;color:#334155;font-size:14px;line-height:1.7;">Thanks for creating your ${SITE_NAME} account. Please confirm your email address to get started.</p>
      <a href="${verifyUrl}" style="display:inline-block;background-color:#6366f1;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;margin-bottom:20px;">Verify Email Address</a>
      <p style="margin:12px 0 0;color:#64748b;font-size:13px;line-height:1.6;">This link expires in 1 hour. If you didn't create an account, you can safely ignore this email.</p>
    `),
  });
}

export async function sendWelcomeEmail(email, fullname) {
  await sendMail({
    from: process.env.SMTP_FROM || `NoteUniX <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Welcome to ${SITE_NAME}!`,
    html: wrapTemplate('Welcome Aboard!', `
      <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.7;">Hi ${fullname},</p>
      <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.7;">Your account is all set. You can now browse, upload, and share study notes with your university community.</p>
      <a href="${SITE_URL}" style="display:inline-block;background-color:#6366f1;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;margin-bottom:20px;">Go to ${SITE_NAME}</a>
      <p style="margin:12px 0 0;color:#64748b;font-size:13px;line-height:1.6;">If you have any questions, just reply to this email — we're happy to help.</p>
    `),
  });
}

export async function sendResetEmail(email, resetUrl) {
  await sendMail({
    from: process.env.SMTP_FROM || `NoteUniX <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Reset your password — ${SITE_NAME}`,
    html: wrapTemplate('Password Reset', `
      <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.7;">We received a request to reset the password for your ${SITE_NAME} account.</p>
      <a href="${resetUrl}" style="display:inline-block;background-color:#6366f1;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;margin-bottom:20px;">Reset Password</a>
      <p style="margin:12px 0 0;color:#64748b;font-size:13px;line-height:1.6;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
    `),
  });
}

export async function sendPasswordChangedEmail(email) {
  await sendMail({
    from: process.env.SMTP_FROM || `NoteUniX <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Password changed — ${SITE_NAME}`,
    html: wrapTemplate('Password Updated', `
      <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.7;">Your ${SITE_NAME} password was successfully changed.</p>
      <p style="margin:0 0;color:#64748b;font-size:13px;line-height:1.6;">If you didn't make this change, please contact our support team immediately.</p>
    `),
  });
}

export async function sendNoteApprovedEmail(email, noteTitle, noteUrl) {
  await sendMail({
    from: process.env.SMTP_FROM || `NoteUniX <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Your note is live — ${SITE_NAME}`,
    html: wrapTemplate('Note Approved', `
      <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.7;">Great news! Your note <strong>"${noteTitle}"</strong> has been approved and is now visible to everyone.</p>
      <a href="${noteUrl}" style="display:inline-block;background-color:#6366f1;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;margin-bottom:20px;">View Your Note</a>
    `),
  });
}

export async function sendContactReplyEmail(toEmail, toName, subject, replyBody) {
  await sendMail({
    from: process.env.SMTP_FROM || `NoteUniX <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Re: ${subject} — ${SITE_NAME}`,
    html: wrapTemplate('Reply from NoteUniX', `
      <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.7;">Hi ${toName},</p>
      <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.7;">Thank you for reaching out. Here is our response:</p>
      <div style="background-color:#f8fafc;border-left:3px solid #6366f1;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:20px;">
        <p style="margin:0;color:#334155;font-size:14px;line-height:1.7;white-space:pre-wrap;">${replyBody}</p>
      </div>
      <p style="margin:0 0;color:#64748b;font-size:13px;line-height:1.6;">If you have further questions, feel free to reach out again.</p>
    `),
  });
}

export async function sendCustomEmail({ to, subject, html, from }) {
  await sendMail({
    from: from || process.env.SMTP_FROM || `NoteUniX <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: wrapTemplate(subject, `
      <div style="font-size:14px;line-height:1.7;color:#334155;">${html}</div>
    `),
  });
}
