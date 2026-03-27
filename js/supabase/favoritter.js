/* ============================================================
   js/supabase/favoritter.js
   Brukerens favoritter — legg til, fjern, sjekk og hent alle.
   ============================================================ */

import { sb, handleError } from './client.js';
import { mapObjekt }       from './objekter.js';

// ── HENT ALLE FAVORITTER ────────────────────────────────────

/**
 * Hent alle favoritt-objekter for innlogget bruker.
 * Returnerer array av mappede objekt-objekter.
 */
export async function hentFavoritter() {
  const { data, error } = await sb
    .from('favoritter')
    .select(`
      objekt_id,
      opprettet,
      objekter (
        id, tittel, adresse, by, type, strategi, eierform,
        rom, areal, prisantydning, fellesgjeld, total_pris,
        leieinntekt_estimat, yield_estimat, netto_yield, kontantstroem_estimat,
        rehab_kostnad, brutto_fortjeneste, flip_roi,
        tilstand, utleiepotensial, investor_score,
        bilder, status, premium, opprettet
      )
    `)
    .order('opprettet', { ascending: false });

  if (error) handleError('hentFavoritter', error);

  return (data ?? [])
    .filter(row => row.objekter !== null)
    .map(row => mapObjekt(row.objekter));
}

// ── HENT FAVORITT-IDer ──────────────────────────────────────

/**
 * Hent bare IDene til brukerens favoritter.
 * Nyttig for å markere hjerter i søkelisten uten å laste alle objekter.
 */
export async function hentFavorittIder() {
  const { data, error } = await sb
    .from('favoritter')
    .select('objekt_id');

  if (error) handleError('hentFavorittIder', error);
  return (data ?? []).map(r => r.objekt_id);
}

// ── LEGG TIL FAVORITT ───────────────────────────────────────

/**
 * Legg til et objekt som favoritt for innlogget bruker.
 * Ignorerer feil hvis det allerede er lagt til (upsert).
 */
export async function leggTilFavoritt(objektId) {
  const { error } = await sb
    .from('favoritter')
    .upsert({ objekt_id: objektId }, { onConflict: 'bruker_id,objekt_id' });

  if (error) handleError('leggTilFavoritt', error);
}

// ── FJERN FAVORITT ──────────────────────────────────────────

/**
 * Fjern et objekt fra brukerens favoritter.
 */
export async function fjernFavoritt(objektId) {
  const { error } = await sb
    .from('favoritter')
    .delete()
    .eq('objekt_id', objektId);

  if (error) handleError('fjernFavoritt', error);
}

// ── TOGGLE FAVORITT ─────────────────────────────────────────

/**
 * Kombifunksjon: legg til hvis ikke lagret, fjern hvis lagret.
 * Returnerer true hvis nå lagret, false hvis fjernet.
 */
export async function toggleFavoritt(objektId, erLagretNå) {
  if (erLagretNå) {
    await fjernFavoritt(objektId);
    return false;
  } else {
    await leggTilFavoritt(objektId);
    return true;
  }
}

// ── SJEKK ENKELT FAVORITT ───────────────────────────────────

/**
 * Sjekk om ett spesifikt objekt er lagret som favoritt.
 */
export async function erFavoritt(objektId) {
  const { data, error } = await sb
    .from('favoritter')
    .select('objekt_id')
    .eq('objekt_id', objektId)
    .maybeSingle();

  if (error) handleError('erFavoritt', error);
  return data !== null;
}