// Edge Function: delete a student (auth.users + cascaded profile rows).
// Only callable by admins (role 3) in the same school as the target student.
// Deleting the auth user cascades to profiles, lesson_progress, and login_events.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json(500, { error: 'Server not configured' });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json(401, { error: 'Missing authorization' });
  }
  const token = authHeader.slice('Bearer '.length);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) {
    return json(401, { error: 'Invalid session' });
  }

  const { data: caller } = await admin
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!caller || caller.role !== 3) {
    return json(403, { error: 'Only admins can delete students' });
  }

  let body: { student_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const studentId = typeof body.student_id === 'string' ? body.student_id.trim() : '';
  if (!studentId) {
    return json(400, { error: 'student_id required' });
  }

  // Verify target is a student in the same school.
  const { data: target } = await admin
    .from('profiles')
    .select('role, school_id')
    .eq('id', studentId)
    .maybeSingle();

  if (!target) {
    return json(404, { error: 'Student not found' });
  }
  if (target.role !== 1) {
    return json(400, { error: 'Target is not a student' });
  }
  if (target.school_id !== caller.school_id) {
    return json(403, { error: 'Student is not in your school' });
  }

  const { error: deleteErr } = await admin.auth.admin.deleteUser(studentId);
  if (deleteErr) {
    return json(500, { error: 'Failed to delete student', detail: deleteErr.message });
  }

  return json(200, { deleted: studentId });
});

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
