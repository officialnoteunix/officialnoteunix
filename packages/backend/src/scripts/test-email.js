import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { sendCustomEmail, isEmailEnabled } from '../config/email.js';

const TEST_EMAIL = 'diwashkrki@gmail.com';

async function testBrevo() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║       NoteUniX Email Test (Brevo)        ║');
  console.log('╚══════════════════════════════════════════╝\n');

  console.log(`  Email enabled: ${isEmailEnabled()}`);
  console.log(`  API Key: ${process.env.BREVO_API_KEY ? 'SET (****' + process.env.BREVO_API_KEY.slice(-4) + ')' : 'NOT SET'}`);
  console.log(`  Sender: ${process.env.BREVO_SENDER_EMAIL || 'default'}`);

  if (!isEmailEnabled()) {
    console.error('\n  ✗ BREVO_API_KEY not set in .env\n');
    process.exit(1);
  }

  console.log(`\n  Sending test email to: ${TEST_EMAIL}`);
  console.log('  ────────────────────────────────────────\n');

  const result = await sendCustomEmail({
    to: TEST_EMAIL,
    subject: 'NoteUniX Email Test — Brevo Integration',
    html: `
      <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.7;">This is a test email from NoteUniX via Brevo REST API.</p>
      <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.7;">If you received this, the Brevo email integration is working correctly.</p>
      <p style="margin:0 0 8px;color:#999;font-size:12px;line-height:1.6;">Sent at: ${new Date().toISOString()}</p>
    `,
  });

  if (result.success) {
    console.log(`  ✓ Email sent successfully!`);
    console.log(`    Message ID: ${result.messageId}`);
  } else {
    console.error(`  ✗ Email failed!`);
    console.error(`    Reason: ${result.reason}`);
    if (result.statusCode) console.error(`    Status: ${result.statusCode}`);
    if (result.retryHours) console.error(`    Retry in: ${result.retryHours}h`);
  }

  console.log('');
  process.exit(result.success ? 0 : 1);
}

testBrevo().catch(err => {
  console.error('\n  ✗ Unexpected error:', err.message);
  process.exit(1);
});
