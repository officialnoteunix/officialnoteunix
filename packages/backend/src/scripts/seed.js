import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/noteunix';

// ─── Models (inline to avoid import path issues) ───
const { Schema, model } = mongoose;

const userSchema = new Schema({
  fullname: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: '' },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  avatar: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  suspendedUntil: { type: Date, default: null },
  refreshTokenHash: { type: String, default: null },
  refreshTokenPrefix: { type: String, default: null },
  resetTokenHash: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String, default: null },
  emailVerifyExpiry: { type: Date, default: null },
}, { timestamps: true });

const universitySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  logo: { type: String, default: null },
  description: { type: String, default: '' },
}, { timestamps: true });

const courseSchema = new Schema({
  universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true },
  description: { type: String, default: '' },
}, { timestamps: true });
courseSchema.index({ universityId: 1, slug: 1 }, { unique: true });

const semesterSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  semesterNumber: { type: Number },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
}, { timestamps: true });
semesterSchema.index({ courseId: 1, semesterNumber: 1 }, { unique: true });

const subjectSchema = new Schema({
  semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, default: '' },
  slug: { type: String, required: true, lowercase: true },
  description: { type: String, default: '' },
}, { timestamps: true });
subjectSchema.index({ semesterId: 1, slug: 1 }, { unique: true });

const fileSubSchema = new Schema({
  url: { type: String, required: true },
  fileType: { type: String, default: 'pdf' },
  fileSize: { type: Number, default: 0 },
  publicId: { type: String, default: '' },
}, { _id: false });

const noteSchema = new Schema({
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  resourceType: { type: String, default: 'study_notes' },
  files: { type: [fileSubSchema], default: [] },
  thumbnailUrl: { type: String, default: '' },
  approved: { type: Boolean, default: false },
  rejectionReason: { type: String, default: null },
  downloads: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  ratingsCount: { type: Number, default: 0 },
}, { timestamps: true });

const ratingSchema = new Schema({
  noteId: { type: Schema.Types.ObjectId, ref: 'Note', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: true });
ratingSchema.index({ noteId: 1, userId: 1 }, { unique: true });

const commentSchema = new Schema({
  noteId: { type: Schema.Types.ObjectId, ref: 'Note', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  parentComment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const bookmarkSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  noteId: { type: Schema.Types.ObjectId, ref: 'Note', required: true },
}, { timestamps: true });
bookmarkSchema.index({ userId: 1, noteId: 1 }, { unique: true });

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['note_approved', 'note_rejected', 'new_comment', 'report_resolved', 'welcome', 'note_uploaded', 'password_changed'], required: true },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false },
}, { timestamps: true });

const reportSchema = new Schema({
  note: { type: Schema.Types.ObjectId, ref: 'Note', required: true },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['copyright', 'inappropriate', 'spam', 'other'], required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
}, { timestamps: true });

const contactMessageSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  topic: { type: String, default: '' },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  replied: { type: Boolean, default: false },
  replyContent: { type: String, default: '' },
  repliedAt: { type: Date },
}, { timestamps: true });

const adSchema = new Schema({
  slot: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  linkUrl: { type: String, default: '' },
  description: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
  clicks: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
}, { timestamps: true });

const auditLogSchema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  adminEmail: { type: String, default: '' },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId },
  targetTitle: { type: String, default: '' },
  details: { type: String, default: '' },
}, { timestamps: true });

const User = model('User', userSchema);
const University = model('University', universitySchema);
const Course = model('Course', courseSchema);
const Semester = model('Semester', semesterSchema);
const Subject = model('Subject', subjectSchema);
const Note = model('Note', noteSchema);
const Rating = model('Rating', ratingSchema);
const Comment = model('Comment', commentSchema);
const Bookmark = model('Bookmark', bookmarkSchema);
const Notification = model('Notification', notificationSchema);
const Report = model('Report', reportSchema);
const ContactMessage = model('ContactMessage', contactMessageSchema);
const Ad = model('Ad', adSchema);
const AuditLog = model('AuditLog', auditLogSchema);

// ─── Helpers ───
const hash = (pw) => bcrypt.hash(pw, 12);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── Seed Data ───
const PLACEHOLDER_FILE = 'https://res.cloudinary.com/demo/image/upload/sample.pdf';

const universities = [
  { name: 'Tribhuvan University', slug: 'tribhuvan-university', description: 'Nepal\'s oldest and largest university, established in 1959. Located in Kirtipur, Kathmandu.' },
  { name: 'Kathmandu University', slug: 'kathmandu-university', description: 'Private university in Dhulikhel, known for engineering and management programs.' },
  { name: 'Purbanchal University', slug: 'purbanchal-university', description: 'Eastern Nepal\'s premier university headquartered in Biratnagar.' },
  { name: 'Pokhara University', slug: 'pokhara-university', description: 'University in Pokhara focused on technology, management, and health sciences.' },
];

const coursesByUni = {
  'tribhuvan-university': [
    { name: 'Bachelor of Computer Application (BCA)', slug: 'bca', description: '3-year undergraduate program in computer applications.' },
    { name: 'Bachelor of Engineering in Computer (B.E. Computer)', slug: 'be-computer', description: '4-year engineering degree in computer science.' },
    { name: 'Bachelor of Business Administration (BBA)', slug: 'bba', description: '4-year undergraduate program in business administration.' },
  ],
  'kathmandu-university': [
    { name: 'B.Tech in Computer Engineering', slug: 'btech-computer', description: '4-year technology degree in computer engineering.' },
    { name: 'BSc in Computing', slug: 'bsc-computing', description: '3-year Bachelor of Science in Computing.' },
  ],
  'purbanchal-university': [
    { name: 'BCA', slug: 'bca', description: 'Bachelor of Computer Application program.' },
    { name: 'BBS', slug: 'bbs', description: 'Bachelor of Business Studies.' },
  ],
  'pokhara-university': [
    { name: 'BSc CSIT', slug: 'bsc-csit', description: 'Bachelor of Science in Computer Science and Information Technology.' },
  ],
};

const semestersData = [
  { semesterNumber: 1, title: 'Semester 1' },
  { semesterNumber: 2, title: 'Semester 2' },
  { semesterNumber: 3, title: 'Semester 3' },
  { semesterNumber: 4, title: 'Semester 4' },
];

const subjectsByCourse = {
  'bca': [
    { name: 'Introduction to Information Technology', code: 'CS101', slug: 'cs101-intro-it', description: 'Fundamentals of computer systems, networking, and the internet.' },
    { name: 'C Programming', code: 'CS102', slug: 'cs102-c-programming', description: 'Programming fundamentals using the C language.' },
    { name: 'Digital Logic', code: 'CS201', slug: 'cs201-digital-logic', description: 'Boolean algebra, logic gates, and digital circuits.' },
    { name: 'Data Structures and Algorithms', code: 'CS202', slug: 'cs202-dsa', description: 'Arrays, linked lists, trees, graphs, sorting and searching algorithms.' },
    { name: 'Discrete Mathematics', code: 'CS203', slug: 'cs203-discrete-math', description: 'Set theory, combinatorics, graph theory, and logic.' },
    { name: 'Object Oriented Programming', code: 'CS301', slug: 'cs301-oop', description: 'OOP concepts using Java or C++.' },
    { name: 'Database Management System', code: 'CS302', slug: 'cs302-dbms', description: 'Relational databases, SQL, normalization, and transactions.' },
    { name: 'Operating System', code: 'CS401', slug: 'cs401-os', description: 'Process management, memory management, file systems.' },
    { name: 'Computer Networks', code: 'CS402', slug: 'cs402-networks', description: 'OSI model, TCP/IP, routing, and network security.' },
    { name: 'Web Technology', code: 'CS501', slug: 'cs501-web-tech', description: 'HTML, CSS, JavaScript, and modern web frameworks.' },
  ],
  'be-computer': [
    { name: 'Engineering Mathematics I', code: 'MATH101', slug: 'math101', description: 'Calculus, linear algebra, and differential equations.' },
    { name: 'Engineering Physics', code: 'PHY101', slug: 'phy101', description: 'Mechanics, thermodynamics, and wave motion.' },
    { name: 'Programming in C', code: 'CS101', slug: 'cs101-c', description: 'Structured programming using C.' },
    { name: 'Data Structures', code: 'CS201', slug: 'cs201-ds', description: 'Data structures and algorithm analysis.' },
  ],
  'bba': [
    { name: 'Principles of Management', code: 'MGT101', slug: 'mgt101', description: 'Introduction to management theories and practices.' },
    { name: 'Business Economics', code: 'ECO101', slug: 'eco101', description: 'Micro and macroeconomic principles for business.' },
    { name: 'Financial Accounting', code: 'ACC101', slug: 'acc101', description: 'Accounting fundamentals and financial statements.' },
    { name: 'Business Communication', code: 'COM101', slug: 'com101', description: 'Effective business writing and presentation skills.' },
  ],
  'btech-computer': [
    { name: 'Programming Fundamentals', code: 'CT101', slug: 'ct101', description: 'Introduction to programming with Python/Java.' },
    { name: 'Computer Architecture', code: 'CT201', slug: 'ct201', description: 'CPU design, memory hierarchy, and I/O systems.' },
    { name: 'Algorithm Design', code: 'CT301', slug: 'ct301', description: 'Advanced algorithm design and analysis.' },
  ],
  'bsc-computing': [
    { name: 'Foundations of Computing', code: 'FC101', slug: 'fc101', description: 'Introduction to computation and algorithms.' },
    { name: 'Web Development', code: 'WD101', slug: 'wd101', description: 'Full-stack web development with modern frameworks.' },
  ],
  'bsc-csit': [
    { name: 'Introduction to IT', code: 'IT101', slug: 'it101', description: 'Fundamentals of information technology.' },
    { name: 'C and Data Structures', code: 'CS101', slug: 'cs101-c-ds', description: 'C programming with data structures.' },
    { name: 'Digital Logic', code: 'CS201', slug: 'cs201-dl', description: 'Digital logic design.' },
    { name: 'Operating System', code: 'CS401', slug: 'cs401', description: 'Operating system concepts.' },
  ],
};

const sampleNotes = [
  { title: 'C Programming Complete Notes', description: 'Comprehensive notes covering all C programming concepts from basics to pointers and file handling.', resourceType: 'study_notes', downloads: rand(50, 200), rating: rand(35, 50) },
  { title: 'Data Structures and Algorithms Handbook', description: 'Detailed notes on arrays, linked lists, trees, graphs, and sorting algorithms with examples.', resourceType: 'study_notes', downloads: rand(80, 300), rating: rand(40, 50) },
  { title: 'DBMS Important Questions 2079', description: 'Collection of important DBMS questions from previous exams with model answers.', resourceType: 'past_question', downloads: rand(100, 400), rating: rand(35, 48) },
  { title: 'Digital Logic Design Lab Manual', description: 'Step-by-step lab experiments for digital logic design course.', resourceType: 'lab_report', downloads: rand(30, 120), rating: rand(25, 40) },
  { title: 'Operating System Study Guide', description: 'Concise study guide covering process management, memory management, and file systems.', resourceType: 'study_guide', downloads: rand(60, 250), rating: rand(38, 50) },
  { title: 'Computer Networks Past Questions', description: 'Past exam questions on OSI model, TCP/IP, and network security.', resourceType: 'past_question', downloads: rand(40, 180), rating: rand(30, 45) },
  { title: 'OOP with Java Notes', description: 'Object-oriented programming concepts implemented in Java with code examples.', resourceType: 'study_notes', downloads: rand(70, 280), rating: rand(40, 50) },
  { title: 'Discrete Mathematics Important Questions', description: 'Selected important questions from set theory, combinatorics, and graph theory.', resourceType: 'important_question', downloads: rand(45, 190), rating: rand(32, 46) },
  { title: 'Web Technology Project Guide', description: 'Complete guide for building a web application project with HTML, CSS, JS, and PHP.', resourceType: 'practical_file', downloads: rand(55, 220), rating: rand(35, 48) },
  { title: 'BCA Semester 1 Syllabus', description: 'Official syllabus for BCA Semester 1 at Tribhuvan University.', resourceType: 'syllabus', downloads: rand(200, 500), rating: rand(20, 35) },
  { title: 'Principles of Management Notes', description: 'Management theories, planning, organizing, staffing, and controlling.', resourceType: 'study_notes', downloads: rand(30, 150), rating: rand(28, 42) },
  { title: 'Financial Accounting Basics', description: 'Fundamentals of double-entry bookkeeping and financial statements.', resourceType: 'study_notes', downloads: rand(40, 160), rating: rand(30, 44) },
  { title: 'Business Economics MCQ Collection', description: '200+ MCQs covering micro and macroeconomics for BBA students.', resourceType: 'mcq', downloads: rand(60, 200), rating: rand(35, 47) },
  { title: 'Engineering Mathematics I Solutions', description: 'Solved problems from calculus, linear algebra, and differential equations.', resourceType: 'study_notes', downloads: rand(90, 350), rating: rand(42, 50) },
  { title: 'Python Programming Lab Files', description: 'Complete lab files for Python programming with output screenshots.', resourceType: 'lab_report', downloads: rand(35, 140), rating: rand(28, 40) },
];

const commentTexts = [
  'Great notes! Very helpful for exam preparation.',
  'Thanks for sharing this. Clear and well-organized.',
  'Could you add more examples for the algorithms section?',
  'These notes saved me so much time. Really appreciate it!',
  'The DBMS notes are exactly what I needed.',
  'Helpful content. Would love to see more past questions.',
  'Well explained. The diagrams really help.',
  'Can you upload notes for the next semester too?',
  'Best study material I\'ve found on this platform.',
  'The practice questions at the end are really useful.',
  'Excellent resource for last-minute revision.',
  'I wish I found this sooner. Great work!',
];

// ─── Main Seed ───
async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  console.log('Cleared all collections.\n');

  // ─── 1. Users ───
  console.log('Creating users...');
  const adminPw = await hash('Admin@123');
  const studentPw = await hash('Student@123');

  const admin = await User.create({
    fullname: 'Admin NoteUniX',
    email: 'admin@noteunix.com',
    passwordHash: adminPw,
    role: 'admin',
    isVerified: true,
    emailVerified: true,
  });

  const studentNames = [
    { fullname: 'Aarav Sharma', email: 'aarav@student.com' },
    { fullname: 'Sita Thapa', email: 'sita@student.com' },
    { fullname: 'Rohan Gurung', email: 'rohan@student.com' },
    { fullname: 'Anita Rai', email: 'anita@student.com' },
    { fullname: 'Bikash Magar', email: 'bikash@student.com' },
    { fullname: 'Sunita Karki', email: 'sunita@student.com' },
    { fullname: 'Deepak Limbu', email: 'deepak@student.com' },
    { fullname: 'Priya Tamang', email: 'priya@student.com' },
    { fullname: 'Rajan Shrestha', email: 'rajan@student.com' },
    { fullname: 'Nisha Adhikari', email: 'nisha@student.com' },
  ];

  const students = [];
  for (const s of studentNames) {
    const student = await User.create({
      ...s,
      passwordHash: studentPw,
      role: 'student',
      isVerified: true,
      emailVerified: true,
    });
    students.push(student);
  }
  console.log(`  Created 1 admin + ${students.length} students.`);

  // ─── 2. Universities ───
  console.log('Creating universities...');
  const createdUnis = [];
  for (const u of universities) {
    const uni = await University.create(u);
    createdUnis.push(uni);
  }
  console.log(`  Created ${createdUnis.length} universities.`);

  // ─── 3. Courses ───
  console.log('Creating courses...');
  const allCourses = [];
  for (const uni of createdUnis) {
    const courses = coursesByUni[uni.slug] || [];
    for (const c of courses) {
      const course = await Course.create({ ...c, universityId: uni._id });
      allCourses.push({ ...course.toObject(), uniSlug: uni.slug });
    }
  }
  console.log(`  Created ${allCourses.length} courses.`);

  // ─── 4. Semesters ───
  console.log('Creating semesters...');
  const allSemesters = [];
  for (const course of allCourses) {
    for (const s of semestersData) {
      const sem = await Semester.create({
        courseId: course._id,
        semesterNumber: s.semesterNumber,
        title: s.title,
        description: `Courses for ${s.title} of ${course.name}`,
      });
      allSemesters.push({ ...sem.toObject(), courseSlug: course.slug });
    }
  }
  console.log(`  Created ${allSemesters.length} semesters.`);

  // ─── 5. Subjects ───
  console.log('Creating subjects...');
  const allSubjects = [];
  for (const sem of allSemesters) {
    const subs = subjectsByCourse[sem.courseSlug] || [];
    // Assign subjects to semesters round-robin style
    const semesterIdx = (sem.semesterNumber || 1) - 1;
    const chunkSize = Math.ceil(subs.length / semestersData.length);
    const assignedSubs = subs.slice(semesterIdx * chunkSize, (semesterIdx + 1) * chunkSize);
    for (const sub of assignedSubs) {
      const subject = await Subject.create({ ...sub, semesterId: sem._id });
      allSubjects.push(subject);
    }
  }
  console.log(`  Created ${allSubjects.length} subjects.`);

  // ─── 6. Notes ───
  console.log('Creating notes...');
  const allUsers = [admin, ...students];
  const allNotes = [];
  const noteTemplates = [...sampleNotes];

  for (let i = 0; i < noteTemplates.length; i++) {
    const tmpl = noteTemplates[i];
    const subject = allSubjects[i % allSubjects.length];
    const uploader = allUsers[i % allUsers.length];
    const avgRating = (tmpl.rating / 10).toFixed(1);

    const note = await Note.create({
      subjectId: subject._id,
      userId: uploader._id,
      title: tmpl.title,
      description: tmpl.description,
      resourceType: tmpl.resourceType,
      files: [{ url: PLACEHOLDER_FILE, fileType: 'pdf', fileSize: rand(100000, 5000000), publicId: '' }],
      approved: true,
      downloads: tmpl.downloads,
      averageRating: parseFloat(avgRating),
      ratingsCount: rand(3, 15),
    });
    allNotes.push(note);
  }
  console.log(`  Created ${allNotes.length} notes.`);

  // ─── 7. Ratings ───
  console.log('Creating ratings...');
  let ratingCount = 0;
  for (const note of allNotes) {
    const numRatings = rand(2, 6);
    const shuffledUsers = [...students].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(numRatings, shuffledUsers.length); i++) {
      try {
        await Rating.create({
          noteId: note._id,
          userId: shuffledUsers[i]._id,
          value: rand(3, 5),
        });
        ratingCount++;
      } catch (e) {
        // skip duplicate ratings
      }
    }
  }
  console.log(`  Created ${ratingCount} ratings.`);

  // ─── 8. Comments ───
  console.log('Creating comments...');
  let commentCount = 0;
  for (const note of allNotes) {
    const numComments = rand(1, 3);
    const shuffledUsers = [...students].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(numComments, shuffledUsers.length); i++) {
      const comment = await Comment.create({
        noteId: note._id,
        userId: shuffledUsers[i]._id,
        content: pick(commentTexts),
      });
      commentCount++;

      // Add a reply sometimes
      if (Math.random() > 0.6 && shuffledUsers[i + 1]) {
        await Comment.create({
          noteId: note._id,
          userId: shuffledUsers[(i + 1) % shuffledUsers.length]._id,
          content: pick(commentTexts),
          parentComment: comment._id,
        });
        commentCount++;
      }
    }
  }
  console.log(`  Created ${commentCount} comments.`);

  // ─── 9. Bookmarks ───
  console.log('Creating bookmarks...');
  let bookmarkCount = 0;
  for (const student of students) {
    const numBookmarks = rand(2, 5);
    const shuffledNotes = [...allNotes].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(numBookmarks, shuffledNotes.length); i++) {
      try {
        await Bookmark.create({
          userId: student._id,
          noteId: shuffledNotes[i]._id,
        });
        bookmarkCount++;
      } catch (e) {
        // skip duplicate bookmarks
      }
    }
  }
  console.log(`  Created ${bookmarkCount} bookmarks.`);

  // ─── 10. Notifications ───
  console.log('Creating notifications...');
  let notifCount = 0;
  for (const student of students) {
    await Notification.create({
      userId: student._id,
      type: 'welcome',
      title: 'Welcome to NoteUniX!',
      message: 'Your account has been created. Start exploring study notes from universities across Nepal.',
      link: '/notes',
    });
    notifCount++;
  }

  // Note approved notifications
  for (const note of allNotes.slice(0, 5)) {
    await Notification.create({
      userId: note.userId,
      type: 'note_approved',
      title: 'Note Approved',
      message: `"${note.title}" has been approved and is now live.`,
      link: `/notes/${note._id}`,
    });
    notifCount++;
  }
  console.log(`  Created ${notifCount} notifications.`);

  // ─── 11. Reports ───
  console.log('Creating reports...');
  const reportTypes = ['copyright', 'inappropriate', 'spam', 'other'];
  const reportReasons = [
    'This content appears to be plagiarized from a textbook.',
    'The file is corrupted and cannot be opened.',
    'Wrong subject - this doesn\'t belong here.',
    'Low quality content with no useful information.',
  ];
  let reportCount = 0;
  for (let i = 0; i < 4; i++) {
    await Report.create({
      note: allNotes[i]._id,
      reportedBy: pick(students)._id,
      type: pick(reportTypes),
      reason: reportReasons[i],
      status: i < 2 ? 'resolved' : 'pending',
    });
    reportCount++;
  }
  console.log(`  Created ${reportCount} reports.`);

  // ─── 12. Contact Messages ───
  console.log('Creating contact messages...');
  const contactMsgs = [
    { name: 'Ram Bahadur', email: 'ram@gmail.com', topic: 'general', message: 'Is there a mobile app planned for NoteUniX? Would love to study on the go.' },
    { name: 'Gita Poudel', email: 'gita@gmail.com', topic: 'feedback', message: 'Great platform! The hierarchy browsing is very intuitive. Keep it up!' },
    { name: 'Hari Prasad', email: 'hari@gmail.com', topic: 'support', message: 'I uploaded a note 3 days ago but it\'s still pending. Can you check?' },
  ];
  for (const msg of contactMsgs) {
    await ContactMessage.create(msg);
  }
  console.log(`  Created ${contactMsgs.length} contact messages.`);

  // ─── 13. Ads ───
  console.log('Creating ads...');
  const now = new Date();
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await Ad.create({
    slot: 'banner-top',
    imageUrl: '',
    linkUrl: 'https://noteunix.com',
    description: 'NoteUniX - Share knowledge, help friends.',
    startDate: now,
    endDate: future,
    active: true,
  });
  console.log('  Created 1 ad.');

  // ─── 14. Audit Logs ───
  console.log('Creating audit logs...');
  for (let i = 0; i < 8; i++) {
    await AuditLog.create({
      adminId: admin._id,
      adminEmail: admin.email,
      action: pick(['note_approve', 'user_verify', 'note_delete', 'report_resolve']),
      targetType: pick(['note', 'user', 'report']),
      targetId: pick(allNotes)._id,
      targetTitle: pick(allNotes).title,
      details: pick(['Auto-seeded action', 'Reviewed and approved', 'Resolved by admin']),
    });
  }
  console.log('  Created 8 audit logs.');

  // ─── Summary ───
  console.log('\n════════════════════════════════════════');
  console.log('  SEED COMPLETE');
  console.log('════════════════════════════════════════');
  console.log(`  Admin:       admin@noteunix.com / Admin@123`);
  console.log(`  Students:    aarav@student.com, sita@student.com, etc. / Student@123`);
  console.log(`  Universities: ${createdUnis.length}`);
  console.log(`  Courses:      ${allCourses.length}`);
  console.log(`  Semesters:    ${allSemesters.length}`);
  console.log(`  Subjects:     ${allSubjects.length}`);
  console.log(`  Notes:        ${allNotes.length}`);
  console.log(`  Ratings:      ${ratingCount}`);
  console.log(`  Comments:     ${commentCount}`);
  console.log(`  Bookmarks:    ${bookmarkCount}`);
  console.log(`  Notifications: ${notifCount}`);
  console.log(`  Reports:      ${reportCount}`);
  console.log('════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
