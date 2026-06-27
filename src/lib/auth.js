import { supabase, isConfigured } from './supabase.js';

/**
 * Sign in a student using their 6-digit PIN.
 * Calls the pin-signin Edge Function which exchanges PIN → session.
 */
export async function signInWithPin(pin) {
  if (!isConfigured) throw new Error('Supabase not configured');

  const normalized = String(pin).trim();
  if (!/^\d{6}$/.test(normalized)) {
    throw new Error('PIN must be 6 digits');
  }

  const { data, error } = await supabase.functions.invoke('pin-signin', {
    body: { pin: normalized },
  });

  if (error) throw new Error(await extractFnError(error, 'Sign-in failed'));
  if (!data || data.error) throw new Error(data?.error || 'Sign-in failed');

  const { error: setErr } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (setErr) throw new Error('Failed to establish session');

  recordLogin(data.user_id);

  return { id: data.user_id, first_name: data.first_name, role: 1 };
}

/** Instructor / admin sign-in with email + password. */
export async function signInWithEmail(email, password) {
  if (!isConfigured) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const profile = await fetchProfile(data.user.id);
  if (!profile) throw new Error('Profile not found — contact your administrator');
  if (profile.role === 1) throw new Error('Use the PIN sign-in for student accounts');

  recordLogin(data.user.id);
  return profile;
}

export async function signOut() {
  if (!isConfigured) return;
  await supabase.auth.signOut();
}

export async function getSession() {
  if (!isConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  return fetchProfile(session.user.id);
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, first_name, last_name, last_initial, school_id')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

/**
 * Pull a useful message out of an Edge Function error. The response body
 * (e.g. `{ "error": "Too many attempts..." }`) lives on error.context, which
 * is a Response object.
 */
async function extractFnError(error, fallback) {
  try {
    if (error?.context && typeof error.context.clone === 'function') {
      const body = await error.context.clone().json();
      if (body?.error) return body.error;
    }
  } catch {
    /* swallow — fall through to message */
  }
  return error?.message || fallback;
}

/** Fire-and-forget: record a login event. Errors are swallowed. */
function recordLogin(userId) {
  if (!isConfigured) return;
  supabase.from('login_events').insert({ user_id: userId }).then(({ error }) => {
    if (error) console.warn('[auth] login_events insert failed', error);
  });
}

/** Subscribe to auth state changes. Returns an unsubscribe fn. */
export function onAuthChange(handler) {
  if (!isConfigured) return () => {};
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) return handler(null);
    fetchProfile(session.user.id).then(handler);
  });
  return () => subscription.unsubscribe();
}
