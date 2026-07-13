import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

async function verifyAdmin() {
  const { default: User } = await import('../src/models/User.js');
  await mongoose.connect(process.env.MONGO_URI);
  
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.log('No admin user found. Create one first via /api/auth/register then promote to admin in MongoDB.');
    process.exit(1);
  }
  
  if (admin.emailVerified) {
    console.log(`Admin "${admin.fullname}" (${admin.email}) is already verified.`);
  } else {
    admin.emailVerified = true;
    admin.emailVerifyToken = undefined;
    admin.emailVerifyExpiry = undefined;
    await admin.save();
    console.log(`Admin "${admin.fullname}" (${admin.email}) has been verified.`);
  }
  
  await mongoose.disconnect();
}

verifyAdmin().catch(err => { console.error(err); process.exit(1); });
