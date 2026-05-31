import { supabase, isConfigured } from './supabase.js';

/**
 * Fetch the lesson_progress rows for a student.
 * Returns Map<lesson_id (smallint), status (0|1)>.
 * Missing rows mean status 0 (not passed) — absence-is-default by design.
 * Failures (offline, RLS) return an empty Map so the UI degrades gracefully.
 */
export async function fetchLessonProgress(studentId) {
  if (!isConfigured || !studentId) return new Map();

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status')
    .eq('student_id', studentId);

  if (error) {
    console.warn('[progress] fetch failed', error);
    return new Map();
  }

  return new Map((data ?? []).map((row) => [row.lesson_id, row.status]));
}

/** Find the lowest-numbered lesson the student hasn't passed yet. */
export function findCurrentLesson(lessons, progressMap) {
  if (!lessons?.length) return null;
  return (
    lessons.find((l) => (progressMap?.get(l.number) ?? 0) === 0) ?? null
  );
}
