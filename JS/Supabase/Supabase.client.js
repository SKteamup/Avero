/* ============================================================
   js/supabase/client.js

   ╔══════════════════════════════════════════════════════╗
   ║  SETT INN NØKLER FRA SUPABASE DASHBOARD             ║
   ║  Settings → API                                      ║
   ║                                                      ║
   ║  SUPABASE_URL  = Project URL                         ║
   ║    Format: https://xxxxxxxxxxxxxxxx.supabase.co      ║
   ║                                                      ║
   ║  SUPABASE_KEY  = anon / public key                   ║
   ║    Lang JWT-streng som starter med "eyJ..."  

        ║
   ╚══════════════════════════════════════════════════════╝
============================================================ */

const SUPABASE_URL = 'https://sszjpubdciiiicdpbsyq.supabase.co';
const SUPABASE_KEY = 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzempwdWJkY2lpaWljZHBic3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzgzOTcsImV4cCI6MjA5MDIxNDM5N30.4b6cwf98BEzu4_rMyv131QYq8uEonuQzH7nbEQi6Nvo';

/* ── VALIDERING ─────────────────────────────────────────────
   Stopper tidlig med klar feilmelding hvis nøkler mangler.
─────────────────────────────────────────────────────────── */
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

/* ── KLIENT ─────────────────────────────────────────────────
   Krever Supabase CDN i HTML FØR init.js:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
─────────────────────────────────────────────────────────── */
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

/* ── HJELPEFUNKSJONER ───────────────────────────────────── */

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

/** true når URL + KEY er satt og CDN er lastet */
export function erKoblet() {
  return sb !== null;
}