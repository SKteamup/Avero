/* ============================================================
   js/supabase/lagrede-sok.js
   Lagrede søk og notater per objekt.
   ============================================================ */

import { sb, handleError } from './client.js';

// ══════════════════════════════════════════════════════════════
//  LAGREDE SØK
// ══════════════════════════════════════════════════════════════

// ── HENT ALLE ───────────────────────────────────────────────

/**
 * Hent alle lagrede søk for innlogget bruker.
 */
export async function hentLagredeSok() {
  const { data, error } = await sb
    .from('lagrede_sok')
    .select('id, navn, filter, filter_tekst, varsel_epost, varsel_sms, siste_treff, aktiv, opprettet')
    .order('opprettet', { ascending: false });

  if (error) handleError('hentLagredeSok', error);
  return data ?? [];
}

// ── LAGRE SØKET ─────────────────────────────────────────────

/**
 * Lagre et nytt søk.
 * RLS kontrollerer plan-grenser (gratis=1, pro=10, investor=∞).
 *
 * @param {string} navn - brukerdefinert navn
 * @param {object} filter - F-objektet fra sok.js
 * @param {string} filterTekst - lesbar oppsummering av filteret
 */
export async function lagreSok({ navn, filter, filterTekst }) {
  const { data, error } = await sb
    .from('lagrede_sok')
    .insert({
      navn,
      filter,
      filter_tekst: filterTekst,
    })
    .select()
    .single();

  if (error) {
    // RLS-feil betyr at plangen er overskredet
    if (error.code === '42501') {
      throw new Error('Du har nådd grensen for lagrede søk på din plan. Oppgrader til Pro for flere.');
    }
    handleError('lagreSok', error);
  }
  return data;
}

// ── OPPDATER SØK ────────────────────────────────────────────

/**
 * Oppdater navn, filter eller varsel-innstillinger.
 */
export async function oppdaterSok(id, felt) {
  const { data, error } = await sb
    .from('lagrede_sok')
    .update(felt)
    .eq('id', id)
    .select()
    .single();

  if (error) handleError('oppdaterSok', error);
  return data;
}

// ── SLETT SØK ───────────────────────────────────────────────

/**
 * Slett et lagret søk.
 */
export async function slettSok(id) {
  const { error } = await sb
    .from('lagrede_sok')
    .delete()
    .eq('id', id);

  if (error) handleError('slettSok', error);
}

// ── TOGGLE AKTIV ────────────────────────────────────────────

/**
 * Slå av/på et søk (stopper varsler uten å slette).
 */
export async function toggleSokAktiv(id, erAktiv) {
  return oppdaterSok(id, { aktiv: erAktiv });
}

// ── MAPPING ─────────────────────────────────────────────────

/**
 * Mapper DB-rad til formatet min-side.js forventer.
 */
export function mapLagretSok(row) {
  return {
    id:          row.id,
    navn:        row.navn,
    filter:      row.filter,
    filterTekst: row.filter_tekst,
    varselEpost: row.varsel_epost,
    varselSMS:   row.varsel_sms,
    antallTreff: row.siste_treff,
    aktiv:       row.aktiv,
    dato:        row.opprettet,
  };
}


// ══════════════════════════════════════════════════════════════
//  NOTATER
// ══════════════════════════════════════════════════════════════

// ── HENT NOTAT ──────────────────────────────────────────────

/**
 * Hent brukerens notat for ett bestemt objekt.
 * Returnerer innholdet som streng, eller '' hvis ingen notat.
 */
export async function hentNotat(objektId) {
  const { data, error } = await sb
    .from('notater')
    .select('innhold')
    .eq('objekt_id', objektId)
    .maybeSingle();

  if (error) handleError('hentNotat', error);
  return data?.innhold ?? '';
}

// ── LAGRE NOTAT ─────────────────────────────────────────────

/**
 * Lagre eller oppdater notat for ett objekt (upsert).
 * Sletter notatet hvis innhold er tomt.
 */
export async function lagreNotat(objektId, innhold) {
  if (!innhold.trim()) {
    // Slett tomme notater
    const { error } = await sb
      .from('notater')
      .delete()
      .eq('objekt_id', objektId);
    if (error) handleError('lagreNotat (slett)', error);
    return;
  }

  const { error } = await sb
    .from('notater')
    .upsert(
      { objekt_id: objektId, innhold },
      { onConflict: 'bruker_id,objekt_id' }
    );

  if (error) handleError('lagreNotat', error);
}
