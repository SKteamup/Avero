/* ============================================================
   js/min-side.js
   Dashboard: henter data fra Supabase i stedet for lokal data.js
   ============================================================ */

import { hentProfil }          from './supabase/auth.js';
import { hentFavoritter }      from './supabase/favoritter.js';
import {
  hentLagredeSok,
  lagreSok,
  slettSok,
  toggleSokAktiv,
  mapLagretSok,
} from './supabase/lagrede-sok.js';

// ── TILSTAND ──────────────────────────────────────────────────

let profil      = null;
let favoritter  = [];
let lagredeSok  = [];

// ── INIT ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('navbar-root').innerHTML = navbarHTML('min-side.html');
  document.getElementById('footer-root').innerHTML = footerHTML();
  initNavbar();

  // Hent brukerdata parallelt
  try {
    [profil, favoritter, lagredeSok] = await Promise.all([
      hentProfil(),
      hentFavoritter(),
      hentLagredeSok(),
    ]);
  } catch (err) {
    // Ikke innlogget → redirect
    if (err.message?.includes('JWT') || err.message?.includes('session')) {
      location.href = 'logg-inn.html';
      return;
    }
    console.error('min-side init feil:', err);
  }

  applyProfil();
  renderSavedSearches();
  renderFavorites();
  updateTabCounts();

  const hash = location.hash.replace('#', '');
  if (['soks','favs','konto'].includes(hash)) switchDashTab(hash);
});

// ── PROFIL ────────────────────────────────────────────────────

function applyProfil() {
  if (!profil) return;

  const firstName = (profil.navn || 'deg').split(' ')[0];
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'God morgen' : hour < 18 ? 'God dag' : 'God kveld';

  document.getElementById('dash-greeting').textContent   = `${greeting}, ${firstName}`;
  document.getElementById('account-name').textContent    = profil.navn  || '—';
  document.getElementById('account-email').textContent   = profil.epost || '—';

  const planNames = { gratis: 'Gratisplan', pro: 'Pro', investor: 'Investor' };
  const planBadge = document.getElementById('dash-plan-badge');
  if (planBadge) {
    planBadge.textContent = planNames[profil.plan] || 'Gratisplan';
    planBadge.className   = `dash-plan-badge ${profil.plan || 'gratis'}`;
  }

  const planRow = document.getElementById('plan-name-row');
  if (planRow) planRow.textContent = planNames[profil.plan] || 'Gratis';

  const sokLimit = profil.plan === 'gratis' ? 1 : profil.plan === 'pro' ? 10 : '∞';
  const sokRow   = document.getElementById('plan-soks');
  if (sokRow) sokRow.textContent = `${lagredeSok.length} av ${sokLimit}`;

  // Vis upsell-banner hvis gratis og brukt kvote
  const upsell = document.getElementById('soks-upsell');
  if (upsell) {
    upsell.style.display =
      (profil.plan === 'gratis' && lagredeSok.length >= 1) ? 'flex' : 'none';
  }

  // Skjul oppgrader-knapper for betalende brukere
  if (profil.plan !== 'gratis') {
    document.querySelectorAll('[href="premium.html#priser"]').forEach(el => {
      el.style.display = 'none';
    });
  }
}

// ── TAB-BYTTE ─────────────────────────────────────────────────

window.switchDashTab = function(tab) {
  ['soks','favs','konto'].forEach(t => {
    document.getElementById(`tab-${t}`)?.classList.toggle('active', t === tab);
    document.getElementById(`tab-${t}`)?.setAttribute('aria-selected', t === tab);
    document.getElementById(`panel-${t}`)?.classList.toggle('active', t === tab);
  });
  history.replaceState(null, '', `#${tab}`);
};

function updateTabCounts() {
  const sokCount = document.getElementById('tab-soks-count');
  const favCount = document.getElementById('tab-favs-count');
  if (sokCount) sokCount.textContent = lagredeSok.length;
  if (favCount) favCount.textContent = favoritter.length;

  const sokSub = document.getElementById('soks-subtitle');
  const favSub = document.getElementById('favs-subtitle');
  if (sokSub) sokSub.textContent = lagredeSok.length === 0
    ? 'Lagre et søk for å få varsler om nye objekter'
    : `${lagredeSok.length} aktiv${lagredeSok.length !== 1 ? 'e' : ''} søkeprofil${lagredeSok.length !== 1 ? 'er' : ''}`;
  if (favSub) favSub.textContent = favoritter.length === 0
    ? 'Merk objekter med hjerte-ikonet for å samle dem her'
    : `${favoritter.length} objekt${favoritter.length !== 1 ? 'er' : ''} lagret`;
}

// ── LAGREDE SØK ───────────────────────────────────────────────

function renderSavedSearches() {
  const container = document.getElementById('soks-list');
  if (!container) return;

  if (lagredeSok.length === 0) {
    container.innerHTML = emptyStateHTML(
      'soks',
      'Ingen lagrede søk ennå',
      'Når du søker kan du lagre søket ditt. Vi varsler deg automatisk om nye objekter som passer.',
      'Gå til søk', 'sok.html',
      'Tips: Lagrede søk sparer deg for manuell sjekking.'
    );
    return;
  }

  const mapped = lagredeSok.map(mapLagretSok);
  const hasVarsler = profil?.plan !== 'gratis';

  container.innerHTML = `<div class="saved-searches">
    ${mapped.map(s => `
      <div class="saved-search-card" id="scard-${s.id}">
        <div class="saved-search-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <div class="saved-search-info">
          <div class="saved-search-name">${s.navn}</div>
          <div class="saved-search-filters">${s.filterTekst}</div>
        </div>
        <div class="saved-search-meta">
          <div class="saved-search-count">${s.antallTreff} treff</div>
          <div class="saved-search-date">${formaterDato(s.dato)}</div>
        </div>
        <span class="saved-search-badge ${s.aktiv && hasVarsler ? 'active' : 'paused'}">
          ${s.aktiv && hasVarsler ? 'Aktiv' : 'Deaktivert'}
        </span>
        <div class="saved-search-actions">
          <a href="sok.html" class="icon-btn" style="text-decoration:none" title="Åpne søk">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
          <button class="icon-btn danger" onclick="deleteSavedSearch('${s.id}','${s.navn}')" title="Slett">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>`).join('')}
  </div>`;
}

window.deleteSavedSearch = async function(id, navn) {
  try {
    await slettSok(id);
    lagredeSok = lagredeSok.filter(s => s.id !== id);
    renderSavedSearches();
    updateTabCounts();
    applyProfil();
    showToast(`«${navn}» er slettet`, 'info');
  } catch (err) {
    showToast('Kunne ikke slette søket', 'error');
  }
};

// ── FAVORITTER ────────────────────────────────────────────────

function renderFavorites() {
  const container = document.getElementById('favs-grid');
  if (!container) return;

  if (favoritter.length === 0) {
    container.innerHTML = emptyStateHTML(
      'favs',
      'Ingen favoritter ennå',
      'Klikk på hjerte-ikonet på et objekt i søket for å lagre det her.',
      'Søk objekter', 'sok.html',
      'Tips: Bruk favoritter som en kortliste over objekter du aktivt vurderer.'
    );
    return;
  }

  const cards = favoritter.map(obj => {
    const stratBadge = obj.strategi === 'utleie'
      ? `<span class="badge badge-navy" style="font-size:10px">Utleie</span>`
      : `<span class="badge badge-gold" style="font-size:10px">Flipp</span>`;

    let metrics = '';
    if (obj.strategi === 'utleie') {
      const yKl = (obj.yieldEstimat||0) >= 5 ? 'pos' : (obj.yieldEstimat||0) >= 4 ? 'amb' : 'neg';
      const cfKl = (obj.kontantstroemEstimat||0) > 0 ? 'pos' : 'neg';
      metrics = `
        <div class="fav-metric"><div class="fav-metric-label">Yield</div><div class="fav-metric-value ${yKl}">${obj.yieldEstimat ? obj.yieldEstimat.toFixed(1).replace('.',',')+'%' : '—'}</div></div>
        <div class="fav-metric"><div class="fav-metric-label">Mnd. CF</div><div class="fav-metric-value ${cfKl}">${obj.kontantstroemEstimat ? (obj.kontantstroemEstimat>0?'+':'')+obj.kontantstroemEstimat.toLocaleString('no-NO')+' kr' : '—'}</div></div>
        <div class="fav-metric"><div class="fav-metric-label">Score</div><div class="fav-metric-value">${obj.investorScore||'—'}</div></div>`;
    } else {
      const rKl = (obj.flipROI||0) >= 20 ? 'pos' : (obj.flipROI||0) >= 12 ? 'amb' : 'neg';
      metrics = `
        <div class="fav-metric"><div class="fav-metric-label">ROI</div><div class="fav-metric-value ${rKl}">${obj.flipROI ? obj.flipROI.toFixed(1).replace('.',',')+'%' : '—'}</div></div>
        <div class="fav-metric"><div class="fav-metric-label">Fortjeneste</div><div class="fav-metric-value pos">${obj.bruttoFortjeneste ? (obj.bruttoFortjeneste/1000000).toFixed(1).replace('.',',')+' M' : '—'}</div></div>
        <div class="fav-metric"><div class="fav-metric-label">Score</div><div class="fav-metric-value">${obj.investorScore||'—'}</div></div>`;
    }

    const pris = obj.prisantydning
      ? (obj.prisantydning/1000000).toFixed(1).replace('.',',') + ' M'
      : '—';

    return `
      <a href="objekt.html?id=${obj.id}" class="fav-card">
        <div class="fav-card-img">
          <img src="${obj.bilder?.[0]||''}" alt="${obj.tittel}" loading="lazy">
          <div class="fav-card-img-badges">${stratBadge}</div>
        </div>
        <div class="fav-card-body">
          <h3 class="fav-card-title">${obj.tittel}</h3>
          <div class="fav-card-meta">
            <span>${obj.by}</span><span class="fav-card-sep"></span>
            <span>${obj.type}</span>
            ${obj.areal > 0 ? `<span class="fav-card-sep"></span><span>${obj.areal} m²</span>` : ''}
          </div>
          <div class="fav-card-metrics">${metrics}</div>
        </div>
        <div class="fav-card-footer">
          <div class="fav-card-price">${pris}</div>
          <button class="fav-remove-btn" onclick="removeFav(event,'${obj.id}')" aria-label="Fjern favoritt">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            Fjern
          </button>
        </div>
      </a>`;
  }).join('');

  container.innerHTML = `<div class="favorites-grid">${cards}</div>`;
}

window.removeFav = async function(e, id) {
  e.preventDefault();
  e.stopPropagation();
  try {
    const { fjernFavoritt } = await import('./supabase/favoritter.js');
    await fjernFavoritt(id);
    favoritter = favoritter.filter(o => o.id !== id);
    renderFavorites();
    updateTabCounts();
    showToast('Fjernet fra favoritter', 'info');
  } catch (err) {
    showToast('Kunne ikke fjerne favoritt', 'error');
  }
};

// ── EMPTY STATE ───────────────────────────────────────────────

function emptyStateHTML(type, title, text, ctaLabel, ctaHref, tip) {
  const icons = {
    soks: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>`,
    favs: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  };
  return `
    <div class="dash-empty">
      <div class="dash-empty-icon">${icons[type]||''}</div>
      <h3 class="dash-empty-title">${title}</h3>
      <p class="dash-empty-text">${text}</p>
      <a href="${ctaHref}" class="btn btn-primary">${ctaLabel}</a>
      <p class="dash-empty-tip">${tip}</p>
    </div>`;
}

function formaterDato(dato) {
  const d = new Date(dato);
  if (isNaN(d)) return dato || '—';
  return d.toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' });
}
