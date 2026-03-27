/* ============================================================
   js/supabase/client.js
============================================================ */

const SUPABASE_URL = 'SUPABASE_URL_PLACEHOLDER';
const SUPABASE_KEY = 'SUPABASE_ANON_KEY_PLACEHOLDER';

const _erKonfigurert =
  SUPABASE_URL !== 'SUPABASE_URL_PLACEHOLDER' &&
  SUPABASE_KEY !== 'SUPABASE_ANON_KEY_PLACEHOLDER';

if (!_erKonfigurert) {
  console.warn(
    '[EiendomsAnalyse] Supabase ikke koblet til.\n' +
    'Åpne js/supabase/client.js og sett inn URL + KEY fra\n' +
    'Supabase Dashboard → Settings → API.\n' +
    'Lokal data.js brukes som fallback der det er mulig.'
  );
}

const _cdnLastet = typeof supabase !== 'undefined';

export const sb = (_erKonfigurert && _cdnLastet)
  ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession:    true,
        autoRefreshToken:  true,
        detectSessionInUrl: true,
      },
    })
  : null;

export async function getSession() {
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function getCurrentUser() {
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

export async function isLoggedIn() {
  return (await getSession()) !== null;
}

export function handleError(context, error) {
  console.error(`[Supabase] ${context}:`, error?.message ?? error);
  throw error;
}

export function erKoblet() {
  return sb !== null;
}