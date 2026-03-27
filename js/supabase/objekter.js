/* ============================================================
   js/supabase/objekter.js
   Les og søk i objekter. Skriveoperasjoner er i admin.js.
   ============================================================ */

import { sb, handleError } from './client.js';

// ── KOLONNER SOM RETURNERES TIL FRONTEND ───────────────────
// Ikke returner opprettet_av eller intern admin-data til vanlige brukere
const OFFENTLIGE_FELT = `
  id, tittel, adresse, by, fylke, type, strategi, eierform,
  rom, areal, etasje, byggeaar,
  prisantydning, fellesgjeld, total_pris, felleskostnader,
  leieinntekt_estimat, yield_estimat, netto_yield, kontantstroem_estimat,
  rehab_kostnad, estimert_salgsverdi, brutto_fortjeneste, flip_roi,
  tilstand, utleiepotensial, investor_score,
  bilder, megler_navn, megler_firma, original_annonse,
  nabolag, fasiliteter, beskrivelse,
  status, premium, opprettet, oppdatert
`;

// ── SØKE-FUNKSJON ───────────────────────────────────────────

/**
 * Søk i objekter via RPC (server-side filtrering og RLS).
 *
 * @param {object} filter - samme struktur som F-objektet i sok.js
 * @param {string} sortering - 'nyeste'|'yield_desc'|'score_desc'|'pris_asc'|'pris_desc'
 * @param {number} side - sidenummer (starter på 1)
 * @param {number} perSide - antall per side
 */
export async function sokObjekter({
  tekst         = null,
  strategi      = null,
  byer          = [],
  typer         = [],
  eierformer    = [],
  tilstander    = [],
  utleiepotensial = [],
  prisFra       = null,
  prisTil       = null,
  fellesgjeldMax = null,
  romFra        = null,
  romTil        = null,
  arealFra      = null,
  arealTil      = null,
  bruttoYieldMin = null,
  nettoYieldMin  = null,
  flipROIMin    = null,
  scoreMin      = null,
  sortering     = 'nyeste',
  side          = 1,
  perSide       = 24,
} = {}) {
  const { data, error } = await sb.rpc('sok_objekter', {
    p_by:               byer.length === 1 ? byer[0] : null,
    p_strategi:         strategi || null,
    p_type:             typer.length     ? typer      : null,
    p_eierform:         eierformer.length ? eierformer : null,
    p_tilstand:         tilstander.length ? tilstander : null,
    p_potensial:        utleiepotensial.length ? utleiepotensial : null,
    p_pris_fra:         prisFra       ?? null,
    p_pris_til:         prisTil       ?? null,
    p_fellesgjeld_max:  fellesgjeldMax ?? null,
    p_rom_fra:          romFra        ?? null,
    p_rom_til:          romTil        ?? null,
    p_areal_fra:        arealFra      ?? null,
    p_areal_til:        arealTil      ?? null,
    p_yield_min:        bruttoYieldMin ?? null,
    p_netto_yield_min:  nettoYieldMin  ?? null,
    p_flip_roi_min:     flipROIMin    ?? null,
    p_score_min:        scoreMin      ?? null,
    p_tekst:            tekst         ?? null,
    p_sortering:        sortering,
    p_limit:            perSide,
    p_offset:           (side - 1) * perSide,
  });

  // Håndter flerbys-filter på klientsiden (RPC støtter kun én by)
  let res = data ?? [];
  if (byer.length > 1) {
    res = res.filter(o => byer.includes(o.by));
  }

  if (error) handleError('sokObjekter', error);
  return res;
}

// ── HENT ENKELT OBJEKT ──────────────────────────────────────

/**
 * Hent ett objekt med full data. Respekterer RLS.
 * Returnerer objektet eller null hvis ikke funnet / ikke tilgang.
 */
export async function hentObjekt(id) {
  const { data, error } = await sb
    .from('objekter')
    .select(OFFENTLIGE_FELT)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleError('hentObjekt', error);
  }
  return data;
}

// ── MAPPING: DB → FRONTEND ──────────────────────────────────

/**
 * Mapper DB-kolonnenavn (snake_case) til det frontend-koden forventer.
 * Gjør det enkelt å bytte mellom lokal data.js og Supabase.
 */
export function mapObjekt(row) {
  if (!row) return null;
  return {
    id:                    row.id,
    tittel:                row.tittel,
    adresse:               row.adresse,
    by:                    row.by,
    fylke:                 row.fylke,
    type:                  row.type,
    strategi:              row.strategi,
    eierform:              row.eierform,
    rom:                   row.rom,
    areal:                 row.areal,
    etasje:                row.etasje,
    byggeaar:              row.byggeaar,
    prisantydning:         row.prisantydning,
    fellesgjeld:           row.fellesgjeld,
    totalPris:             row.total_pris,
    felleskostnader:       row.felleskostnader,
    leieinntektEstimat:    row.leieinntekt_estimat,
    yieldEstimat:          row.yield_estimat,
    nettoYield:            row.netto_yield,
    kontantstroemEstimat:  row.kontantstroem_estimat,
    rehabKostnad:          row.rehab_kostnad,
    estimertSalgsverdi:    row.estimert_salgsverdi,
    bruttoFortjeneste:     row.brutto_fortjeneste,
    flipROI:               row.flip_roi,
    tilstand:              row.tilstand,
    utleiepotensial:       row.utleiepotensial,
    investorScore:         row.investor_score,
    bilder:                row.bilder ?? [],
    meglerNavn:            row.megler_navn,
    meglerFirma:           row.megler_firma,
    originalAnnonse:       row.original_annonse,
    nabolag:               row.nabolag ?? {},
    fasiliteter:           row.fasiliteter ?? [],
    beskrivelse:           row.beskrivelse,
    status:                row.status,
    premium:               row.premium,
    lagt_til:              row.opprettet,
  };
}