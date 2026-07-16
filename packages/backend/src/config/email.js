const SITE_URL = process.env.CORS_ORIGIN || 'http://localhost:5173';
const SITE_NAME = 'NoteUniX';
const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

// ── Provider detection ──────────────────────────────────────────────
export function isEmailEnabled() {
  return !!process.env.BREVO_API_KEY;
}

// ── Retry info (rate limit resets midnight Pacific) ─────────────────
export function getEmailRetryInfo() {
  const now = new Date();
  const pacificStr = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  const pacificDate = new Date(pacificStr);
  const midnightPacific = new Date(pacificDate);
  midnightPacific.setHours(24, 0, 0, 0);
  const diffMs = midnightPacific.getTime() - now.getTime();
  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  return { hours: Math.max(1, hours), resetsAt: midnightPacific.toISOString() };
}

// ── Startup verification ────────────────────────────────────────────
export async function verifySmtp() {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[EMAIL] BREVO_API_KEY not set — emails disabled');
    return false;
  }
  console.log('[EMAIL] Brevo API key configured');
  return true;
}

// ── Brevo REST API send ─────────────────────────────────────────────
function getSenderEmail() {
  return process.env.BREVO_SENDER_EMAIL || 'officialnoteunix@gmail.com';
}

function getSenderName() {
  return process.env.BREVO_SENDER_NAME || SITE_NAME;
}

async function sendMail({ to, subject, html }) {
  if (!process.env.BREVO_API_KEY) {
    console.warn(`[EMAIL] Skipped "${subject}" — BREVO_API_KEY not set`);
    return { success: false, reason: 'not_configured' };
  }

  try {
    const response = await fetch(BREVO_API, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: getSenderEmail(), name: getSenderName() },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[EMAIL] Sent "${subject}" to ${to} — ${data.messageId}`);
      return { success: true, messageId: data.messageId };
    }

    const statusCode = response.status;
    const errorMessage = data.message || `HTTP ${statusCode}`;
    console.error(`[EMAIL] Failed "${subject}" to ${to}: [${statusCode}] ${errorMessage}`);

    if (statusCode === 429 || statusCode === 401) {
      const retry = getEmailRetryInfo();
      return { success: false, reason: `[${statusCode}] ${errorMessage}`, retryHours: retry.hours, statusCode };
    }
    return { success: false, reason: `[${statusCode}] ${errorMessage}`, statusCode };
  } catch (err) {
    console.error(`[EMAIL] Network error sending "${subject}" to ${to}:`, err.message);
    return { success: false, reason: err.message };
  }
}

// ── Email templates ─────────────────────────────────────────────────
function wrapTemplate(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:22px;font-weight:800;color:#1a1a2e;letter-spacing:-0.5px;">${SITE_NAME}</span>
        </td></tr>
        <tr><td style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:40px 48px 36px;">
              <h1 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${title}</h1>
              ${bodyHtml}
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 0 0;text-align:center;">
          <p style="margin:0 0 4px;color:#999;font-size:12px;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            ${SITE_NAME} &mdash; Share knowledge, empower learning.
          </p>
          <p style="margin:0;color:#bbb;font-size:11px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
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
  return await sendMail({
    to: email,
    subject: `Verify your email address — ${SITE_NAME}`,
    html: wrapTemplate('Verify your email address', `
      <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.7;">Hi ${fullname},</p>
      <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.7;">Thanks for signing up for ${SITE_NAME}. Please confirm your email address by clicking the button below.</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background-color:#6366f1;border-radius:6px;">
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Verify Email Address</a>
        </td></tr>
      </table>
      <p style="margin:0 0 8px;color:#999;font-size:12px;line-height:1.6;">This link expires in 1 hour. If you didn't create an account, you can safely ignore this email.</p>
    `),
  });
}

export async function sendWelcomeEmail(email, fullname) {
  return await sendMail({
    to: email,
    subject: `Welcome to ${SITE_NAME}!`,
    html: wrapTemplate('Welcome to NoteUniX!', `
      <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.7;">Hi ${fullname},</p>
      <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.7;">Your account is verified and ready to go. Here's how to get the most out of ${SITE_NAME}:</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr><td style="padding:12px 16px;background-color:#f8f9fa;border-radius:6px;margin-bottom:8px;">
          <strong style="color:#1a1a2e;font-size:13px;">1. Browse Notes</strong>
          <p style="margin:4px 0 0;color:#666;font-size:13px;line-height:1.5;">Explore study notes shared by students from universities worldwide. Use filters to find exactly what you need.</p>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr><td style="padding:12px 16px;background-color:#f8f9fa;border-radius:6px;">
          <strong style="color:#1a1a2e;font-size:13px;">2. Upload & Share</strong>
          <p style="margin:4px 0 0;color:#666;font-size:13px;line-height:1.5;">Upload your own notes (PDF, DOC, PPT, images) to help other students. Earn reputation points with every contribution.</p>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr><td style="padding:12px 16px;background-color:#f8f9fa;border-radius:6px;">
          <strong style="color:#1a1a2e;font-size:13px;">3. Rate & Comment</strong>
          <p style="margin:4px 0 0;color:#666;font-size:13px;line-height:1.5;">Help the community by rating notes and leaving feedback. The best content rises to the top.</p>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr><td style="padding:12px 16px;background-color:#f8f9fa;border-radius:6px;">
          <strong style="color:#1a1a2e;font-size:13px;">4. Climb the Leaderboard</strong>
          <p style="margin:4px 0 0;color:#666;font-size:13px;line-height:1.5;">Earn points for uploading, rating, and engaging. Top contributors get recognized on the public leaderboard.</p>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="padding:12px 16px;background-color:#f8f9fa;border-radius:6px;">
          <strong style="color:#1a1a2e;font-size:13px;">5. Bookmark & Organize</strong>
          <p style="margin:4px 0 0;color:#666;font-size:13px;line-height:1.5;">Save your favorite notes with bookmarks so you can quickly access them later.</p>
        </td></tr>
      </table>

      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background-color:#6366f1;border-radius:6px;">
          <a href="${SITE_URL}/notes" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Start Exploring</a>
        </td></tr>
      </table>

      <p style="margin:0 0 8px;color:#999;font-size:12px;line-height:1.6;">If you have any questions, visit our <a href="${SITE_URL}/support" style="color:#6366f1;text-decoration:none;">Help & FAQ page</a> or reply to this email.</p>
    `),
  });
}

export async function sendResetEmail(email, resetUrl) {
  return await sendMail({
    to: email,
    subject: `Reset your password — ${SITE_NAME}`,
    html: wrapTemplate('Reset your password', `
      <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.7;">We received a request to reset the password on your ${SITE_NAME} account.</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background-color:#6366f1;border-radius:6px;">
          <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Reset Password</a>
        </td></tr>
      </table>
      <p style="margin:0 0 8px;color:#999;font-size:12px;line-height:1.6;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
    `),
  });
}

export async function sendPasswordChangedEmail(email) {
  return await sendMail({
    to: email,
    subject: `Password changed — ${SITE_NAME}`,
    html: wrapTemplate('Password updated', `
      <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.7;">Your ${SITE_NAME} password was successfully changed.</p>
      <p style="margin:0 0 8px;color:#999;font-size:12px;line-height:1.6;">If you didn't make this change, please contact our support team immediately.</p>
    `),
  });
}

export async function sendCustomEmail({ to, subject, html, from }) {
  return await sendMail({
    to,
    subject,
    html: wrapTemplate(subject, `
      <div style="font-size:14px;line-height:1.7;color:#555;">${html}</div>
    `),
  });
}
