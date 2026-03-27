/* ============================================================
   js/supabase/admin.js
   Admin CRUD for objekter. Alle operasjoner krever admin-rolle.
   RLS blokkerer automatisk ikke-admin brukere.
   ============================================================ */

import { sb, handleError } from './client.js';

// ── ALLE FELT (admin ser mer enn vanlige brukere) ───────────
const ADMIN_FELT = `
  id, tittel, adresse, by, fylke, type, strategi, eierform,
  rom, areal, etasje, byggeaar,
  prisantydning, fellesgjeld, total_pris, felleskostnader,
  leieinntekt_estimat, yield_estimat, netto_yield, kontantstroem_estimat,
  rehab_kostnad, estimert_salgsverdi, brutto_fortjeneste, flip_roi,
  tilstand, utleiepotensial, investor_score,
  bilder, megler_navn, megler_firma, original_annonse,
  nabolag, fasiliteter, beskrivelse,
  status, premium, opprettet_av, opprettet, oppdatert
`;

// ══════════════════════════════════════════════════════════════
//  OBJEKTER — CRUD
// ══════════════════════════════════════════════════════════════

// ── HENT ALLE (admin) ───────────────────────────────────────

/**
 * Hent alle objekter inkl. utkast og inaktive.
 * Paginert — bruk side og perSide.
 */
export async function adminHentObjekter({
  sokeTekst = '',
  status    = '',
  strategi  = '',
  by        = '',
  side      = 1,
  perSide   = 50,
} = {}) {
  let query = sb
    .from('objekter')
    .select(ADMIN_FELT, { count: 'exact' })
    .order('opprettet', { ascending: false })
    .range((side - 1) * perSide, side * perSide - 1);

  if (status)    query = query.eq('status', status);
  if (strategi)  query = query.eq('strategi', strategi);
  if (by)        query = query.eq('by', by);
  if (sokeTekst) query = query.ilike('tittel', `%${sokeTekst}%`);

  const { data, count, error } = await query;
  if (error) handleError('adminHentObjekter', error);

  return { objekter: data ?? [], totalt: count ?? 0 };
}

// ── HENT ÉTT (admin) ───────────────────────────────────────

export async function adminHentObjekt(id) {
  const { data, error } = await sb
    .from('objekter')
    .select(ADMIN_FELT)
    .eq('id', id)
    .single();

  if (error) handleError('adminHentObjekt', error);
  return data;
}

// ── OPPRETT OBJEKT ──────────────────────────────────────────

/**
 * Opprett nytt objekt.
 * @param {object} felt - alle feltene fra skjemaet, camelCase
 * Returnerer det nye objektet.
 */
export async function adminOpprettObjekt(felt) {
  const { data, error } = await sb
    .from('objekter')
    .insert(mapTilDB(felt))
    .select(ADMIN_FELT)
    .single();

  if (error) handleError('adminOpprettObjekt', error);
  return data;
}

// ── OPPDATER OBJEKT ─────────────────────────────────────────

/**
 * Oppdater eksisterende objekt.
 */
export async function adminOppdaterObjekt(id, felt) {
  const { data, error } = await sb
    .from('objekter')
    .update(mapTilDB(felt))
    .eq('id', id)
    .select(ADMIN_FELT)
    .single();

  if (error) handleError('adminOppdaterObjekt', error);
  return data;
}

// ── SLETT OBJEKT ────────────────────────────────────────────

export async function adminSlettObjekt(id) {
  const { error } = await sb
    .from('objekter')
    .delete()
    .eq('id', id);

  if (error) handleError('adminSlettObjekt', error);
}

// ── BULK STATUS ─────────────────────────────────────────────

/**
 * Sett status på flere objekter på en gang.
 * @param {string[]} ids - array av UUIDs
 * @param {string}   status - 'publisert'|'utkast'|'inaktiv'
 */
export async function adminBulkStatus(ids, status) {
  const { error } = await sb
    .from('objekter')
    .update({ status })
    .in('id', ids);

  if (error) handleError('adminBulkStatus', error);
}

// ══════════════════════════════════════════════════════════════
//  STATISTIKK
// ══════════════════════════════════════════════════════════════

/**
 * Hent aggregert statistikk fra view objekter_statistikk.
 */
export async function adminHentStatistikk() {
  const { data, error } = await sb
    .from('objekter_statistikk')
    .select('*')
    .single();

  if (error) handleError('adminHentStatistikk', error);
  return data;
}

// ══════════════════════════════════════════════════════════════
//  BRUKERE (for admin-listen)
// ══════════════════════════════════════════════════════════════

/**
 * Hent alle brukerprofiler (kun synlig for admin via RLS).
 */
export async function adminHentBrukere() {
  const { data, error } = await sb
    .from('profiles')
    .select('id, navn, epost, plan, aktiv, opprettet')
    .order('opprettet', { ascending: false });

  if (error) handleError('adminHentBrukere', error);
  return data ?? [];
}

/**
 * Oppdater brukers plan (f.eks. oppgrader til pro).
 */
export async function adminOppdaterBrukerplan(brukerId, plan) {
  const { error } = await sb
    .from('profiles')
    .update({ plan })
    .eq('id', brukerId);

  if (error) handleError('adminOppdaterBrukerplan', error);
}

// ══════════════════════════════════════════════════════════════
//  MAPPING: CAMELCASE → SNAKE_CASE (frontend → DB)
// ══════════════════════════════════════════════════════════════

/**
 * Konverterer frontend-skjema (camelCase) til DB-kolonner (snake_case).
 * Kun inkluder felt som faktisk er sendt inn (undefined filtreres).
 */
function mapTilDB(felt) {
  const m = {};
  const set = (key, val) => { if (val !== undefined) m[key] = val; };

  set('tittel',               felt.tittel);
  set('adresse',              felt.adresse);
  set('by',                   felt.by);
  set('fylke',                felt.by); // fylke = by for v1
  set('type',                 felt.type);
  set('strategi',             felt.strategi);
  set('eierform',             felt.eierform);
  set('rom',                  felt.rom);
  set('areal',                felt.areal);
  set('etasje',               felt.etasje);
  set('byggeaar',             felt.byggeaar);
  set('prisantydning',        felt.prisantydning);
  set('fellesgjeld',          felt.fellesgjeld ?? 0);
  set('felleskostnader',      felt.felleskostnader ?? 0);
  set('leieinntekt_estimat',  felt.leieinntektEstimat);
  set('yield_estimat',        felt.yieldEstimat);
  set('netto_yield',          felt.nettoYield);
  set('kontantstroem_estimat',felt.kontantstroemEstimat);
  set('rehab_kostnad',        felt.rehabKostnad);
  set('estimert_salgsverdi',  felt.estimertSalgsverdi);
  set('brutto_fortjeneste',   felt.bruttoFortjeneste);
  set('flip_roi',             felt.flipROI);
  set('tilstand',             felt.tilstand);
  set('utleiepotensial',      felt.utleiepotensial);
  set('investor_score',       felt.investorScore);
  set('bilder',               felt.bilder ?? []);
  set('megler_navn',          felt.meglerNavn);
  set('megler_firma',         felt.meglerFirma);
  set('original_annonse',     felt.originalAnnonse);
  set('nabolag',              felt.nabolag ?? {});
  set('fasiliteter',          felt.fasiliteter ?? []);
  set('beskrivelse',          felt.beskrivelse);
  set('status',               felt.status);
  set('premium',              felt.premium ?? false);

  return m;
}