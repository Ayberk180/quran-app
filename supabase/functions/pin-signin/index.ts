// Edge Function: exchange a 6-digit student PIN for a Supabase session.
//
// Auth model: each student profile has a student_code (6-digit PIN). The
// corresponding auth.users row uses email = `${pin}@students.local` and
// password = HMAC-SHA256(pin, STUDENT_AUTH_SECRET). This function looks
// up the profile by student_code, then signs in with the derived password
// and returns the session to the client.
//
// Rate limit: 3 failed attempts in a row from the same IP triggers a 60s
// lockout. Lock state lives in the auth_attempts table (service-role only).
//
// Required env vars:
//   SUPABASE_URL                 — set automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY    — set automatically by Supabase
//   STUDENT_AUTH_SECRET          — set via `supabase secrets set`

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_FAILS_BEFORE_LOCK = 3;
const LOCK_DURATION_MS = 60_000;

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

  const ip = clientIp(req);
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check rate limit before doing any work.
  const lock = await checkLock(admin, ip);
  if (lock.locked) {
    return json(429, {
      error: `Too many attempts. Try again in ${lock.retryAfter}s.`,
      retry_after: lock.retryAfter,
    });
  }

  let body: { pin?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const pin = typeof body.pin === 'string' ? body.pin.trim() : '';
  if (!/^\d{6}$/.test(pin)) {
    return json(400, { error: 'PIN must be 6 digits' });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, first_name')
    .eq('student_code', pin)
    .maybeSingle();

  if (!profile || profile.role !== 1) {
    await recordFailure(admin, ip);
    return json(401, { error: 'Invalid PIN' });
  }

  const password = await derivePassword(pin, secret);
  const email = `${pin}@students.local`;

  const { data: session, error: signInErr } = await admin.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr || !session.session) {
    await recordFailure(admin, ip);
    return json(401, { error: 'Invalid PIN' });
  }

  await clearFailures(admin, ip);

  return json(200, {
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
    user_id: profile.id,
    first_name: profile.first_name,
  });
});

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

async function checkLock(
  admin: SupabaseClient,
  ip: string,
): Promise<{ locked: boolean; retryAfter?: number }> {
  if (ip === 'unknown') return { locked: false };
  const { data } = await admin
    .from('auth_attempts')
    .select('locked_until')
    .eq('ip', ip)
    .maybeSingle();
  if (!data?.locked_until) return { locked: false };
  const ms = new Date(data.locked_until).getTime() - Date.now();
  if (ms <= 0) return { locked: false };
  return { locked: true, retryAfter: Math.ceil(ms / 1000) };
}

async function recordFailure(admin: SupabaseClient, ip: string) {
  if (ip === 'unknown') return;
  const { data } = await admin
    .from('auth_attempts')
    .select('fail_count')
    .eq('ip', ip)
    .maybeSingle();
  const newCount = (data?.fail_count ?? 0) + 1;
  const shouldLock = newCount >= MAX_FAILS_BEFORE_LOCK;
  await admin.from('auth_attempts').upsert(
    {
      ip,
      // Reset the counter once we lock so the next failure (after the lockout)
      // starts fresh — the lockout itself is the deterrent.
      fail_count: shouldLock ? 0 : newCount,
      locked_until: shouldLock
        ? new Date(Date.now() + LOCK_DURATION_MS).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'ip' },
  );
}

async function clearFailures(admin: SupabaseClient, ip: string) {
  if (ip === 'unknown') return;
  await admin.from('auth_attempts').delete().eq('ip', ip);
}

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
