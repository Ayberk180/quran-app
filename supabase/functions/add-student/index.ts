// Edge Function: create a new student (auth.users + profiles row) and return
// the freshly generated PIN. Only callable by an authenticated instructor or
// admin; the student is scoped to the caller's school_id.
//
// Auth-password derivation mirrors pin-signin: HMAC-SHA256(pin, STUDENT_AUTH_SECRET).
// If you ever rotate STUDENT_AUTH_SECRET, every existing student's PIN becomes
// unusable — back it up.
//
// Required env vars:
//   SUPABASE_URL                 — auto-injected
//   SUPABASE_SERVICE_ROLE_KEY    — auto-injected
//   STUDENT_AUTH_SECRET          — set via `supabase secrets set` (Phase 2)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PINs to refuse — visually weak (all same digit) or sequential.
const PIN_BLACKLIST = new Set([
  '000000', '111111', '222222', '333333', '444444', '555555',
  '666666', '777777', '888888', '999999',
  '012345', '123456', '234567', '345678', '456789', '567890',
  '987654', '876543', '765432', '654321', '543210', '098765',
]);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const secret = Deno.env.get('STUDENT_AUTH_SECRET');
  if (!supabaseUrl || !serviceKey || !secret) {
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

  // Verify the JWT and look up the caller's profile.
  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) {
    return json(401, { error: 'Invalid session' });
  }

  const { data: caller } = await admin
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!caller || caller.role < 2) {
    return json(403, { error: 'Only instructors can add students' });
  }

  let body: { first_name?: unknown; last_initial?: unknown; consent_collected?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const firstName =
    typeof body.first_name === 'string' ? body.first_name.trim() : '';
  const lastInitial =
    typeof body.last_initial === 'string' && body.last_initial.trim()
      ? body.last_initial.trim().slice(0, 1).toUpperCase()
      : null;
  const consentCollected = body.consent_collected === true;

  if (!firstName || firstName.length > 80) {
    return json(400, { error: 'first_name required (max 80 chars)' });
  }
  if (!consentCollected) {
    return json(400, { error: 'Parental consent must be confirmed' });
  }

  // Allocate a unique non-blacklisted PIN.
  let pin: string | null = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = String(
      Math.floor(Math.random() * 1_000_000),
    ).padStart(6, '0');
    if (PIN_BLACKLIST.has(candidate)) continue;
    const { data: clash } = await admin
      .from('profiles')
      .select('id')
      .eq('student_code', candidate)
      .maybeSingle();
    if (!clash) {
      pin = candidate;
      break;
    }
  }
  if (!pin) {
    return json(500, { error: 'Could not allocate a unique PIN' });
  }

  const password = await derivePassword(pin, secret);
  const email = `${pin}@students.local`;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { kind: 'student' },
  });

  if (createErr || !created.user) {
    return json(500, {
      error: 'Failed to create auth user',
      detail: createErr?.message,
    });
  }

  const { error: profileErr } = await admin.from('profiles').insert({
    id: created.user.id,
    school_id: caller.school_id,
    role: 1,
    first_name: firstName,
    last_initial: lastInitial,
    student_code: pin,
    consent_collected_at: new Date().toISOString(),
  });

  if (profileErr) {
    // Roll back the auth user so we don't leak orphan records.
    await admin.auth.admin.deleteUser(created.user.id);
    return json(500, {
      error: 'Failed to create profile',
      detail: profileErr.message,
    });
  }

  return json(200, {
    profile_id: created.user.id,
    student_code: pin,
    first_name: firstName,
    last_initial: lastInitial,
  });
});

async function derivePassword(pin: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(pin));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
