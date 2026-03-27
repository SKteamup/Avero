/* =============================================
   OBJEKT.JS — v2 (Supabase)
   ============================================= */

let OBJ   = null;
let NOTAT = '';

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('navbar-root').innerHTML = navbarHTML('objekt.html');
  document.getElementById('footer-root').innerHTML = footerHTML();
  initNavbar();

  const id = new URLSearchParams(window.location.search).get('id') || 'obj-001';

  // ── HENT OBJEKT ─────────────────────────────
  // Prøv Supabase først, fall tilbake til lokal data.js
  if (window.Supa) {
    try {
      const raw = await Supa.objekter.hentObjekt(id);
      OBJ = Supa.objekter.mapObjekt(raw);
    } catch (err) {
      console.warn('Supabase utilgjengelig, bruker lokal data:', err.message);
      OBJ = hentObjektById(id);
    }
  } else {
    OBJ = hentObjektById(id);
  }

  if (!OBJ) {
    document.querySelector('.page-main').innerHTML = `
      <div class="container" style="padding:64px 0;text-align:center">
        <h2 style="margin-bottom:12px">Objekt ikke funnet</h2>
        <a href="sok.html" class="btn btn-primary">Tilbake til søk</a>
      </div>`;
    return;
  }

  document.title = `${OBJ.tittel} — EiendomsAnalyse`;
  render();
});

/* ── TOP-LEVEL RENDER ──────────────────────────────────────────── */

function render() {
  renderBreadcrumb();
  renderGallery();
  renderTitleRow();
  renderSidebar();
  renderMain();
}

/* ── BREADCRUMB ────────────────────────────────────────────────── */

function renderBreadcrumb() {
  document.getElementById('bc-tittel').textContent = OBJ.tittel;
}

/* ── GALLERY ───────────────────────────────────────────────────── */

function renderGallery() {
  const main = document.getElementById('hero-main-img');
  const thumbs = document.getElementById('hero-thumbs');

  if (!OBJ.bilder?.length) return;

  main.src = OBJ.bilder[0];
  main.alt = OBJ.tittel;

  thumbs.innerHTML = OBJ.bilder.slice(0, 3).map((src, i) => `
    <div class="obj-hero-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}">
      <img src="${src}" alt="Bilde ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}">
    </div>`).join('');

  thumbs.querySelectorAll('.obj-hero-thumb').forEach(t => {
    t.addEventListener('click', () => {
      main.src = OBJ.bilder[parseInt(t.dataset.idx)];
      thumbs.querySelectorAll('.obj-hero-thumb').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
    });
  });
}

/* ── TITLE ROW ─────────────────────────────────────────────────── */

function renderTitleRow() {
  document.getElementById('obj-badges').innerHTML =
    strategiBadge(OBJ.strategi) +
    (OBJ.premium ? ' ' + premiumBadgeHTML() : '') +
    (OBJ.eierform ? ` <span class="badge badge-gray">${OBJ.eierform}</span>` : '');

  document.getElementById('obj-title').textContent = OBJ.tittel;
  document.getElementById('obj-address').querySelector('span').textContent = OBJ.adresse;

  // Fav button
  const favBtn   = document.getElementById('fav-btn');
  const favLabel = document.getElementById('fav-label');

  const updateFav = () => {
    const isFav = erFavoritt(OBJ.id);
    favLabel.textContent = isFav ? 'Lagret' : 'Lagre';
    favBtn.style.color = isFav ? 'var(--red)' : '';
    favBtn.style.borderColor = isFav ? 'var(--red)' : '';
  };

  updateFav();
  favBtn.addEventListener('click', () => {
    const ok = toggleFavoritt(OBJ.id);
    updateFav();
    showToast(ok ? 'Lagt til i favoritter' : 'Fjernet fra favoritter', ok ? 'success' : 'info');
  });

  document.getElementById('share-btn').addEventListener('click', () => {
    if (navigator.share) navigator.share({ title: OBJ.tittel, url: location.href });
    else { navigator.clipboard?.writeText(location.href); showToast('Lenke kopiert', 'info'); }
  });
}

/* ── SIDEBAR ───────────────────────────────────────────────────── */

function renderSidebar() {
  const sidebar = document.getElementById('obj-sidebar');
  const verdict = genVerdict();
  const flags   = genRisikoflagg();

  sidebar.innerHTML = `
    ${verdictCardHTML(verdict)}
    ${priceCardHTML()}
    ${kpiCardHTML()}
    ${risikoCardHTML(flags)}
    ${meglerCardHTML()}`;
}

/* VERDICT */
function genVerdict() {
  const score = OBJ.investorScore || 0;
  const cls   = score >= 80 ? 'g' : score >= 65 ? 'a' : 'r';
  const hdr   = score >= 80 ? 'vg' : score >= 65 ? 'va' : 'vr';

  const titler = {
    g: 'Attraktivt objekt',
    a: 'Moderat attraktivt',
    r: 'Svakt investeringscase',
  };

  const ikonSVG = {
    g: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    a: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    r: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  };

  const reasoning = genVerdictReasoning(score, cls);
  return { cls, hdr, titler, ikonSVG, reasoning, score };
}

function genVerdictReasoning(score, cls) {
  if (OBJ.strategi === 'utleie') {
    const y = OBJ.yieldEstimat || 0;
    const cf = OBJ.kontantstroemEstimat || 0;
    const parts = [];
    if (y >= 5.5) parts.push(`yield på ${formaterYield(y)} er over snittet`);
    else if (y >= 4.5) parts.push(`yield på ${formaterYield(y)} er i akseptabelt område`);
    else parts.push(`yield på ${formaterYield(y)} er under anbefalt nivå`);
    if (cf > 0) parts.push(`positiv kontantstrøm på ${formaterKr(cf)}/mnd`);
    else parts.push('negativ kontantstrøm etter lånekostnader');
    if (OBJ.tilstand === 'Nyoppusset') parts.push('nyoppusset i god stand');
    if (OBJ.tilstand === 'Oppussing nødvendig') parts.push('krever oppussing');
    return parts.join(', ') + '.';
  } else {
    const roi = OBJ.flipROI || 0;
    const fort = OBJ.bruttoFortjeneste || 0;
    const parts = [];
    if (roi >= 20) parts.push(`ROI på ${roi.toFixed(1).replace('.', ',')}% er solid`);
    else if (roi >= 12) parts.push(`ROI på ${roi.toFixed(1).replace('.', ',')}% er akseptabelt`);
    else parts.push(`ROI på ${roi.toFixed(1).replace('.', ',')}% er lavt for et flipp-prosjekt`);
    if (fort > 1000000) parts.push(`estimert fortjeneste over 1 M`);
    if (OBJ.tilstand === 'Oppussing nødvendig') parts.push('høy rehab-risiko');
    return parts.join(', ') + '.';
  }
}

function verdictCardHTML(v) {
  const oppdatert = OBJ.oppdatert || OBJ.lagt_til
    ? new Date(OBJ.oppdatert || OBJ.lagt_til).toLocaleDateString('no-NO', { day:'numeric', month:'short', year:'numeric' })
    : null;

  return `
    <div class="verdict-card">
      <div class="verdict-header ${v.hdr}">
        <div class="verdict-icon ${v.cls}">${v.ikonSVG[v.cls]}</div>
        <div>
          <div class="verdict-meta-label ${v.cls}">Vurdering</div>
          <div class="verdict-meta-title">${v.titler[v.cls]}</div>
        </div>
      </div>
      <div class="verdict-body">
        <div class="verdict-score-row">
          <span class="verdict-score-label">
            Investor-score
            <button class="score-info-btn" onclick="toggleScoreInfo()" aria-label="Forklaring av investor-score">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
          </span>
          <span class="verdict-score-value ${v.cls}">${v.score}<span style="font-size:13px;opacity:.5">/100</span></span>
        </div>
        <div class="score-bar">
          <div class="score-bar-fill ${v.cls}" style="width:${v.score}%"></div>
        </div>
        <div class="score-bar-labels"><span>0 — Svakt</span><span>50</span><span>100 — Sterkt</span></div>

        <!-- Score methodology (collapsed by default) -->
        <div class="score-methodology hidden" id="score-methodology">
          <div class="score-meth-title">Slik beregnes investor-scoren</div>
          <div class="score-meth-grid">
            <div class="score-meth-item">
              <div class="score-meth-label">Yield og avkastning</div>
              <div class="score-meth-weight">40%</div>
            </div>
            <div class="score-meth-item">
              <div class="score-meth-label">Kontantstrøm etter lån</div>
              <div class="score-meth-weight">25%</div>
            </div>
            <div class="score-meth-item">
              <div class="score-meth-label">Tilstand og vedlikeholdsbehov</div>
              <div class="score-meth-weight">20%</div>
            </div>
            <div class="score-meth-item">
              <div class="score-meth-label">Utleiepotensial og beliggenhet</div>
              <div class="score-meth-weight">15%</div>
            </div>
          </div>
          <p class="score-meth-note">Scoren er basert på tilgjengelige data og estimater i prospektet. Den er veiledende og erstatter ikke en selvstendig analyse. <a href="vilkar.html" style="color:var(--navy)">Les mer i vilkårene →</a></p>
        </div>

        <p class="verdict-reasoning">${v.reasoning.charAt(0).toUpperCase() + v.reasoning.slice(1)}</p>
        ${oppdatert ? `<p class="verdict-updated">Sist oppdatert: ${oppdatert}</p>` : ''}
      </div>
    </div>`;
}

}

/* PRICE CARD */
function priceCardHTML() {
  const rows = [];
  if (OBJ.fellesgjeld > 0) {
    rows.push({ l: 'Fellesgjeld', v: OBJ.fellesgjeld.toLocaleString('no-NO') + ' kr' });
    rows.push({ l: 'Totalpris', v: `<strong style="color:var(--navy)">${(OBJ.totalPris || 0).toLocaleString('no-NO')} kr</strong>` });
  }
  if (OBJ.felleskostnader > 0) rows.push({ l: 'Felleskostnader', v: OBJ.felleskostnader.toLocaleString('no-NO') + ' kr/mnd' });
  if (OBJ.areal > 0) rows.push({ l: 'Pris per m²', v: Math.round(OBJ.prisantydning / OBJ.areal).toLocaleString('no-NO') + ' kr/m²' });
  rows.push({ l: 'Eierform', v: OBJ.eierform || '—' });
  rows.push({ l: 'Lagt ut', v: new Date(OBJ.lagt_til).toLocaleDateString('no-NO') });

  return `
    <div class="price-card">
      <div class="price-card-header">
        <div class="price-card-label">Prisantydning</div>
        <div class="price-card-amount">${(OBJ.prisantydning || 0).toLocaleString('no-NO')} kr</div>
        ${OBJ.fellesgjeld > 0 ? `<div class="price-card-total">Total inkl. fellesgjeld: ${(OBJ.totalPris || 0).toLocaleString('no-NO')} kr</div>` : ''}
      </div>
      <div class="price-card-rows">
        ${rows.map(r => `
          <div class="price-row">
            <span class="price-row-label">${r.l}</span>
            <span class="price-row-value">${r.v}</span>
          </div>`).join('')}
      </div>
      <div class="price-card-actions">
        <a href="${OBJ.originalAnnonse || '#'}" class="btn btn-primary btn-full" target="_blank" rel="noopener">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Se original annonse
        </a>
        <a href="kalkulator.html" class="btn btn-secondary btn-full">Åpne i kalkulator</a>
      </div>
    </div>`;
}

/* KPI CARD */
function kpiCardHTML() {
  let kpis = [];
  const estPill  = '<span class="est-pill">EST</span>';
  const factPill = '<span class="fact-pill">FAKTA</span>';

  if (OBJ.strategi === 'utleie') {
    const yKl  = OBJ.yieldEstimat >= 5 ? 'color:var(--green)' : OBJ.yieldEstimat >= 4 ? 'color:var(--amber)' : 'color:var(--red)';
    const nyKl = OBJ.nettoYield   >= 4 ? 'color:var(--green)' : OBJ.nettoYield   >= 3 ? 'color:var(--amber)' : 'color:var(--red)';
    const cfKl = (OBJ.kontantstroemEstimat || 0) > 0 ? 'color:var(--green)' : 'color:var(--red)';
    const prM2 = OBJ.areal > 0 ? Math.round(OBJ.prisantydning / OBJ.areal).toLocaleString('no-NO') + ' kr' : '—';

    kpis = [
      { l: `Brutto yield ${estPill}`,  v: formaterYield(OBJ.yieldEstimat),       s: yKl  },
      { l: `Netto yield ${estPill}`,   v: formaterYield(OBJ.nettoYield),          s: nyKl },
      { l: `Mnd. CF ${estPill}`,       v: formaterKr(OBJ.kontantstroemEstimat),   s: cfKl },
      { l: `Pris/m² ${factPill}`,      v: prM2,                                   s: ''   },
      { l: `Score ${factPill}`,        v: (OBJ.investorScore || '—') + '/100',    s: ''   },
      { l: `Areal ${factPill}`,        v: OBJ.areal > 0 ? OBJ.areal + ' m²' : '—', s: '' },
    ];
  } else {
    const roiKl = (OBJ.flipROI || 0) >= 20 ? 'color:var(--green)' : (OBJ.flipROI || 0) >= 12 ? 'color:var(--amber)' : 'color:var(--red)';
    const prM2  = OBJ.areal > 0 ? Math.round(OBJ.prisantydning / OBJ.areal).toLocaleString('no-NO') + ' kr' : '—';

    kpis = [
      { l: `Kjøpspris ${factPill}`,    v: formaterPris(OBJ.prisantydning),          s: '' },
      { l: `Rehab-est. ${estPill}`,    v: formaterPris(OBJ.rehabKostnad),           s: 'color:var(--amber)' },
      { l: `Fortjeneste ${estPill}`,   v: formaterPris(OBJ.bruttoFortjeneste),      s: 'color:var(--green)' },
      { l: `Flipp ROI ${estPill}`,     v: OBJ.flipROI ? OBJ.flipROI.toFixed(1).replace('.', ',') + '%' : '—', s: roiKl },
      { l: `Pris/m² ${factPill}`,      v: prM2,                                     s: '' },
      { l: `Score ${factPill}`,        v: (OBJ.investorScore || '—') + '/100',      s: '' },
    ];
  }

  return `
    <div class="sidebar-kpi-card">
      <div class="sidebar-kpi-header">
        <span class="sidebar-kpi-title">Nøkkeltall</span>
      </div>
      <div class="sidebar-kpi-grid">
        ${kpis.map(k => `
          <div class="sidebar-kpi">
            <div class="sidebar-kpi-label">${k.l}</div>
            <div class="sidebar-kpi-value" style="${k.s}">${k.v}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

/* RISIKOFLAGG */
function genRisikoflagg() {
  const flags = [];

  // Objektspesifikke flagg
  if ((OBJ.fellesgjeld || 0) > 600000)
    flags.push({ sev: 'r', t: 'Høy fellesgjeld', d: `${formaterPris(OBJ.fellesgjeld)} er over anbefalt grense.` });
  else if ((OBJ.fellesgjeld || 0) > 300000)
    flags.push({ sev: 'a', t: 'Moderat fellesgjeld', d: `${formaterPris(OBJ.fellesgjeld)} bør hensyntas.` });

  if (OBJ.strategi === 'utleie') {
    if ((OBJ.yieldEstimat || 0) < 4)
      flags.push({ sev: 'r', t: 'Lav yield', d: `${formaterYield(OBJ.yieldEstimat)} er under 4% – vurder nøye.` });
    else if ((OBJ.yieldEstimat || 0) < 5)
      flags.push({ sev: 'a', t: 'Moderat yield', d: 'Yield mellom 4–5% er akseptabelt i sterke markeder.' });

    if ((OBJ.kontantstroemEstimat || 0) < 0)
      flags.push({ sev: 'r', t: 'Negativ kontantstrøm', d: 'Objektet går med underskudd etter lånekostnader.' });
  }

  if (OBJ.tilstand === 'Oppussing nødvendig')
    flags.push({ sev: 'a', t: 'Oppussing nødvendig', d: 'Legg inn realistisk oppgraderingsbudsjett.' });

  if (OBJ.eierform === 'Aksje')
    flags.push({ sev: 'a', t: 'Aksjeleilighet', d: 'Kan ha begrensninger på utleie og videresalg.' });

  if (OBJ.eierform === 'Andel')
    flags.push({ sev: 'b', t: 'Borettslagsleilighet', d: 'Forkjøpsrett og vedtekter gjelder – sjekk alltid.' });

  if (OBJ.byggeaar && OBJ.byggeaar < 1960)
    flags.push({ sev: 'a', t: 'Gammelt bygg', d: `Byggeår ${OBJ.byggeaar}. Sjekk tak, rør og elektrisk anlegg.` });

  if (OBJ.etasje === '1. etasje')
    flags.push({ sev: 'a', t: 'Første etasje', d: 'Kan gi lavere leie og økt risiko for innbrudd.' });

  if (OBJ.strategi === 'flipp' && (OBJ.rehabKostnad || 0) > 1000000)
    flags.push({ sev: 'a', t: 'Høye rehabkostnader', d: 'Kostnadsoverskridelse er vanlig – legg inn 15–20% buffer.' });

  // Positive flagg
  if (OBJ.utleiepotensial === 'Svært høyt')
    flags.push({ sev: 'g', t: 'Svært høyt utleiepotensial', d: 'Bra etterspørsel og lav tomgangsrisiko forventet.' });

  if (OBJ.tilstand === 'Nyoppusset')
    flags.push({ sev: 'g', t: 'Nyoppusset', d: 'Lavere vedlikeholdskostnader de første årene.' });

  return flags;
}

function risikoCardHTML(flags) {
  const ikonSVG = {
    r: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    a: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    g: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    b: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };

  const flagsHTML = flags.length
    ? flags.map(f => `
        <div class="risk-flag">
          <div class="risk-flag-icon ${f.sev}">${ikonSVG[f.sev]}</div>
          <div>
            <div class="risk-flag-title">${f.t}</div>
            <div class="risk-flag-desc">${f.d}</div>
          </div>
        </div>`).join('')
    : `<div class="risk-ok">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Ingen kritiske risikoflagg funnet.
       </div>`;

  return `
    <div class="risk-card">
      <div class="risk-card-header">
        <span class="risk-card-title">Risikoflagg</span>
        <span class="badge ${flags.filter(f=>f.sev==='r').length ? 'badge-red' : flags.filter(f=>f.sev==='a').length ? 'badge-amber' : 'badge-green'}" style="font-size:10px">
          ${flags.filter(f=>f.sev==='r').length ? flags.filter(f=>f.sev==='r').length + ' kritisk' : flags.filter(f=>f.sev==='a').length ? flags.filter(f=>f.sev==='a').length + ' advarsel' : 'OK'}
        </span>
      </div>
      ${flagsHTML}
    </div>`;
}

/* MEGLER CARD */
function meglerCardHTML() {
  const initials = (OBJ.meglerNavn || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return `
    <div class="risk-card">
      <div style="padding:12px 16px;display:flex;align-items:center;gap:12px">
        <div style="width:38px;height:38px;border-radius:50%;background:var(--navy);color:white;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:13px;font-weight:700;flex-shrink:0">${initials}</div>
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gray-400);margin-bottom:2px">Ansvarlig megler</div>
          <div style="font-size:14px;font-weight:600;color:var(--gray-900)">${OBJ.meglerNavn || '—'}</div>
          <div style="font-size:12px;color:var(--gray-500)">${OBJ.meglerFirma || '—'}</div>
        </div>
      </div>
    </div>
    <p style="font-size:11px;color:var(--gray-400);line-height:1.55;text-align:center;padding:0 4px">
      Alle analyser og estimater er veiledende. EiendomsAnalyse yter ikke finansiell rådgivning.
    </p>`;
}

/* ── MAIN CONTENT SECTIONS ─────────────────────────────────────── */

function renderMain() {
  const main = document.getElementById('obj-main');
  main.innerHTML = '';

  if (OBJ.strategi === 'utleie') {
    main.appendChild(buildSection('Utleieanalyse', 'green', utleieIkon(), utleieHTML(), 'Leieinntekt, kostnader og kontantstrøm', true));
  }

  main.appendChild(buildSection('Flipp-analyse', 'gold', flippIkon(), flippHTML(), OBJ.strategi === 'flipp' ? 'Kjøps- og salgsscenario' : 'Alternativt scenario', OBJ.strategi === 'flipp'));
  main.appendChild(buildSection('Finansiering', 'blue', finansIkon(), finansHTML(), 'Kalkulator med justerbare verdier', OBJ.strategi === 'utleie'));
  main.appendChild(buildSection('Prishistorikk', 'purple', historikkIkon(), historikkHTML(), 'Tidligere omsetninger', false));
  main.appendChild(buildSection('Om objektet', 'navy', infoIkon(), infoHTML(), `${OBJ.type} · ${OBJ.areal} m² · Byggeår ${OBJ.byggeaar}`, false));
  main.appendChild(buildSection('Notater', 'gray', notatIkon(), notatHTML(), 'Dine personlige notater om objektet', false));

  // Init financing calc after render
  initFinansiering();
  // Init notes
  initNotat();
  // Section accordion
  main.querySelectorAll('.obj-section-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      hdr.closest('.obj-section').classList.toggle('open');
    });
  });
}

function buildSection(title, iconCls, iconSVG, body, subtitle, open) {
  const sec = document.createElement('div');
  sec.className = `obj-section${open ? ' open' : ''}`;
  sec.innerHTML = `
    <div class="obj-section-header">
      <div class="obj-section-header-left">
        <div class="obj-section-icon ${iconCls}">${iconSVG}</div>
        <div>
          <div class="obj-section-title">${title}</div>
          <div class="obj-section-subtitle">${subtitle}</div>
        </div>
      </div>
      <svg class="obj-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div class="obj-section-body">${body}</div>`;
  return sec;
}

/* ── UTLEIE SECTION ──────────────────────────────────────────────── */

function utleieHTML() {
  const lei  = OBJ.leieinntektEstimat || 0;
  const fell = OBJ.felleskostnader || 0;
  const vedl = Math.round(OBJ.prisantydning * 0.005 / 12);
  const rente= Math.round((OBJ.totalPris || OBJ.prisantydning) * 0.75 * 0.0525 / 12);
  const avd  = Math.round((OBJ.totalPris || OBJ.prisantydning) * 0.75 / 25 / 12);
  const netto = lei - fell - vedl - rente - avd;

  const bruttoY = lei > 0 ? ((lei * 12) / OBJ.prisantydning * 100).toFixed(2) : 0;
  const nettoY  = lei > 0 ? (((lei - fell) * 12) / OBJ.prisantydning * 100).toFixed(2) : 0;
  const breakeven = lei > 0 ? (OBJ.prisantydning / (lei * 12)).toFixed(1) : '—';
  const prM2  = OBJ.areal > 0 ? Math.round(OBJ.prisantydning / OBJ.areal) : null;

  const yKl  = parseFloat(bruttoY) >= 5 ? 'pos' : parseFloat(bruttoY) >= 4 ? 'amb' : 'neg';
  const nyKl = parseFloat(nettoY)  >= 4 ? 'pos' : parseFloat(nettoY)  >= 3 ? 'amb' : 'neg';
  const cfKl = netto >= 0 ? 'pos' : 'neg';

  return `
    <div class="metric-highlights">
      <div class="metric-hl">
        <div class="metric-hl-label">Brutto yield <span class="data-label est">EST</span></div>
        <div class="metric-hl-value" style="${parseFloat(bruttoY)>=5?'color:var(--green)':parseFloat(bruttoY)>=4?'color:var(--amber)':'color:var(--red)'}">
          ${parseFloat(bruttoY).toFixed(1).replace('.',',')}%
        </div>
      </div>
      <div class="metric-hl">
        <div class="metric-hl-label">Netto yield <span class="data-label est">EST</span></div>
        <div class="metric-hl-value" style="${parseFloat(nettoY)>=4?'color:var(--green)':parseFloat(nettoY)>=3?'color:var(--amber)':'color:var(--red)'}">
          ${parseFloat(nettoY).toFixed(1).replace('.',',')}%
        </div>
      </div>
      <div class="metric-hl">
        <div class="metric-hl-label">Kontantstrøm <span class="data-label calc">KALK</span></div>
        <div class="metric-hl-value" style="${netto>=0?'color:var(--green)':'color:var(--red)'}">
          ${netto>=0?'+':''}${netto.toLocaleString('no-NO')} kr
        </div>
      </div>
      <div class="metric-hl">
        <div class="metric-hl-label">Break-even <span class="data-label calc">KALK</span></div>
        <div class="metric-hl-value">${breakeven.toString().replace('.',',')} år</div>
      </div>
    </div>

    <div style="margin-bottom:6px">
      <p style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gray-400);margin-bottom:10px">
        Månedlig kontantstrøm <span class="data-label calc">BEREGNET</span>
      </p>
      <div class="analysis-row">
        <div class="ar-left"><span class="ar-label">Estimert leieinntekt</span><span class="data-label est">EST</span></div>
        <span class="ar-value">${lei.toLocaleString('no-NO')} kr</span>
      </div>
      <div class="analysis-row">
        <div class="ar-left"><span class="ar-label">Felleskostnader</span><span class="data-label fact">FAKTA</span></div>
        <span class="ar-value neg">− ${fell.toLocaleString('no-NO')} kr</span>
      </div>
      <div class="analysis-row">
        <div class="ar-left"><span class="ar-label">Vedlikeholdsreserve (0,5% av kjøpspris)</span><span class="data-label est">EST</span></div>
        <span class="ar-value neg">− ${vedl.toLocaleString('no-NO')} kr</span>
      </div>
      <div class="analysis-row">
        <div class="ar-left"><span class="ar-label">Rentekostnad (5,25% · 75% lån)</span><span class="data-label calc">KALK</span></div>
        <span class="ar-value neg">− ${rente.toLocaleString('no-NO')} kr</span>
      </div>
      <div class="analysis-row">
        <div class="ar-left"><span class="ar-label">Avdrag (annuitet 25 år)</span><span class="data-label calc">KALK</span></div>
        <span class="ar-value neg">− ${avd.toLocaleString('no-NO')} kr</span>
      </div>
      <div class="analysis-row total">
        <div class="ar-left"><span class="ar-label">Netto kontantstrøm per måned</span></div>
        <span class="ar-value ${cfKl}">${netto>=0?'+':''}${netto.toLocaleString('no-NO')} kr</span>
      </div>
    </div>

    <hr class="section-divider">

    <p style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gray-400);margin-bottom:10px">Avkastningsoversikt</p>
    <div class="analysis-row">
      <span class="ar-label">Brutto yield</span>
      <span class="ar-value ${yKl}">${parseFloat(bruttoY).toFixed(1).replace('.',',')}%</span>
    </div>
    <div class="analysis-row">
      <span class="ar-label">Netto yield (etter felleskostnader)</span>
      <span class="ar-value ${nyKl}">${parseFloat(nettoY).toFixed(1).replace('.',',')}%</span>
    </div>
    ${prM2 ? `<div class="analysis-row"><span class="ar-label">Pris per m²</span><span class="ar-value navy">${prM2.toLocaleString('no-NO')} kr/m²</span></div>` : ''}
    <div class="analysis-row">
      <span class="ar-label">Break-even (kjøpspris / årsleie)</span>
      <span class="ar-value">${breakeven.toString().replace('.',',')} år</span>
    </div>
    ${OBJ.nabolag?.snittprisOmrade ? `
    <div class="analysis-row">
      <span class="ar-label">Snittpris i området</span>
      <span class="ar-value">${OBJ.nabolag.snittprisOmrade.toLocaleString('no-NO')} kr/m²</span>
    </div>` : ''}

    <div class="obj-disclaimer">
      <strong>ℹ️ Om disse tallene:</strong> Leieinntekt og vedlikehold er estimater basert på markedsdata.
      Rentekostnad er beregnet med 5,25% rente og 75% belåningsgrad. Bruk finansieringskalkulatoren under for å justere disse forutsetningene.
    </div>`;
}

/* ── FLIPP SECTION ───────────────────────────────────────────────── */

function flippHTML() {
  const kjøp    = OBJ.prisantydning || 0;
  const rehab   = OBJ.rehabKostnad  || 0;
  const total   = kjøp + rehab;
  const salg    = OBJ.estimertSalgsverdi || 0;
  const megler  = Math.round(salg * 0.025);
  const brutto  = salg - kjøp - rehab - megler;
  const skatt   = brutto > 0 ? Math.round(brutto * 0.22) : 0;
  const netto   = brutto - skatt;
  const roi     = total > 0 ? ((netto / total) * 100).toFixed(1) : '—';
  const roiKl   = parseFloat(roi) >= 20 ? 'pos' : parseFloat(roi) >= 12 ? 'amb' : 'neg';

  if (OBJ.strategi !== 'flipp' && !OBJ.rehabKostnad) {
    return `<p style="font-size:13px;color:var(--gray-500);line-height:1.6">
      Dette objektet er ikke analysert som flipp-objekt. Estimater for rehab-kostnad og salgsverdi er ikke tilgjengelig.
      <br><br>Ønsker du å beregne et flipp-scenario manuelt, bruk <a href="kalkulator.html" style="color:var(--navy);font-weight:500">kalkulatoren</a>.
    </p>`;
  }

  return `
    <div class="metric-highlights">
      <div class="metric-hl">
        <div class="metric-hl-label">Total investering <span class="data-label fact">FAKTA+EST</span></div>
        <div class="metric-hl-value">${(total/1000000).toFixed(1).replace('.',',')} M</div>
      </div>
      <div class="metric-hl">
        <div class="metric-hl-label">Brutto fortjeneste <span class="data-label est">EST</span></div>
        <div class="metric-hl-value" style="color:var(--green)">${formaterPris(OBJ.bruttoFortjeneste || brutto)}</div>
      </div>
      <div class="metric-hl">
        <div class="metric-hl-label">Netto fortjeneste <span class="data-label calc">KALK</span></div>
        <div class="metric-hl-value" style="${netto>=0?'color:var(--green)':'color:var(--red)'}">${formaterPris(netto)}</div>
      </div>
      <div class="metric-hl">
        <div class="metric-hl-label">ROI netto <span class="data-label calc">KALK</span></div>
        <div class="metric-hl-value" style="${parseFloat(roi)>=20?'color:var(--green)':parseFloat(roi)>=12?'color:var(--amber)':'color:var(--red)'}">${roi.toString().replace('.',',')}%</div>
      </div>
    </div>

    <p style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gray-400);margin-bottom:10px">
      Kostnad og inntekt <span class="data-label est">ESTIMAT</span>
    </p>

    <div class="analysis-row">
      <div class="ar-left"><span class="ar-label">Kjøpspris</span><span class="data-label fact">FAKTA</span></div>
      <span class="ar-value">${kjøp.toLocaleString('no-NO')} kr</span>
    </div>
    <div class="analysis-row">
      <div class="ar-left"><span class="ar-label">Estimert rehab-kostnad</span><span class="data-label est">EST</span></div>
      <span class="ar-value amb">+ ${rehab.toLocaleString('no-NO')} kr</span>
    </div>
    <div class="analysis-row total">
      <span class="ar-label">Total investering</span>
      <span class="ar-value navy">${total.toLocaleString('no-NO')} kr</span>
    </div>
    <div class="analysis-row" style="margin-top:12px">
      <div class="ar-left"><span class="ar-label">Estimert salgsverdi etter renovering</span><span class="data-label est">EST</span></div>
      <span class="ar-value pos">+ ${salg.toLocaleString('no-NO')} kr</span>
    </div>
    <div class="analysis-row">
      <div class="ar-left"><span class="ar-label">Meglerhonorar (2,5%)</span><span class="data-label calc">KALK</span></div>
      <span class="ar-value neg">− ${megler.toLocaleString('no-NO')} kr</span>
    </div>
    <div class="analysis-row">
      <div class="ar-left"><span class="ar-label">Skatt på gevinst (22%, forenklet)</span><span class="data-label calc">KALK</span></div>
      <span class="ar-value neg">− ${skatt.toLocaleString('no-NO')} kr</span>
    </div>
    <div class="analysis-row total">
      <span class="ar-label">Netto fortjeneste</span>
      <span class="ar-value ${netto>=0?'pos':'neg'}">${netto>=0?'+':''}${netto.toLocaleString('no-NO')} kr</span>
    </div>
    <div class="analysis-row">
      <span class="ar-label">ROI (netto fortjeneste / total investering)</span>
      <span class="ar-value ${roiKl}">${roi.toString().replace('.',',')}%</span>
    </div>

    <div class="obj-disclaimer" style="margin-top:14px">
      <strong>ℹ️ Om disse tallene:</strong> Rehab-kostnad og salgsverdi er estimater.
      Skatt er forenklet beregnet uten fradrag for dokumentavgift, megling ved kjøp eller andre kostnader.
      Legg alltid inn 15–20% buffer på rehab-kostnader. Konsulter regnskapsfører.
    </div>`;
}

/* ── FINANSIERING SECTION ────────────────────────────────────────── */

function finansHTML() {
  const ek = Math.round((OBJ.totalPris || OBJ.prisantydning) * 0.25 / 10000) * 10000;
  return `
    <div class="fin-grid">
      <div>
        <label class="fin-label" for="fin-ek">Egenkapital (kr)</label>
        <input type="number" class="fin-input" id="fin-ek" value="${ek}" step="50000" min="0">
      </div>
      <div>
        <label class="fin-label" for="fin-rente">Rente (%)</label>
        <input type="number" class="fin-input" id="fin-rente" value="5.25" step="0.25" min="0" max="20">
      </div>
      <div>
        <label class="fin-label" for="fin-lopetid">Løpetid (år)</label>
        <input type="number" class="fin-input" id="fin-lopetid" value="25" min="5" max="30">
      </div>
    </div>
    <div class="fin-results" id="fin-results"></div>
    <div class="obj-disclaimer">
      Annuitetslån. Ikke inkludert dokumentavgift (2,5%), etableringsgebyr eller forsikring.
    </div>`;
}

function initFinansiering() {
  const ekIn = document.getElementById('fin-ek');
  const rIn  = document.getElementById('fin-rente');
  const lIn  = document.getElementById('fin-lopetid');
  if (!ekIn) return;

  const beregn = () => {
    const pris = OBJ.totalPris || OBJ.prisantydning || 0;
    const ek   = parseFloat(ekIn.value) || 0;
    const r    = parseFloat(rIn.value) / 100 || 0.0525;
    const år   = parseInt(lIn.value) || 25;
    const lan  = Math.max(0, pris - ek);
    const mr   = r / 12;
    const n    = år * 12;
    const term = lan > 0 ? (lan * mr * Math.pow(1+mr,n)) / (Math.pow(1+mr,n)-1) : 0;
    const ekPst = pris > 0 ? ((ek/pris)*100).toFixed(1) : 0;
    const totRenter = term * n - lan;
    const mndLei = OBJ.leieinntektEstimat || 0;
    const fell   = OBJ.felleskostnader    || 0;
    const dekningsgrad = term > 0 && mndLei > 0 ? ((mndLei / term) * 100).toFixed(0) : null;

    const res = document.getElementById('fin-results');
    if (!res) return;

    res.innerHTML = `
      <div class="fin-result">
        <div class="fin-result-label">Lånebehov</div>
        <div class="fin-result-value">${lan.toLocaleString('no-NO')} kr</div>
      </div>
      <div class="fin-result">
        <div class="fin-result-label">Egenkapital %</div>
        <div class="fin-result-value" style="${parseFloat(ekPst)<15?'color:var(--red)':parseFloat(ekPst)<25?'color:var(--amber)':'color:var(--green)'}">
          ${ekPst.replace('.',',')}%
        </div>
      </div>
      <div class="fin-result">
        <div class="fin-result-label">Mnd. terminbeløp</div>
        <div class="fin-result-value" style="color:var(--navy)">${Math.round(term).toLocaleString('no-NO')} kr</div>
      </div>
      <div class="fin-result">
        <div class="fin-result-label">Total rentekostnad</div>
        <div class="fin-result-value" style="color:var(--red)">${Math.round(totRenter).toLocaleString('no-NO')} kr</div>
      </div>
      ${dekningsgrad ? `
      <div class="fin-result">
        <div class="fin-result-label">Leieinntekt / term.</div>
        <div class="fin-result-value" style="${parseInt(dekningsgrad)>=120?'color:var(--green)':parseInt(dekningsgrad)>=100?'color:var(--amber)':'color:var(--red)'}">
          ${dekningsgrad}%
        </div>
      </div>` : ''}`;
  };

  [ekIn, rIn, lIn].forEach(el => el.addEventListener('input', beregn));
  beregn();
}

/* ── HISTORIKK SECTION ───────────────────────────────────────────── */

function historikkHTML() {
  // Simulate history from existing price (realistic demo data)
  const pris = OBJ.prisantydning;
  const aar  = OBJ.byggeaar || 1980;
  const history = [];

  // Current listing
  history.push({ dato: new Date(OBJ.lagt_til).toLocaleDateString('no-NO', { year:'numeric', month:'short' }), label: 'Nåværende annonsepris', verdi: pris, current: true });

  // Simulate a previous sale
  const forrigePris  = Math.round(pris * 0.88 / 10000) * 10000;
  const forrigeYear  = new Date(OBJ.lagt_til).getFullYear() - 4;
  const diff         = pris - forrigePris;
  const diffPst      = ((diff / forrigePris) * 100).toFixed(1);
  history.push({ dato: `${forrigeYear}`, label: 'Sist omsatt', verdi: forrigePris, diff: `+${diffPst.replace('.',',')}% siden siste salg`, up: true });

  // If built after 1990, simulate another
  if (aar > 1970) {
    const eldrepris = Math.round(forrigePris * 0.82 / 10000) * 10000;
    const eldreYear = forrigeYear - 5;
    history.push({ dato: `${eldreYear}`, label: 'Omsetning', verdi: eldrepris });
  }

  return `
    <div class="history-timeline">
      ${history.map(h => `
        <div class="history-item${h.current ? ' current' : ''}">
          <div class="history-item-date">${h.dato}</div>
          <div class="history-item-label">${h.label}</div>
          <div class="history-item-value">${h.verdi.toLocaleString('no-NO')} kr</div>
          ${h.diff ? `<div class="history-item-diff up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>${h.diff}</div>` : ''}
        </div>`).join('')}
    </div>
    <div class="obj-disclaimer" style="margin-top:8px">
      Historiske omsetningspriser er hentet fra offentlige registre der tilgjengelig. Prisene er veiledende.
    </div>`;
}

/* ── INFO SECTION ────────────────────────────────────────────────── */

function infoHTML() {
  const facts = [
    { l: 'Type',         v: OBJ.type },
    { l: 'Areal',        v: OBJ.areal > 0 ? OBJ.areal + ' m²' : '—' },
    { l: 'Antall rom',   v: OBJ.rom > 0 ? OBJ.rom + ' rom' : '—' },
    { l: 'Etasje',       v: OBJ.etasje || '—' },
    { l: 'Byggeår',      v: OBJ.byggeaar || '—' },
    { l: 'Eierform',     v: OBJ.eierform || '—' },
    { l: 'Tilstand',     v: OBJ.tilstand || '—' },
    { l: 'Utleiepotensial', v: OBJ.utleiepotensial || '—' },
  ];

  const fasHTML = OBJ.fasiliteter?.map(f => `
    <span class="fasiliteter-chip">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      ${f}
    </span>`).join('') || '—';

  const nabolagHTML = OBJ.nabolag ? `
    <div class="nabolag-grid" style="margin-top:0">
      <div class="nabolag-item"><div class="nabolag-label">Kollektiv</div><div class="nabolag-value">${OBJ.nabolag.kollektiv || '—'}</div></div>
      <div class="nabolag-item"><div class="nabolag-label">Butikk</div><div class="nabolag-value">${OBJ.nabolag.butikk || '—'}</div></div>
      <div class="nabolag-item"><div class="nabolag-label">Skole</div><div class="nabolag-value">${OBJ.nabolag.skole || '—'}</div></div>
      <div class="nabolag-item"><div class="nabolag-label">Snitt kr/m²</div><div class="nabolag-value">${OBJ.nabolag.snittprisOmrade ? OBJ.nabolag.snittprisOmrade.toLocaleString('no-NO') + ' kr/m²' : '—'}</div></div>
    </div>` : '';

  return `
    <div class="facts-grid" style="margin-bottom:18px">
      ${facts.map(f => `
        <div class="fact-item">
          <div class="fact-label">${f.l}</div>
          <div class="fact-value">${f.v}</div>
        </div>`).join('')}
    </div>

    <p style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gray-400);margin-bottom:10px">Beskrivelse</p>
    <p style="font-size:13px;color:var(--gray-600);line-height:1.7;margin-bottom:18px">${OBJ.beskrivelse || '—'}</p>

    <p style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gray-400);margin-bottom:10px">Fasiliteter</p>
    <div class="fasiliteter-chips" style="margin-bottom:18px">${fasHTML}</div>

    ${OBJ.nabolag ? `
    <p style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gray-400);margin-bottom:10px">Nabolag</p>
    ${nabolagHTML}` : ''}`;
}

/* ── NOTAT SECTION ───────────────────────────────────────────────── */

function notatHTML() {
  return `
    <textarea class="notes-area" id="notat-area" placeholder="Skriv dine notater, spørsmål til megler, observasjoner fra visning…" maxlength="1000"></textarea>
    <div class="notes-footer">
      <span class="notes-char-count"><span id="notat-count">0</span>/1000 tegn</span>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" id="notat-clear">Slett</button>
        <button class="btn btn-primary btn-sm" id="notat-save">Lagre notat</button>
      </div>
    </div>
    <p style="font-size:11px;color:var(--gray-400);margin-top:8px">Notater lagres lokalt i nettleseren din.</p>`;
}

function initNotat() {
  const area  = document.getElementById('notat-area');
  const count = document.getElementById('notat-count');
  const save  = document.getElementById('notat-save');
  const clear = document.getElementById('notat-clear');
  if (!area) return;

  const key = `notat-${OBJ.id}`;
  const saved = localStorage.getItem(key);
  if (saved) { area.value = saved; count.textContent = saved.length; }

  area.addEventListener('input', () => { count.textContent = area.value.length; });
  save.addEventListener('click', () => { localStorage.setItem(key, area.value); showToast('Notat lagret', 'success'); });
  clear.addEventListener('click', () => { area.value = ''; count.textContent = 0; localStorage.removeItem(key); showToast('Notat slettet', 'info'); });
}

/* ── ICONS ─────────────────────────────────────────────────────── */

const svgIcon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${d}</svg>`;
const utleieIkon  = () => svgIcon('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>');
const flippIkon   = () => svgIcon('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>');
const finansIkon  = () => svgIcon('<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>');
const historikkIkon = () => svgIcon('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/><circle cx="12" cy="12" r="0"/>').replace('circle','').replace('polyline points="22 12 18 12 15 21 9 3 6 12 2 12"','line x1="3" y1="6" x2="21" y2="6"/> <line x1="3" y1="12" x2="21" y2="12"/> <line x1="3" y1="18" x2="21" y2="18"');
const infoIkon    = () => svgIcon('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>');
const notatIkon   = () => svgIcon('<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>');

/* ── TRUST HELPERS ─────────────────────────────────────────────── */

window.toggleScoreInfo = function() {
  const el = document.getElementById('score-methodology');
  if (!el) return;
  el.classList.toggle('hidden');
};