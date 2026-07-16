import { z } from 'zod';

const resourceTypeEnum = z.enum(['study_notes', 'past_question', 'assignment', 'lab_report',
  'practical_file', 'reference_book', 'syllabus', 'study_guide',
  'important_question', 'mcq', 'department_resource']);

export const createNoteSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().default(''),
  resourceType: resourceTypeEnum.optional().default('study_notes'),
  thumbnailUrl: z.string().optional().default(''),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  resourceType: resourceTypeEnum.optional(),
  thumbnailUrl: z.string().optional(),
});
