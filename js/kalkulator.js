/* =============================================
   KALKULATOR.JS — v2
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('navbar-root').innerHTML = navbarHTML('kalkulator.html');
  document.getElementById('footer-root').innerHTML = footerHTML();
  initNavbar();

  initTabs();
  initUtleie();
  initFlipp();
});

/* ── TABS ─────────────────────────────────────── */

function initTabs() {
  const tabU = document.getElementById('tab-utleie');
  const tabF = document.getElementById('tab-flipp');
  const panU = document.getElementById('panel-utleie');
  const panF = document.getElementById('panel-flipp');

  tabU.addEventListener('click', () => {
    tabU.classList.add('active');    tabU.setAttribute('aria-selected', 'true');
    tabF.classList.remove('active'); tabF.setAttribute('aria-selected', 'false');
    panU.classList.add('active');
    panF.classList.remove('active');
  });

  tabF.addEventListener('click', () => {
    tabF.classList.add('active');    tabF.setAttribute('aria-selected', 'true');
    tabU.classList.remove('active'); tabU.setAttribute('aria-selected', 'false');
    panF.classList.add('active');
    panU.classList.remove('active');
  });
}

/* ══════════════════════════════════════════════
   UTLEIE KALKULATOR
══════════════════════════════════════════════ */

const U_DEFAULTS = {
  kjopspris: 4200000, fellesgjeld: 420000, dok: 0,
  egenkapital: 1050000, rente: 5.25, lopetid: 25,
  leie: 14500, felleskost: 2800, vedl: 1750, ledig: 5,
};

function initUtleie() {
  const sliderId = 'u-ledig';
  const sliderVal = document.getElementById('u-ledig-val');
  const sliderEl  = document.getElementById(sliderId);
  sliderEl?.addEventListener('input', () => {
    sliderVal.textContent = sliderEl.value + '%';
    beregnUtleie();
  });

  const ids = ['u-kjopspris','u-fellesgjeld','u-dok','u-egenkapital','u-rente','u-lopetid','u-leie','u-felleskost','u-vedl'];
  ids.forEach(id => document.getElementById(id)?.addEventListener('input', beregnUtleie));

  ['u-kjopspris','u-egenkapital'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateEkPst);
  });

  document.getElementById('u-reset')?.addEventListener('click', () => {
    Object.entries(U_DEFAULTS).forEach(([k, v]) => {
      const el = document.getElementById('u-' + k);
      if (el) el.value = v;
    });
    sliderEl.value = U_DEFAULTS.ledig;
    sliderVal.textContent = U_DEFAULTS.ledig + '%';
    beregnUtleie();
    updateEkPst();
    showToast('Utleiekalkulator nullstilt', 'info');
  });

  beregnUtleie();
  updateEkPst();
}

function updateEkPst() {
  const kjop = parseFloat(document.getElementById('u-kjopspris')?.value) || 0;
  const ek   = parseFloat(document.getElementById('u-egenkapital')?.value) || 0;
  const pst  = kjop > 0 ? ((ek / kjop) * 100).toFixed(1) : 0;
  const el   = document.getElementById('u-ek-pst');
  if (el) el.textContent = pst.replace('.', ',') + '%';
}

function beregnUtleie() {
  const g = id => parseFloat(document.getElementById(id)?.value) || 0;

  const kjop     = g('u-kjopspris');
  const fell     = g('u-fellesgjeld');
  const dok      = g('u-dok');
  const ek       = g('u-egenkapital');
  const rente    = g('u-rente') / 100;
  const aar      = parseInt(document.getElementById('u-lopetid')?.value) || 25;
  const leie     = g('u-leie');
  const fellkost = g('u-felleskost');
  const vedl     = g('u-vedl');
  const ledigPct = (parseFloat(document.getElementById('u-ledig')?.value) || 0) / 100;

  const totalKjop = kjop + fell + dok;
  const lan       = Math.max(0, kjop + fell - ek);
  const ekPst     = kjop > 0 ? (ek / kjop) * 100 : 0;

  const mr   = rente / 12;
  const n    = aar * 12;
  const term = lan > 0 && mr > 0
    ? (lan * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1)
    : lan / n;

  const leieMnd = leie * (1 - ledigPct);
  const leieAar = leieMnd * 12;

  const bruttoYield = kjop > 0 ? (leie * 12 / kjop) * 100 : 0;
  const nettoYield  = kjop > 0 ? ((leie - fellkost) * 12 / kjop) * 100 : 0;

  const cfMnd = leieMnd - fellkost - vedl - term;
  const cfAar = cfMnd * 12;

  const verdict = utleieVerdict(bruttoYield, nettoYield, cfMnd, ekPst);

  renderUtleieResults({ kjop, fell, dok, ek, lan, ekPst, term, leieMnd, leieAar, fellkost, vedl, bruttoYield, nettoYield, cfMnd, cfAar, verdict, rente, aar, totalKjop });
}

function utleieVerdict(bruttoY, nettoY, cf, ekPst) {
  const score = (
    (bruttoY >= 6 ? 3 : bruttoY >= 5 ? 2 : bruttoY >= 4 ? 1 : 0) +
    (cf > 2000 ? 3 : cf > 0 ? 2 : cf > -1000 ? 1 : 0) +
    (ekPst >= 25 ? 2 : ekPst >= 15 ? 1 : 0)
  );

  if (score >= 6) return {
    cls: 'g', hdr: 'vg',
    label: 'Attraktivt objekt',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    text: `Brutto yield på ${fmtY(bruttoY)} er over snittet, og kontantstrømmen er positiv selv etter lånekostnader. Dette ser lovende ut for langsiktig utleie.`,
  };
  if (score >= 3) return {
    cls: 'a', hdr: 'va',
    label: 'Moderat attraktivt',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>`,
    text: `Yield og kontantstrøm er akseptabelt, men ikke eksepsjonelt. Vurder om leiepotensial kan optimaliseres, eller om du kan forhandle ned prisen.`,
  };
  return {
    cls: 'r', hdr: 'vr',
    label: 'Svakt investeringscase',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    text: `Lavt yield eller negativ kontantstrøm gjør dette til et krevende utleieobjekt. Sjekk om prisen er forhandlingsbar, eller om leieinntekten kan økes vesentlig.`,
  };
}

function renderUtleieResults(d) {
  const container = document.getElementById('u-results');
  if (!container) return;

  const v = d.verdict;
  const cfCls  = d.cfMnd >= 0 ? 'pos' : 'neg';
  const yCls   = d.bruttoYield >= 5 ? 'pos' : d.bruttoYield >= 4 ? 'amb' : 'neg';
  const nyCls  = d.nettoYield >= 4 ? 'pos' : d.nettoYield >= 3 ? 'amb' : 'neg';
  const ekCls  = d.ekPst >= 25 ? 'pos' : d.ekPst >= 15 ? 'amb' : 'neg';

  const breakeven = d.leieAar > 0 ? (d.kjop / d.leieAar).toFixed(1) : '—';

  const totalCosts = d.fellkost + d.vedl + d.term;
  const maxBar = Math.max(d.leieMnd, totalCosts);
  const pct = v => maxBar > 0 ? Math.min(100, (v / maxBar) * 100) : 0;

  container.innerHTML = `
    <div class="kalk-verdict">
      <div class="kalk-verdict-header ${v.hdr}">
        <div class="kalk-verdict-icon ${v.cls}">${v.icon}</div>
        <div>
          <div class="kalk-verdict-label ${v.cls}">Vurdering</div>
          <div class="kalk-verdict-title">${v.label}</div>
        </div>
      </div>
      <div class="kalk-verdict-body">${v.text}</div>
    </div>

    <div class="kalk-kpis">
      <div class="kalk-kpi">
        <div class="kalk-kpi-label">Brutto yield</div>
        <div class="kalk-kpi-value ${yCls}">${fmtY(d.bruttoYield)}</div>
        <div class="kalk-kpi-sub">Leie × 12 / kjøpspris</div>
      </div>
      <div class="kalk-kpi">
        <div class="kalk-kpi-label">Netto yield</div>
        <div class="kalk-kpi-value ${nyCls}">${fmtY(d.nettoYield)}</div>
        <div class="kalk-kpi-sub">Etter felleskostnader</div>
      </div>
      <div class="kalk-kpi">
        <div class="kalk-kpi-label">Mnd. kontantstrøm</div>
        <div class="kalk-kpi-value ${cfCls}">${fmtKr(Math.round(d.cfMnd))}</div>
        <div class="kalk-kpi-sub">Etter alle kostnader</div>
      </div>
      <div class="kalk-kpi">
        <div class="kalk-kpi-label">Break-even</div>
        <div class="kalk-kpi-value">${breakeven.replace('.', ',')} år</div>
        <div class="kalk-kpi-sub">Kjøpspris / årsleie</div>
      </div>
    </div>

    <div class="kalk-breakdown">
      <div class="kalk-breakdown-header">Månedlig kontantstrøm</div>
      <div class="kalk-breakdown-rows">
        <div class="kalk-row">
          <span class="kalk-row-label"><span class="kalk-row-dot" style="background:#16a34a"></span>Leie (justert for ledighet)</span>
          <span class="kalk-row-val pos">+ ${Math.round(d.leieMnd).toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row">
          <span class="kalk-row-label"><span class="kalk-row-dot" style="background:#dc2626"></span>Felleskostnader</span>
          <span class="kalk-row-val neg">− ${d.fellkost.toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row">
          <span class="kalk-row-label"><span class="kalk-row-dot" style="background:#d97706"></span>Vedlikehold (est.)</span>
          <span class="kalk-row-val neg">− ${d.vedl.toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row">
          <span class="kalk-row-label"><span class="kalk-row-dot" style="background:#6b7280"></span>Terminbeløp (renter + avdrag)</span>
          <span class="kalk-row-val neg">− ${Math.round(d.term).toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row total">
          <span class="kalk-row-label">Netto per måned</span>
          <span class="kalk-row-val ${cfCls}">${d.cfMnd >= 0 ? '+' : ''}${Math.round(d.cfMnd).toLocaleString('no-NO')} kr</span>
        </div>
      </div>
    </div>

    <div class="kalk-bar-chart">
      <div class="kalk-bar-chart-title">Kostnadsfordeling / måned</div>
      ${[
        { l: 'Leieinntekt', v: Math.round(d.leieMnd), col: '#16a34a' },
        { l: 'Terminbeløp', v: Math.round(d.term),    col: '#374151' },
        { l: 'Felleskostnader', v: d.fellkost,         col: '#dc2626' },
        { l: 'Vedlikehold',    v: d.vedl,              col: '#d97706' },
      ].map(row => `
        <div class="kalk-bar-row">
          <span class="kalk-bar-row-label">${row.l}</span>
          <div class="kalk-bar-track">
            <div class="kalk-bar-fill" style="width:${pct(row.v)}%;background:${row.col}"></div>
          </div>
          <span class="kalk-bar-row-val">${row.v.toLocaleString('no-NO')} kr</span>
        </div>`).join('')}
    </div>

    <div class="kalk-breakdown">
      <div class="kalk-breakdown-header">Finansieringsdetaljer</div>
      <div class="kalk-breakdown-rows">
        <div class="kalk-row">
          <span class="kalk-row-label">Total kjøpskostnad</span>
          <span class="kalk-row-val">${d.totalKjop.toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row">
          <span class="kalk-row-label">Lånebehov</span>
          <span class="kalk-row-val">${d.lan.toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row">
          <span class="kalk-row-label">Egenkapital %</span>
          <span class="kalk-row-val ${ekCls}">${d.ekPst.toFixed(1).replace('.', ',')}%</span>
        </div>
        <div class="kalk-row">
          <span class="kalk-row-label">Rente / løpetid</span>
          <span class="kalk-row-val mute">${(d.rente*100).toFixed(2).replace('.',',')}% / ${d.aar} år</span>
        </div>
        <div class="kalk-row">
          <span class="kalk-row-label">Årlig netto kontantstrøm</span>
          <span class="kalk-row-val ${cfCls}">${Math.round(d.cfAar).toLocaleString('no-NO')} kr</span>
        </div>
      </div>
    </div>

    <div class="kalk-disclaimer">
      <strong>Om beregningene:</strong> Kontantstrøm er beregnet etter annuitetslån (renter + avdrag). Skatt på leieinntekt er <em>ikke</em> inkludert. Alle resultater er estimater og utgjør ikke finansiell rådgivning.
    </div>`;
}

/* ══════════════════════════════════════════════
   FLIPP KALKULATOR
══════════════════════════════════════════════ */

const F_DEFAULTS = {
  kjopspris: 6800000, dokavgift: 170000, meglerkjop: 0,
  rehab: 850000, buffer: 15, finansk: 120000, diverse: 30000,
  salgspris: 8900000, meglersalg: 222500, skatt: 22,
};

function initFlipp() {
  const bufSlider = document.getElementById('f-buffer');
  const bufVal    = document.getElementById('f-buf-val');
  bufSlider?.addEventListener('input', () => {
    bufVal.textContent = bufSlider.value + '%';
    beregnFlipp();
  });

  document.getElementById('f-kjopspris')?.addEventListener('input', () => {
    const kjop = parseFloat(document.getElementById('f-kjopspris').value) || 0;
    const dokEl = document.getElementById('f-dokavgift');
    const expected = Math.round(kjop * 0.025 / 1000) * 1000;
    dokEl.value = expected;
    const salgEl = document.getElementById('f-salgspris');
    const megEl  = document.getElementById('f-meglersalg');
    if (salgEl && megEl) megEl.value = Math.round(parseFloat(salgEl.value || 0) * 0.025 / 1000) * 1000;
    beregnFlipp();
  });

  document.getElementById('f-salgspris')?.addEventListener('input', () => {
    const salg = parseFloat(document.getElementById('f-salgspris').value) || 0;
    document.getElementById('f-meglersalg').value = Math.round(salg * 0.025 / 1000) * 1000;
    beregnFlipp();
  });

  const ids = ['f-kjopspris','f-dokavgift','f-meglerkjop','f-rehab','f-finansk','f-diverse','f-salgspris','f-meglersalg','f-skatt'];
  ids.forEach(id => document.getElementById(id)?.addEventListener('input', beregnFlipp));

  document.getElementById('f-reset')?.addEventListener('click', () => {
    Object.entries(F_DEFAULTS).forEach(([k, v]) => {
      const el = document.getElementById('f-' + k);
      if (el) el.value = v;
    });
    bufSlider.value = F_DEFAULTS.buffer;
    bufVal.textContent = F_DEFAULTS.buffer + '%';
    beregnFlipp();
    showToast('Flipp-kalkulator nullstilt', 'info');
  });

  beregnFlipp();
}

function beregnFlipp() {
  const g = id => parseFloat(document.getElementById(id)?.value) || 0;

  const kjop      = g('f-kjopspris');
  const dok       = g('f-dokavgift');
  const megKjop   = g('f-meglerkjop');
  const rehab     = g('f-rehab');
  const bufPct    = (parseFloat(document.getElementById('f-buffer')?.value) || 0) / 100;
  const finansk   = g('f-finansk');
  const diverse   = g('f-diverse');
  const salgspris = g('f-salgspris');
  const megSalg   = g('f-meglersalg');
  const skattPct  = g('f-skatt') / 100;

  const bufferKr    = Math.round(rehab * bufPct);
  const rehabTotal  = rehab + bufferKr;
  const totalKostnad = kjop + dok + megKjop + rehabTotal + finansk + diverse;
  const gevinst      = salgspris - totalKostnad - megSalg;
  const skattKr      = gevinst > 0 ? Math.round(gevinst * skattPct) : 0;
  const nettoGevinst = gevinst - skattKr;
  const roi          = totalKostnad > 0 ? (nettoGevinst / totalKostnad) * 100 : 0;

  const verdict = flippVerdict(roi, nettoGevinst, gevinst);

  renderFlippResults({ kjop, dok, megKjop, rehab, bufferKr, rehabTotal, finansk, diverse, totalKostnad, salgspris, megSalg, gevinst, skattKr, nettoGevinst, roi, verdict });
}

function flippVerdict(roi, netto, brutto) {
  if (netto <= 0) return {
    cls: 'r', hdr: 'vr',
    label: 'Taper penger',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    text: `Med disse tallene ender du opp med tap. Rehab-kostnader, omsetningskostnader eller prisdifferansen stemmer ikke. Revurder forutsetningene.`,
  };
  if (roi >= 20) return {
    cls: 'g', hdr: 'vg',
    label: 'Solid flipp-scenario',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    text: `ROI på ${fmtY(roi)} er godt over terskelen for et attraktivt flipp-prosjekt. Husk at kostnadsoverskridelse kan spise mye av marginen — hold bufferen realistisk.`,
  };
  if (roi >= 10) return {
    cls: 'a', hdr: 'va',
    label: 'Akseptabelt margin',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>`,
    text: `ROI på ${fmtY(roi)} er akseptabelt, men gir liten margin for kostnadsoverskridelse.`,
  };
  return {
    cls: 'r', hdr: 'vr',
    label: 'Svak fortjeneste',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    text: `Lav ROI gir lite rom for feil. Kostnadsoverskridelse eller svakere salgsmarked kan gjøre dette ulønnsomt.`,
  };
}

function renderFlippResults(d) {
  const container = document.getElementById('f-results');
  if (!container) return;

  const v = d.verdict;
  const roiCls  = d.roi >= 20 ? 'pos' : d.roi >= 10 ? 'amb' : 'neg';
  const netCls  = d.nettoGevinst >= 0 ? 'pos' : 'neg';
  const marginPct = d.salgspris > 0 ? ((d.salgspris - d.totalKostnad) / d.salgspris * 100).toFixed(1) : 0;

  const bars = [
    { l: 'Kjøpspris',      v: d.kjop,        col: '#374151' },
    { l: 'Rehab (m/buf.)', v: d.rehabTotal,  col: '#d97706' },
    { l: 'Kjøpskostnader', v: d.dok + d.megKjop, col: '#6b7280' },
    { l: 'Drift/finans',   v: d.finansk + d.diverse, col: '#9ca3af' },
    { l: 'Salgsomk.',      v: d.megSalg,     col: '#dc2626' },
    { l: 'Skatt',          v: d.skattKr,     col: '#ef4444' },
    { l: 'Netto gevinst',  v: Math.max(0, d.nettoGevinst), col: '#16a34a' },
  ].filter(b => b.v > 0);

  const maxBar = Math.max(...bars.map(b => b.v));
  const pct = v => maxBar > 0 ? Math.min(100, (v / maxBar) * 100) : 0;

  container.innerHTML = `
    <div class="kalk-verdict">
      <div class="kalk-verdict-header ${v.hdr}">
        <div class="kalk-verdict-icon ${v.cls}">${v.icon}</div>
        <div>
          <div class="kalk-verdict-label ${v.cls}">Risikovurdering</div>
          <div class="kalk-verdict-title">${v.label}</div>
        </div>
      </div>
      <div class="kalk-verdict-body">${v.text}</div>
    </div>

    <div class="kalk-kpis">
      <div class="kalk-kpi">
        <div class="kalk-kpi-label">Netto ROI</div>
        <div class="kalk-kpi-value ${roiCls}">${fmtY(d.roi)}</div>
        <div class="kalk-kpi-sub">Etter skatt og kost.</div>
      </div>
      <div class="kalk-kpi">
        <div class="kalk-kpi-label">Netto gevinst</div>
        <div class="kalk-kpi-value ${netCls}">${fmtPris(d.nettoGevinst)}</div>
        <div class="kalk-kpi-sub">Etter skatt</div>
      </div>
      <div class="kalk-kpi">
        <div class="kalk-kpi-label">Total investering</div>
        <div class="kalk-kpi-value">${fmtPris(d.totalKostnad)}</div>
        <div class="kalk-kpi-sub">Inkl. rehab og kost.</div>
      </div>
      <div class="kalk-kpi">
        <div class="kalk-kpi-label">Margin %</div>
        <div class="kalk-kpi-value ${d.nettoGevinst > 0 ? 'pos' : 'neg'}">${parseFloat(marginPct).toFixed(1).replace('.',',')}%</div>
        <div class="kalk-kpi-sub">Netto av salgspris</div>
      </div>
    </div>

    <div class="kalk-breakdown">
      <div class="kalk-breakdown-header">Kostnad og inntekt</div>
      <div class="kalk-breakdown-rows">
        <div class="kalk-row">
          <span class="kalk-row-label"><span class="kalk-row-dot" style="background:#374151"></span>Kjøpspris</span>
          <span class="kalk-row-val">+ ${d.kjop.toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row">
          <span class="kalk-row-label"><span class="kalk-row-dot" style="background:#6b7280"></span>Dok.avgift + meglerhonorar kjøp</span>
          <span class="kalk-row-val">+ ${(d.dok + d.megKjop).toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row">
          <span class="kalk-row-label"><span class="kalk-row-dot" style="background:#d97706"></span>Renovering inkl. buffer</span>
          <span class="kalk-row-val amb">+ ${d.rehabTotal.toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row">
          <span class="kalk-row-label"><span class="kalk-row-dot" style="background:#9ca3af"></span>Finanskostnader + diverse</span>
          <span class="kalk-row-val">+ ${(d.finansk + d.diverse).toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row total">
          <span class="kalk-row-label">Total investering</span>
          <span class="kalk-row-val navy">${d.totalKostnad.toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row" style="margin-top:4px">
          <span class="kalk-row-label"><span class="kalk-row-dot" style="background:#16a34a"></span>Salgspris</span>
          <span class="kalk-row-val pos">+ ${d.salgspris.toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row">
          <span class="kalk-row-label"><span class="kalk-row-dot" style="background:#dc2626"></span>Meglerhonorar salg</span>
          <span class="kalk-row-val neg">− ${d.megSalg.toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row">
          <span class="kalk-row-label"><span class="kalk-row-dot" style="background:#ef4444"></span>Skatt</span>
          <span class="kalk-row-val neg">− ${d.skattKr.toLocaleString('no-NO')} kr</span>
        </div>
        <div class="kalk-row total">
          <span class="kalk-row-label">Netto gevinst</span>
          <span class="kalk-row-val ${netCls}">${d.nettoGevinst >= 0 ? '+' : ''}${d.nettoGevinst.toLocaleString('no-NO')} kr</span>
        </div>
      </div>
    </div>

    <div class="kalk-bar-chart">
      <div class="kalk-bar-chart-title">Pengeflyt — visuell oversikt</div>
      ${bars.map(row => `
        <div class="kalk-bar-row">
          <span class="kalk-bar-row-label">${row.l}</span>
          <div class="kalk-bar-track">
            <div class="kalk-bar-fill" style="width:${pct(row.v)}%;background:${row.col}"></div>
          </div>
          <span class="kalk-bar-row-val">${fmtPris(row.v)}</span>
        </div>`).join('')}
    </div>

    <div class="kalk-disclaimer">
      <strong>Om beregningene:</strong> Skatt er forenklet beregnet uten fradrag. Gevinst kan være skattefri ved minst 1 år eierskap og botid — verifiser alltid med regnskapsfører. Alle tall er estimater og utgjør ikke finansiell rådgivning.
    </div>`;
}

/* ── HELPERS ──────────────────────────────────── */

function fmtPris(t) {
  if (!t && t !== 0) return '—';
  const abs = Math.abs(t);
  const sign = t < 0 ? '−' : '';
  if (abs >= 1000000) return sign + (abs / 1000000).toFixed(1).replace('.', ',') + ' M';
  return sign + abs.toLocaleString('no-NO') + ' kr';
}

function fmtKr(t) {
  if (!t && t !== 0) return '—';
  return (t >= 0 ? '+' : '') + t.toLocaleString('no-NO') + ' kr';
}

function fmtY(p) {
  if (!p && p !== 0) return '—';
  return p.toFixed(1).replace('.', ',') + '%';
}