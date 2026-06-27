import { supabase, isConfigured } from './supabase.js';

/** Fetch the roster (one row per student) from the instructor_roster view. */
export async function fetchRoster() {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('instructor_roster')
    .select('*')
    .order('first_name');
  if (error) {
    console.warn('[instructor] roster fetch failed', error);
    return [];
  }
  return data ?? [];
}

/** Fetch a single student profile. RLS ensures same-school visibility only. */
export async function fetchStudent(studentId) {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, last_initial, student_code, school_id, created_at')
    .eq('id', studentId)
    .eq('role', 1)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/** Returns Map<lesson_id, { status, updated_at, updated_by }> for one student. */
export async function fetchStudentLessonProgress(studentId) {
  if (!isConfigured) return new Map();
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status, updated_at, updated_by')
    .eq('student_id', studentId);
  if (error) {
    console.warn('[instructor] lesson_progress fetch failed', error);
    return new Map();
  }
  return new Map((data ?? []).map((row) => [row.lesson_id, row]));
}

/** Update a student's first and last name. */
export async function updateStudentName(studentId, { first_name, last_name }) {
  if (!isConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('profiles')
    .update({ first_name, last_name: last_name || null })
    .eq('id', studentId);
  if (error) throw error;
}

/** Upsert a lesson's passed/not-passed state for a student. */
export async function setLessonStatus(studentId, lessonId, status, instructorId) {
  if (!isConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        student_id: studentId,
        lesson_id: lessonId,
        status,
        updated_by: instructorId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,lesson_id' },
    );
  if (error) throw error;
}

/** Login events for a student since the given ISO timestamp. */
export async function fetchLoginEvents(studentId, sinceIso) {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('login_events')
    .select('signed_in_at')
    .eq('user_id', studentId)
    .gte('signed_in_at', sinceIso)
    .order('signed_in_at');
  if (error) {
    console.warn('[instructor] login_events fetch failed', error);
    return [];
  }
  return data ?? [];
}
