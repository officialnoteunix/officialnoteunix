export const RESOURCE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'study_notes', label: 'Study Notes' },
  { value: 'past_question', label: 'Past Question' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'practical_file', label: 'Practical File' },
  { value: 'reference_book', label: 'Reference Book' },
  { value: 'syllabus', label: 'Syllabus' },
  { value: 'study_guide', label: 'Study Guide' },
  { value: 'important_question', label: 'Important Question' },
  { value: 'mcq', label: 'MCQ' },
  { value: 'department_resource', label: 'Department Resource' },
] as const;

export const RESOURCE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  RESOURCE_TYPES.filter(r => r.value).map(r => [r.value, r.label])
);

export function formatResourceType(type: string): string {
  return RESOURCE_TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
