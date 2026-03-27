/* =============================================
   SOK.JS — v2 (Supabase)
   ============================================= */

import { sokObjekter, mapObjekt } from './supabase/objekter.js';
import { hentFavorittIder, toggleFavoritt } from './supabase/favoritter.js';
import { lagreSok } from './supabase/lagrede-sok.js';
import { getSession } from './supabase/client.js';

// ── STATE ──────────────────────────────────────────────────────────

const F = {
  tekst:          '',
  strategi:       '',
  byer:           [],
  typer:          [],
  eierformer:     [],
  tilstander:     [],
  utleiepotensial:[],
  prisFra:        null,
  prisTil:        null,
  fellesgjeldMax: null,
  romFra:         null,
  romTil:         null,
  arealFra:       null,
  arealTil:       null,
  bruttoYieldMin: null,
  nettoYieldMin:  null,
  flipROIMin:     null,
  scoreMin:       0,
};

let SORT       = 'dato';
let SIDE       = 1;
const PR_SIDE  = 12;

// Caches oppdatert etter hvert søk
let _currentResults = [];   // side-data (PR_SIDE objekter)
let _totalCount     = 0;    // totalt antall treff fra server
let _favIds         = new Set(); // IDer brukeren har som favoritter

// ── INIT ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('navbar-root').innerHTML = navbarHTML('sok.html');
  document.getElementById('footer-root').innerHTML = footerHTML();
  initNavbar();

  // Last inn favoritt-IDer stille i bakgrunnen (krever innlogging)
  try {
    const session = await getSession();
    if (session) {
      const ids = await hentFavorittIder();
      _favIds = new Set(ids);
    }
  } catch (_) { /* ikke innlogget — viser bare tomme hjerter */ }

  renderFilterPanel('filter-panel-content');
  renderFilterPanel('filter-drawer-body');
  syncFilterUI();

  initTopbarEvents();
  initDrawerEvents();
  initModalEvents();

  await render();
});

// ── FILTER PANEL HTML ──────────────────────────────────────────────

function renderFilterPanel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Statiske filter-valg — lastes fra data.js-fallback eller hardkodet
  // Når Supabase er koblet til, kan disse hentes dynamisk fra DB
  const byer   = (typeof OBJEKTER !== 'undefined')
    ? [...new Set(OBJEKTER.map(o => o.by))].sort()
    : ['Bergen','Oslo','Stavanger','Tromsø','Trondheim'];
  const typer  = (typeof OBJEKTER !== 'undefined')
    ? [...new Set(OBJEKTER.map(o => o.type))].sort()
    : ['Enebolig','Leilighet','Næringseiendom','Rekkehus','Tomannsbolig'];
  const eierformer = ['Selveier', 'Andel', 'Aksje'];
  const tilstander = ['Nyoppusset', 'God stand', 'Noe slitasje', 'Oppussing nødvendig'];
  const potensialValg = ['Svært høyt', 'Høyt', 'Middels', 'Lavt'];

  const byerCount = byer.map(by => {
    const n = (typeof OBJEKTER !== 'undefined') ? OBJEKTER.filter(o => o.by === by).length : 0;
    return { val: by, n };
  });

  const typerCount = typer.map(t => {
    const n = (typeof OBJEKTER !== 'undefined') ? OBJEKTER.filter(o => o.type === t).length : 0;
    return { val: t, n };
  });

  container.innerHTML = `
    <div class="filter-panel-head">
      <span class="filter-panel-label">Filter</span>
      <button class="filter-reset-all" data-reset>Nullstill alt</button>
    </div>

    <!-- STRATEGI -->
    <div class="filter-group open" data-group="strategi">
      <button class="filter-group-toggle" aria-expanded="true">
        <span class="filter-group-name">Strategi</span>
        <div class="filter-group-meta">
          <svg class="filter-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>
      <div class="filter-group-body">
        <div class="strategy-pills">
          <button class="strategy-pill" data-strat="">Alle</button>
          <button class="strategy-pill" data-strat="utleie">Utleie</button>
          <button class="strategy-pill" data-strat="flipp">Flipp</button>
        </div>
      </div>
    </div>

    <!-- OMRÅDE -->
    <div class="filter-group open" data-group="by">
      <button class="filter-group-toggle" aria-expanded="true">
        <span class="filter-group-name">Område / by</span>
        <div class="filter-group-meta">
          <span class="filter-group-count hidden" data-group-count="by">0</span>
          <svg class="filter-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>
      <div class="filter-group-body">
        <div class="filter-checkboxes">
          ${byerCount.map(({ val, n }) => `
            <label class="filter-cb-item">
              <input type="checkbox" class="cb-by" value="${val}">
              <span class="filter-cb-label">${val}</span>
              <span class="filter-cb-count">${n}</span>
            </label>`).join('')}
        </div>
      </div>
    </div>

    <!-- EIENDOMSTYPE -->
    <div class="filter-group" data-group="type">
      <button class="filter-group-toggle" aria-expanded="false">
        <span class="filter-group-name">Boligtype</span>
        <div class="filter-group-meta">
          <span class="filter-group-count hidden" data-group-count="type">0</span>
          <svg class="filter-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>
      <div class="filter-group-body">
        <div class="filter-checkboxes">
          ${typerCount.map(({ val, n }) => `
            <label class="filter-cb-item">
              <input type="checkbox" class="cb-type" value="${val}">
              <span class="filter-cb-label">${val}</span>
              <span class="filter-cb-count">${n}</span>
            </label>`).join('')}
        </div>
      </div>
    </div>

    <!-- EIERFORM -->
    <div class="filter-group" data-group="eierform">
      <button class="filter-group-toggle" aria-expanded="false">
        <span class="filter-group-name">Eierform</span>
        <div class="filter-group-meta">
          <span class="filter-group-count hidden" data-group-count="eierform">0</span>
          <svg class="filter-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>
      <div class="filter-group-body">
        <div class="filter-checkboxes">
          ${eierformer.map(e => `
            <label class="filter-cb-item">
              <input type="checkbox" class="cb-eierform" value="${e}">
              <span class="filter-cb-label">${e}</span>
            </label>`).join('')}
        </div>
      </div>
    </div>

    <!-- STØRRELSE -->
    <div class="filter-group" data-group="storrelse">
      <button class="filter-group-toggle" aria-expanded="false">
        <span class="filter-group-name">Størrelse</span>
        <div class="filter-group-meta">
          <span class="filter-group-count hidden" data-group-count="storrelse">0</span>
          <svg class="filter-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>
      <div class="filter-group-body">
        <p style="font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Areal (m²)</p>
        <div class="filter-range" style="margin-bottom:14px">
          <input type="number" class="filter-range-input" id="${containerId}-areal-fra" placeholder="Fra" step="10" min="0">
          <input type="number" class="filter-range-input" id="${containerId}-areal-til" placeholder="Til" step="10" min="0">
        </div>
        <p style="font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Antall rom</p>
        <div class="filter-range">
          <input type="number" class="filter-range-input" id="${containerId}-rom-fra" placeholder="Fra" min="0" max="20">
          <input type="number" class="filter-range-input" id="${containerId}-rom-til" placeholder="Til" min="0" max="20">
        </div>
      </div>
    </div>

    <!-- PRIS OG GJELD -->
    <div class="filter-group" data-group="pris">
      <button class="filter-group-toggle" aria-expanded="false">
        <span class="filter-group-name">Pris og fellesgjeld</span>
        <div class="filter-group-meta">
          <span class="filter-group-count hidden" data-group-count="pris">0</span>
          <svg class="filter-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>
      <div class="filter-group-body">
        <p style="font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Prisantydning (kr)</p>
        <div class="filter-range" style="margin-bottom:14px">
          <input type="number" class="filter-range-input" id="${containerId}-pris-fra" placeholder="Fra" step="500000" min="0">
          <input type="number" class="filter-range-input" id="${containerId}-pris-til" placeholder="Til" step="500000" min="0">
        </div>
        <p style="font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Maks fellesgjeld (kr)</p>
        <div style="margin-bottom:4px">
          <input type="number" class="filter-range-input" id="${containerId}-fellesgjeld-max" placeholder="Maks" step="100000" min="0" style="width:100%">
        </div>
      </div>
    </div>

    <!-- AVKASTNING -->
    <div class="filter-group" data-group="avk">
      <button class="filter-group-toggle" aria-expanded="false">
        <span class="filter-group-name">Avkastning</span>
        <div class="filter-group-meta">
          <span class="filter-group-count hidden" data-group-count="avk">0</span>
          <svg class="filter-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>
      <div class="filter-group-body">
        <p style="font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Est. brutto yield (%) min.</p>
        <input type="number" class="filter-range-input" id="${containerId}-yield-min" placeholder="F.eks. 5" step="0.5" min="0" max="15" style="width:100%;margin-bottom:12px">
        <p style="font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Est. netto yield (%) min.</p>
        <input type="number" class="filter-range-input" id="${containerId}-nettoyield-min" placeholder="F.eks. 3" step="0.5" min="0" max="15" style="width:100%;margin-bottom:12px">
        <p style="font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Flipp ROI (%) min.</p>
        <input type="number" class="filter-range-input" id="${containerId}-roi-min" placeholder="F.eks. 15" step="1" min="0" max="100" style="width:100%">
      </div>
    </div>

    <!-- TILSTAND -->
    <div class="filter-group" data-group="tilstand">
      <button class="filter-group-toggle" aria-expanded="false">
        <span class="filter-group-name">Tilstand</span>
        <div class="filter-group-meta">
          <span class="filter-group-count hidden" data-group-count="tilstand">0</span>
          <svg class="filter-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>
      <div class="filter-group-body">
        <div class="filter-checkboxes">
          ${tilstander.map(t => `
            <label class="filter-cb-item">
              <input type="checkbox" class="cb-tilstand" value="${t}">
              <span class="filter-cb-label">${t}</span>
            </label>`).join('')}
        </div>
      </div>
    </div>

    <!-- UTLEIEPOTENSIAL -->
    <div class="filter-group" data-group="potensial">
      <button class="filter-group-toggle" aria-expanded="false">
        <span class="filter-group-name">Utleiepotensial</span>
        <div class="filter-group-meta">
          <span class="filter-group-count hidden" data-group-count="potensial">0</span>
          <svg class="filter-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>
      <div class="filter-group-body">
        <div class="filter-checkboxes">
          ${potensialValg.map(p => `
            <label class="filter-cb-item">
              <input type="checkbox" class="cb-potensial" value="${p}">
              <span class="filter-cb-label">${p}</span>
            </label>`).join('')}
        </div>
      </div>
    </div>

    <!-- INVESTOR SCORE -->
    <div class="filter-group" data-group="score">
      <button class="filter-group-toggle" aria-expanded="false">
        <span class="filter-group-name">Investor-score</span>
        <div class="filter-group-meta">
          <span class="filter-group-count hidden" data-group-count="score">0</span>
          <svg class="filter-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>
      <div class="filter-group-body">
        <div class="filter-slider-value" id="${containerId}-score-val">Minimum: 0</div>
        <div class="filter-slider-wrap">
          <input type="range" class="filter-slider score-slider" id="${containerId}-score" min="0" max="100" step="5" value="0">
          <div class="filter-slider-labels">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </div>
        <p style="font-size:11px;color:var(--gray-400);margin-top:8px;line-height:1.5">
          Score 0–100 basert på yield, kontantstrøm, tilstand og beliggenhet.
        </p>
      </div>
    </div>`;

  // Wire up events for this panel instance
  bindPanelEvents(container, containerId);
}

function bindPanelEvents(container, containerId) {
  // Group accordion
  container.querySelectorAll('.filter-group-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const grp = btn.closest('.filter-group');
      grp.classList.toggle('open');
      btn.setAttribute('aria-expanded', grp.classList.contains('open'));
    });
  });

  // Strategy pills
  container.querySelectorAll('[data-strat]').forEach(pill => {
    pill.addEventListener('click', () => {
      F.strategi = pill.getAttribute('data-strat');
      SIDE = 1;
      syncFilterUI();
      render();
    });
  });

  // Checkboxes
  const cbGroups = [
    { cls: 'cb-by',       key: 'byer' },
    { cls: 'cb-type',     key: 'typer' },
    { cls: 'cb-eierform', key: 'eierformer' },
    { cls: 'cb-tilstand', key: 'tilstander' },
    { cls: 'cb-potensial',key: 'utleiepotensial' },
  ];

  cbGroups.forEach(({ cls, key }) => {
    container.querySelectorAll(`.${cls}`).forEach(cb => {
      cb.addEventListener('change', () => {
        F[key] = [...document.querySelectorAll(`.${cls}:checked`)].map(c => c.value);
        SIDE = 1; syncFilterUI(); render();
      });
    });
  });

  // Range/number inputs — debounced
  const rangeMap = [
    [`${containerId}-areal-fra`,       'arealFra',       parseInt],
    [`${containerId}-areal-til`,       'arealTil',       parseInt],
    [`${containerId}-rom-fra`,         'romFra',         parseInt],
    [`${containerId}-rom-til`,         'romTil',         parseInt],
    [`${containerId}-pris-fra`,        'prisFra',        parseInt],
    [`${containerId}-pris-til`,        'prisTil',        parseInt],
    [`${containerId}-fellesgjeld-max`, 'fellesgjeldMax', parseInt],
    [`${containerId}-yield-min`,       'bruttoYieldMin', parseFloat],
    [`${containerId}-nettoyield-min`,  'nettoYieldMin',  parseFloat],
    [`${containerId}-roi-min`,         'flipROIMin',     parseFloat],
  ];

  rangeMap.forEach(([id, key, parser]) => {
    const el = document.getElementById(id);
    if (!el) return;
    let timer;
    el.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        F[key] = el.value !== '' ? parser(el.value) : null;
        SIDE = 1; syncFilterUI(); render();
      }, 400);
    });
  });

  // Score slider
  const slider = document.getElementById(`${containerId}-score`);
  const sliderVal = document.getElementById(`${containerId}-score-val`);
  if (slider && sliderVal) {
    slider.addEventListener('input', () => {
      F.scoreMin = parseInt(slider.value);
      sliderVal.textContent = `Minimum: ${slider.value}`;
      SIDE = 1; syncFilterUI(); render();
    });
  }

  // Reset all
  container.querySelectorAll('[data-reset]').forEach(btn => {
    btn.addEventListener('click', resetAll);
  });
}

// ── SYNC UI TO STATE ───────────────────────────────────────────────

function syncFilterUI() {
  // Strategy pills (both panels)
  document.querySelectorAll('[data-strat]').forEach(pill => {
    const s = pill.getAttribute('data-strat');
    pill.className = 'strategy-pill';
    if (s === F.strategi) {
      pill.classList.add(s === '' ? 'active-all' : s === 'utleie' ? 'active-utleie' : 'active-flipp');
    }
  });

  // Checkboxes
  const cbMap = [
    { cls: 'cb-by',        arr: F.byer },
    { cls: 'cb-type',      arr: F.typer },
    { cls: 'cb-eierform',  arr: F.eierformer },
    { cls: 'cb-tilstand',  arr: F.tilstander },
    { cls: 'cb-potensial', arr: F.utleiepotensial },
  ];
  cbMap.forEach(({ cls, arr }) => {
    document.querySelectorAll(`.${cls}`).forEach(cb => {
      cb.checked = arr.includes(cb.value);
    });
  });

  // Group count badges
  updateGroupCount('by',       F.byer.length);
  updateGroupCount('type',     F.typer.length);
  updateGroupCount('eierform', F.eierformer.length);
  updateGroupCount('tilstand', F.tilstander.length);
  updateGroupCount('potensial',F.utleiepotensial.length);

  const storrelse = countDefined([F.arealFra, F.arealTil, F.romFra, F.romTil]);
  const pris      = countDefined([F.prisFra, F.prisTil, F.fellesgjeldMax]);
  const avk       = countDefined([F.bruttoYieldMin, F.nettoYieldMin, F.flipROIMin]);
  const score     = F.scoreMin > 0 ? 1 : 0;

  updateGroupCount('storrelse', storrelse);
  updateGroupCount('pris',      pris);
  updateGroupCount('avk',       avk);
  updateGroupCount('score',     score);

  // Bubble on mobile toggle button
  const total = countActiveFilters();
  const bubble = document.getElementById('filter-bubble');
  if (bubble) {
    bubble.textContent = total;
    bubble.classList.toggle('hidden', total === 0);
  }

  // Active chips
  renderChips();
}

function countDefined(arr) { return arr.filter(v => v !== null && v !== undefined).length; }

function countActiveFilters() {
  let n = 0;
  if (F.strategi) n++;
  n += F.byer.length + F.typer.length + F.eierformer.length + F.tilstander.length + F.utleiepotensial.length;
  n += countDefined([F.prisFra, F.prisTil, F.fellesgjeldMax, F.romFra, F.romTil, F.arealFra, F.arealTil, F.bruttoYieldMin, F.nettoYieldMin, F.flipROIMin]);
  if (F.scoreMin > 0) n++;
  if (F.tekst) n++;
  return n;
}

function updateGroupCount(group, n) {
  document.querySelectorAll(`[data-group-count="${group}"]`).forEach(el => {
    el.textContent = n;
    el.classList.toggle('hidden', n === 0);
  });
}

// ── ACTIVE FILTER CHIPS ────────────────────────────────────────────

function renderChips() {
  const container = document.getElementById('active-chips');
  if (!container) return;

  const chips = [];

  if (F.tekst) chips.push({ label: `"${F.tekst}"`, remove: () => { F.tekst = ''; document.getElementById('search-input').value = ''; } });
  if (F.strategi) chips.push({ label: F.strategi === 'utleie' ? 'Utleie' : 'Flipp', remove: () => { F.strategi = ''; } });
  F.byer.forEach(b    => chips.push({ label: b,                  remove: () => { F.byer = F.byer.filter(x => x !== b); } }));
  F.typer.forEach(t   => chips.push({ label: t,                  remove: () => { F.typer = F.typer.filter(x => x !== t); } }));
  F.eierformer.forEach(e => chips.push({ label: e,               remove: () => { F.eierformer = F.eierformer.filter(x => x !== e); } }));
  F.tilstander.forEach(t => chips.push({ label: t,               remove: () => { F.tilstander = F.tilstander.filter(x => x !== t); } }));
  F.utleiepotensial.forEach(p => chips.push({ label: `Potensial: ${p}`, remove: () => { F.utleiepotensial = F.utleiepotensial.filter(x => x !== p); } }));
  if (F.prisFra)         chips.push({ label: `Pris fra ${formaterPris(F.prisFra)}`,    remove: () => { F.prisFra = null; } });
  if (F.prisTil)         chips.push({ label: `Pris til ${formaterPris(F.prisTil)}`,    remove: () => { F.prisTil = null; } });
  if (F.fellesgjeldMax)  chips.push({ label: `Fellesgjeld maks ${formaterPris(F.fellesgjeldMax)}`, remove: () => { F.fellesgjeldMax = null; } });
  if (F.romFra)          chips.push({ label: `Min ${F.romFra} rom`,  remove: () => { F.romFra = null; } });
  if (F.romTil)          chips.push({ label: `Maks ${F.romTil} rom`, remove: () => { F.romTil = null; } });
  if (F.arealFra)        chips.push({ label: `Min ${F.arealFra} m²`, remove: () => { F.arealFra = null; } });
  if (F.arealTil)        chips.push({ label: `Maks ${F.arealTil} m²`,remove: () => { F.arealTil = null; } });
  if (F.bruttoYieldMin)  chips.push({ label: `Yield ≥ ${F.bruttoYieldMin}%`,    remove: () => { F.bruttoYieldMin = null; } });
  if (F.nettoYieldMin)   chips.push({ label: `N.yield ≥ ${F.nettoYieldMin}%`,   remove: () => { F.nettoYieldMin = null; } });
  if (F.flipROIMin)      chips.push({ label: `ROI ≥ ${F.flipROIMin}%`,          remove: () => { F.flipROIMin = null; } });
  if (F.scoreMin > 0)    chips.push({ label: `Score ≥ ${F.scoreMin}`,           remove: () => { F.scoreMin = 0; } });

  container.innerHTML = chips.map((c, i) => `
    <span class="chip">
      ${c.label}
      <button class="chip-remove" data-chip="${i}" aria-label="Fjern ${c.label}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </span>`).join('');

  container.querySelectorAll('.chip-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.getAttribute('data-chip'));
      chips[i].remove();
      SIDE = 1;
      syncFilterUI();
      render();
    });
  });
}

// ── FILTER + SORT LOGIC ────────────────────────────────────────────

// Sorteringsmap: lokal nøkkel → Supabase p_sortering-verdi
const SORT_MAP = {
  dato:       'nyeste',
  'score-desc':'score_desc',
  'yield-desc':'yield_desc',
  'pris-asc': 'pris_asc',
  'pris-desc':'pris_desc',
};

async function filtrer() {
  // Vis lasteindikator
  const grid = document.getElementById('property-grid');
  if (grid) grid.innerHTML = '<div style="grid-column:1/-1;padding:48px;text-align:center;color:var(--gray-400)">Laster objekter…</div>';

  try {
    const data = await sokObjekter({
      tekst:            F.tekst            || null,
      strategi:         F.strategi         || null,
      byer:             F.byer,
      typer:            F.typer,
      eierformer:       F.eierformer,
      tilstander:       F.tilstander,
      utleiepotensial:  F.utleiepotensial,
      prisFra:          F.prisFra,
      prisTil:          F.prisTil,
      fellesgjeldMax:   F.fellesgjeldMax,
      romFra:           F.romFra,
      romTil:           F.romTil,
      arealFra:         F.arealFra,
      arealTil:         F.arealTil,
      bruttoYieldMin:   F.bruttoYieldMin,
      nettoYieldMin:    F.nettoYieldMin,
      flipROIMin:       F.flipROIMin,
      scoreMin:         F.scoreMin > 0 ? F.scoreMin : null,
      sortering:        SORT_MAP[SORT] || 'nyeste',
      side:             SIDE,
      perSide:          PR_SIDE,
    });
    return data.map(mapObjekt);
  } catch (err) {
    console.error('sokObjekter feil:', err);
    return [];
  }
}

// ── RENDER ─────────────────────────────────────────────────────────

async function render() {
  const side = await filtrer();

  // Supabase RPC returnerer allerede paginert data.
  // Vi stoler på server-side paginering: side.length = resultatene på denne siden.
  // For total-antall: bruk et eget count-kall hvis nødvendig.
  // I v1: vi vet bare antall på denne siden + om det er flere.
  const total = side.length < PR_SIDE && SIDE === 1
    ? side.length
    : SIDE * PR_SIDE + (side.length === PR_SIDE ? 1 : 0); // estimat

  _currentResults = side;
  document.getElementById('result-count').textContent =
    side.length < PR_SIDE && SIDE === 1 ? side.length : side.length + '+';

  const grid  = document.getElementById('property-grid');
  const empty = document.getElementById('empty-state');
  const pagin = document.getElementById('pagination');

  if (side.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    pagin.innerHTML = '';
  } else {
    empty.classList.add('hidden');
    grid.innerHTML = side.map(obj => pcardHTML(obj)).join('');

    // Fav events — bruker Supabase toggleFavoritt
    grid.querySelectorAll('.pcard-fav').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        const id      = btn.dataset.id;
        const var_naa = _favIds.has(id);
        try {
          const naaLagret = await toggleFavoritt(id, var_naa);
          naaLagret ? _favIds.add(id) : _favIds.delete(id);
          btn.classList.toggle('saved', naaLagret);
          btn.innerHTML = heartSVG(naaLagret);
          showToast(naaLagret ? 'Lagt til i favoritter' : 'Fjernet fra favoritter', naaLagret ? 'success' : 'info');
        } catch (_) {
          showToast('Logg inn for å lagre favoritter', 'info');
        }
      });
    });

    renderPagination(side.length === PR_SIDE ? SIDE * PR_SIDE + 1 : (SIDE - 1) * PR_SIDE + side.length, pagin);
  }
}

// ── CARD HTML ──────────────────────────────────────────────────────

function pcardHTML(obj) {
  const fav       = _favIds.has(obj.id);
  const scoreKl   = scoreKlasse(obj.investorScore);
  const scoreIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

  // Tags
  const tags = [];
  if (obj.tilstand === 'Nyoppusset') tags.push({ label: 'Nyoppusset', cls: 'good' });
  if (obj.tilstand === 'Oppussing nødvendig') tags.push({ label: 'Oppussing', cls: 'warn' });
  if (obj.utleiepotensial === 'Svært høyt') tags.push({ label: 'Høyt potensial', cls: 'good' });
  if (obj.premium) tags.push({ label: 'Pro', cls: 'info' });
  tags.push({ label: obj.eierform, cls: '' });

  const tagsHTML = tags.map(t => `<span class="pcard-tag ${t.cls}">${t.label}</span>`).join('');

  // Metrics
  let metricsHTML = '';
  if (obj.strategi === 'utleie') {
    const yKl  = yieldKlasse(obj.yieldEstimat);
    const nyKl = yieldKlasse(obj.nettoYield);
    const cfKl = kontantstroemKlasse(obj.kontantstroemEstimat);
    metricsHTML = `
      <div class="pcard-metric">
        <div class="pcard-metric-label">Brutto yield</div>
        <div class="pcard-metric-value ${yKl}">${formaterYield(obj.yieldEstimat)}</div>
      </div>
      <div class="pcard-metric">
        <div class="pcard-metric-label">Netto yield</div>
        <div class="pcard-metric-value ${nyKl}">${formaterYield(obj.nettoYield)}</div>
      </div>
      <div class="pcard-metric">
        <div class="pcard-metric-label">Mnd. CF</div>
        <div class="pcard-metric-value ${cfKl}">${formaterKr(obj.kontantstroemEstimat)}</div>
      </div>`;
  } else {
    const roiKl = obj.flipROI >= 20 ? 'val-good' : obj.flipROI >= 12 ? 'val-ok' : 'val-low';
    metricsHTML = `
      <div class="pcard-metric">
        <div class="pcard-metric-label">Rehab est.</div>
        <div class="pcard-metric-value val-ok">${formaterPris(obj.rehabKostnad)}</div>
      </div>
      <div class="pcard-metric">
        <div class="pcard-metric-label">Fortjeneste</div>
        <div class="pcard-metric-value val-good">${formaterPris(obj.bruttoFortjeneste)}</div>
      </div>
      <div class="pcard-metric">
        <div class="pcard-metric-label">Flipp ROI</div>
        <div class="pcard-metric-value ${roiKl}">${obj.flipROI ? obj.flipROI.toFixed(1).replace('.', ',') + '%' : '—'}</div>
      </div>`;
  }

  // Price subtext
  const priceSub = obj.fellesgjeld > 0
    ? `+ ${formaterPris(obj.fellesgjeld)} fellesgjeld`
    : obj.areal > 0 ? `${obj.areal} m² · ${obj.rom > 0 ? obj.rom + ' rom' : 'næring'}` : '';

  return `
    <a href="objekt.html?id=${obj.id}" class="pcard" tabindex="0">
      <div class="pcard-img">
        <img src="${obj.bilder[0]}" alt="${obj.tittel}" loading="lazy">
        <div class="pcard-img-top">
          <div class="pcard-badges">
            ${strategiBadge(obj.strategi)}
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            ${obj.investorScore ? `<span class="score-badge ${scoreKl}">${scoreIcon}${obj.investorScore}</span>` : ''}
            <button class="pcard-fav${fav ? ' saved' : ''}" data-id="${obj.id}" aria-label="${fav ? 'Fjern favoritt' : 'Legg til favoritt'}" tabindex="0">
              ${heartSVG(fav)}
            </button>
          </div>
        </div>
      </div>
      <div class="pcard-body">
        <div>
          <h3 class="pcard-title">${obj.tittel}</h3>
          <div class="pcard-meta">
            <span>${obj.by}</span>
            <span class="pcard-meta-sep"></span>
            <span>${obj.type}</span>
            ${obj.areal > 0 ? `<span class="pcard-meta-sep"></span><span>${obj.areal} m²</span>` : ''}
            ${obj.rom > 0 ? `<span class="pcard-meta-sep"></span><span>${obj.rom} rom</span>` : ''}
          </div>
        </div>
        <div class="pcard-metrics">${metricsHTML}</div>
        <div class="pcard-tags">${tagsHTML}</div>
      </div>
      <div class="pcard-foot">
        <div>
          <div class="pcard-price">${formaterPris(obj.prisantydning)}</div>
          ${priceSub ? `<div class="pcard-price-sub">${priceSub}</div>` : ''}
        </div>
        <span class="btn btn-primary btn-sm">Se analyse →</span>
      </div>
    </a>`;
}

function heartSVG(fylt) {
  return fylt
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

// ── PAGINATION ─────────────────────────────────────────────────────

function renderPagination(total, container) {
  const sider = Math.ceil(total / PR_SIDE);
  if (sider <= 1) { container.innerHTML = ''; return; }

  let html = `
    <button class="page-btn" data-p="${SIDE - 1}" ${SIDE <= 1 ? 'disabled' : ''} aria-label="Forrige">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
    </button>`;

  for (let i = 1; i <= sider; i++) {
    if (i === 1 || i === sider || (i >= SIDE - 1 && i <= SIDE + 1)) {
      html += `<button class="page-btn${i === SIDE ? ' active' : ''}" data-p="${i}">${i}</button>`;
    } else if (i === SIDE - 2 || i === SIDE + 2) {
      html += `<span class="page-dots">…</span>`;
    }
  }

  html += `
    <button class="page-btn" data-p="${SIDE + 1}" ${SIDE >= sider ? 'disabled' : ''} aria-label="Neste">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`;

  container.innerHTML = html;
  container.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      SIDE = parseInt(btn.dataset.p);
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// ── TOPBAR EVENTS ──────────────────────────────────────────────────

function initTopbarEvents() {
  // Search input
  let searchTimer;
  document.getElementById('search-input').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      F.tekst = e.target.value.toLowerCase().trim();
      SIDE = 1;
      syncFilterUI();
      render();
    }, 280);
  });

  // Sort
  document.getElementById('sort-select').addEventListener('change', e => {
    SORT = e.target.value;
    render();
  });

  // Empty reset
  document.getElementById('empty-reset')?.addEventListener('click', resetAll);
}

// ── DRAWER EVENTS ──────────────────────────────────────────────────

function initDrawerEvents() {
  const drawer   = document.getElementById('filter-drawer');
  const backdrop = document.getElementById('filter-backdrop');
  const openBtn  = document.getElementById('filter-open-btn');
  const closeBtn = document.getElementById('filter-close-btn');
  const applyBtn = document.getElementById('drawer-apply');
  const resetBtn = document.getElementById('drawer-reset');

  const open  = () => { drawer.classList.add('open'); backdrop.classList.add('visible'); document.body.style.overflow = 'hidden'; };
  const close = () => { drawer.classList.remove('open'); backdrop.classList.remove('visible'); document.body.style.overflow = ''; };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  applyBtn.addEventListener('click', close);
  resetBtn.addEventListener('click', () => { resetAll(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
}

// ── MODAL EVENTS ───────────────────────────────────────────────────

function initModalEvents() {
  const modal   = document.getElementById('save-modal');
  const openBtn = document.getElementById('save-search-btn');
  const closeBtn= document.getElementById('modal-close');
  const saveBtn = document.getElementById('modal-save');
  const summary = document.getElementById('modal-summary');

  const open  = () => { modal.classList.add('open'); summary.textContent = lagFilterTekst(); document.getElementById('search-name').value = ''; setTimeout(() => document.getElementById('search-name').focus(), 100); };
  const close = () => modal.classList.remove('open');

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  saveBtn.addEventListener('click', () => {
    const navn = document.getElementById('search-name').value.trim();
    if (!navn) { showToast('Skriv inn et navn for søket', 'error'); return; }
    LAGREDE_SOK.unshift({ id: `s-${Date.now()}`, navn, dato: new Date().toISOString().slice(0,10), filter: { ...F }, antallTreff: filtrer().length, filterTekst: lagFilterTekst() });
    close();
    showToast(`"${navn}" er lagret`, 'success');
  });
}

// ── HELPERS ────────────────────────────────────────────────────────

function resetAll() {
  Object.assign(F, { tekst:'', strategi:'', byer:[], typer:[], eierformer:[], tilstander:[], utleiepotensial:[], prisFra:null, prisTil:null, fellesgjeldMax:null, romFra:null, romTil:null, arealFra:null, arealTil:null, bruttoYieldMin:null, nettoYieldMin:null, flipROIMin:null, scoreMin:0 });
  document.getElementById('search-input').value = '';
  // Clear all range inputs
  document.querySelectorAll('.filter-range-input').forEach(el => el.value = '');
  // Reset sliders
  document.querySelectorAll('.score-slider').forEach(el => {
    el.value = 0;
    const labelId = el.id.replace('-score', '-score-val');
    const label = document.getElementById(labelId);
    if (label) label.textContent = 'Minimum: 0';
  });
  SIDE = 1;
  syncFilterUI();
  render();
  showToast('Filter nullstilt', 'info');
}

function lagFilterTekst() {
  const deler = [];
  if (F.tekst)            deler.push(`"${F.tekst}"`);
  if (F.strategi)         deler.push(F.strategi === 'utleie' ? 'Utleie' : 'Flipp');
  if (F.byer.length)      deler.push(F.byer.join(', '));
  if (F.typer.length)     deler.push(F.typer.join(', '));
  if (F.bruttoYieldMin)   deler.push(`Yield ≥ ${F.bruttoYieldMin}%`);
  if (F.scoreMin > 0)     deler.push(`Score ≥ ${F.scoreMin}`);
  if (F.prisFra)          deler.push(`Fra ${formaterPris(F.prisFra)}`);
  if (F.prisTil)          deler.push(`Til ${formaterPris(F.prisTil)}`);
  return deler.length ? deler.join(' · ') : 'Alle objekter';
}