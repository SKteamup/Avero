/* ============================================================
   js/supabase/auth.js
   Registrering, innlogging, utlogging og profilhåndtering.
   ============================================================ */

import { sb, handleError } from './client.js';

// ── REGISTRERING ────────────────────────────────────────────

/**
 * Registrer ny bruker med e-post og passord.
 * Returnerer { user, session } eller kaster feil.
 */
export async function registrer({ navn, epost, passord }) {
  const { data, error } = await sb.auth.signUp({
    email:    epost,
    password: passord,
    options: {
      data: { navn }, // lagres i raw_user_meta_data, plukkes opp av trigger
    },
  });

  if (error) handleError('registrer', error);
  return data;
}

// ── INNLOGGING ──────────────────────────────────────────────

/**
 * Logg inn med e-post og passord.
 * Returnerer { user, session } eller kaster feil.
 */
export async function loggInn({ epost, passord }) {
  const { data, error } = await sb.auth.signInWithPassword({
    email:    epost,
    password: passord,
  });

  if (error) handleError('loggInn', error);
  return data;
}

// ── UTLOGGING ───────────────────────────────────────────────

/**
 * Logg ut gjeldende bruker.
 */
export async function loggUt() {
  const { error } = await sb.auth.signOut();
  if (error) handleError('loggUt', error);
}

// ── GLEMT PASSORD ───────────────────────────────────────────

/**
 * Send tilbakestillingslenke til e-post.
 * redirectTo: siden brukeren lander på etter klikk i e-post.
 */
export async function sendTilbakestilling(epost) {
  const { error } = await sb.auth.resetPasswordForEmail(epost, {
    redirectTo: `${window.location.origin}/nytt-passord.html`,
  });
  if (error) handleError('sendTilbakestilling', error);
}

/**
 * Sett nytt passord (kalt fra nytt-passord.html etter redirect).
 */
export async function settNyttPassord(nyttPassord) {
  const { error } = await sb.auth.updateUser({ password: nyttPassord });
  if (error) handleError('settNyttPassord', error);
}

// ── PROFIL ──────────────────────────────────────────────────

/**
 * Hent profil for gjeldende bruker.
 * Returnerer { id, navn, epost, plan, aktiv } eller null.
 */
export async function hentProfil() {
  const { data, error } = await sb
    .from('profiles')
    .select('id, navn, epost, plan, aktiv, opprettet')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // ingen treff
    handleError('hentProfil', error);
  }
  return data;
}

/**
 * Oppdater navn eller plan for gjeldende bruker.
 */
export async function oppdaterProfil(felt) {
  const { data, error } = await sb
    .from('profiles')
    .update(felt)
    .eq('id', (await sb.auth.getUser()).data.user?.id)
    .select()
    .single();

  if (error) handleError('oppdaterProfil', error);
  return data;
}

// ── AUTH STATE LISTENER ─────────────────────────────────────

/**
 * Abonner på auth-endringer (innlogging, utlogging, token-refresh).
 * callback(event, session) kalles ved endringer.
 *
 * Bruk:
 *   const { data: { subscription } } = lytt((event, session) => { ... });
 *   // Avslutt lytter: subscription.unsubscribe();
 */
export function lytt(callback) {
  return sb.auth.onAuthStateChange(callback);
}

// ── ADMIN-SJEKK ─────────────────────────────────────────────

/**
 * Returnerer true hvis gjeldende bruker er admin.
 * Kaller is_admin() DB-funksjonen via RPC.
 */
export async function erAdmin() {
  const { data, error } = await sb.rpc('is_admin');
  if (error) return false;
  return data === true;
}