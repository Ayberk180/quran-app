import { supabase, isConfigured } from './supabase.js';

export async function addStudent({ first_name, last_initial, consent_collected }) {
  if (!isConfigured) throw new Error('Supabase not configured');

  const { data, error } = await supabase.functions.invoke('add-student', {
    body: { first_name, last_initial, consent_collected },
  });

  if (error) {
    let msg = error.message || 'Failed to add student';
    try {
      if (error.context && typeof error.context.clone === 'function') {
        const body = await error.context.clone().json();
        if (body?.error) msg = body.error;
      }
    } catch {}
    throw new Error(msg);
  }
  if (!data || data.error) throw new Error(data?.error || 'Failed to add student');

  return data;
}
