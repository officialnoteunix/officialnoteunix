import Note from '../models/Note.js';
import Comment from '../models/Comment.js';
import Bookmark from '../models/Bookmark.js';
import Rating from '../models/Rating.js';
import Report from '../models/Report.js';
import { deleteNoteFiles } from './uploadCloudinary.js';

async function deleteNotesAndCleanup(noteQuery) {
  const notes = await Note.find(noteQuery).select('files thumbnailUrl');
  if (!notes.length) return 0;
  await Promise.all([
    ...notes.map(n => deleteNoteFiles(n)),
    Comment.deleteMany({ noteId: { $in: notes.map(n => n._id) } }),
    Bookmark.deleteMany({ noteId: { $in: notes.map(n => n._id) } }),
    Rating.deleteMany({ noteId: { $in: notes.map(n => n._id) } }),
    Report.deleteMany({ note: { $in: notes.map(n => n._id) } }),
  ]);
  return Note.deleteMany({ _id: { $in: notes.map(n => n._id) } });
}

export async function cascadeDeleteSubject(SubjectModel, subjectId) {
  const notesResult = await deleteNotesAndCleanup({ subjectId });
  await SubjectModel.findByIdAndDelete(subjectId);
  return { notesDeleted: notesResult.deletedCount };
}

export async function cascadeDeleteSemester(SemesterModel, SubjectModel, semesterId) {
  const subjects = await SubjectModel.find({ semesterId }).select('_id');
  let totalNotes = 0;
  for (const sub of subjects) {
    const r = await deleteNotesAndCleanup({ subjectId: sub._id });
    totalNotes += r.deletedCount;
  }
  await SubjectModel.deleteMany({ semesterId });
  await SemesterModel.findByIdAndDelete(semesterId);
  return { subjectsDeleted: subjects.length, notesDeleted: totalNotes };
}

export async function cascadeDeleteCourse(CourseModel, SemesterModel, SubjectModel, courseId) {
  const semesters = await SemesterModel.find({ courseId }).select('_id');
  const semesterIds = semesters.map(s => s._id);
  const subjects = await SubjectModel.find({ semesterId: { $in: semesterIds } }).select('_id');
  const subjectIds = subjects.map(s => s._id);
  let totalNotes = 0;
  if (subjectIds.length) {
    const r = await deleteNotesAndCleanup({ subjectId: { $in: subjectIds } });
    totalNotes = r.deletedCount;
  }
  await SubjectModel.deleteMany({ semesterId: { $in: semesterIds } });
  await SemesterModel.deleteMany({ courseId });
  await CourseModel.findByIdAndDelete(courseId);
  return { semestersDeleted: semesters.length, subjectsDeleted: subjects.length, notesDeleted: totalNotes };
}

export async function cascadeDeleteUniversity(UniversityModel, CourseModel, SemesterModel, SubjectModel, universityId) {
  const courses = await CourseModel.find({ universityId }).select('_id');
  const courseIds = courses.map(c => c._id);
  const semesters = await SemesterModel.find({ courseId: { $in: courseIds } }).select('_id');
  const semesterIds = semesters.map(s => s._id);
  const subjects = await SubjectModel.find({ semesterId: { $in: semesterIds } }).select('_id');
  const subjectIds = subjects.map(s => s._id);
  let totalNotes = 0;
  if (subjectIds.length) {
    const r = await deleteNotesAndCleanup({ subjectId: { $in: subjectIds } });
    totalNotes = r.deletedCount;
  }
  await SubjectModel.deleteMany({ semesterId: { $in: semesterIds } });
  await SemesterModel.deleteMany({ courseId: { $in: courseIds } });
  await CourseModel.deleteMany({ universityId });
  await UniversityModel.findByIdAndDelete(universityId);
  return { coursesDeleted: courses.length, semestersDeleted: semesters.length, subjectsDeleted: subjects.length, notesDeleted: totalNotes };
}
