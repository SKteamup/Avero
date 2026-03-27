/* =============================================
   PREMIUM.JS — v2
   ============================================= */

let AARLIG = false;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('navbar-root').innerHTML = navbarHTML('premium.html');
  document.getElementById('footer-root').innerHTML = footerHTML();
  initNavbar();

  renderTable();
  renderPricing();
  renderFAQ();
  initBillingToggle();
});

/* ── BILLING TOGGLE ───────────────────────────── */

function initBillingToggle() {
  const toggle = document.getElementById('billing-toggle');
  const mndLbl = document.getElementById('billing-mnd-label');
  const aarLbl = document.getElementById('billing-aar-label');

  toggle.addEventListener('change', () => {
    AARLIG = toggle.checked;
    mndLbl.style.fontWeight = AARLIG ? '400' : '600';
    mndLbl.style.color      = AARLIG ? 'var(--gray-400)' : 'var(--gray-700)';
    aarLbl.style.fontWeight = AARLIG ? '600' : '400';
    renderPricing();
  });
}

/* ── COMPARISON TABLE ─────────────────────────── */

const TABLE_ROWS = [
  { group: 'Søk og objekter' },
  { label: 'Søk og bla gjennom alle åpne objekter',      g: 'yes', p: 'yes', i: 'yes' },
  { label: 'Tilgang til premium-objekter',               g: 'no',  p: 'yes', i: 'yes' },
  { label: 'Investoranalyse per objekt',                 g: 'yes', p: 'yes', i: 'yes' },
  { label: 'Favoritter og historikk',                    g: 'yes', p: 'yes', i: 'yes' },
  { group: 'Lagrede søk og varsler' },
  { label: 'Lagrede søk',                                g: '1',   p: '10', i: 'Ubegrenset' },
  { label: 'E-postvarsler ved nye treff',                g: 'no',  p: 'yes', i: 'yes' },
  { label: 'SMS-varsler',                                g: 'no',  p: 'no',  i: 'snart' },
  { group: 'Verktøy' },
  { label: 'Kalkulatorer (utleie + flipp)',               g: 'yes', p: 'yes', i: 'yes' },
  { label: 'Finansieringskalkulator per objekt',         g: 'yes', p: 'yes', i: 'yes' },
  { label: 'Personlige notater per objekt',              g: 'yes', p: 'yes', i: 'yes' },
  { label: 'Excel- og CSV-eksport',                      g: 'no',  p: 'no',  i: 'snart' },
  { group: 'Support' },
  { label: 'E-postsupport',                              g: 'yes', p: 'yes', i: 'yes' },
  { label: 'Prioritert support (< 1 arbeidsdag)',        g: 'no',  p: 'no',  i: 'yes' },
];

function cellHTML(val) {
  if (val === 'yes') return `<span class="check-yes"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span>`;
  if (val === 'no')  return `<span class="check-no"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg></span>`;
  return `<span style="font-size:12px;font-weight:600;color:var(--gray-700)">${val}</span>`;
}

function renderTable() {
  const container = document.getElementById('comparison-table');
  if (!container) return;

  let html = `
    <div class="pm-table-head">
      <div class="pm-th feature-col">Funksjon</div>
      <div class="pm-th">Gratis</div>
      <div class="pm-th pro-col">Pro</div>
      <div class="pm-th">Investor</div>
    </div>`;

  TABLE_ROWS.forEach(row => {
    if (row.group) {
      html += `<div class="pm-table-group-label">${row.group}</div>`;
    } else {
      html += `
        <div class="pm-tr">
          <div class="pm-td">${row.label}</div>
          <div class="pm-td">${cellHTML(row.g)}</div>
          <div class="pm-td pro-col">${cellHTML(row.p)}</div>
          <div class="pm-td">${cellHTML(row.i)}</div>
        </div>`;
    }
  });

  container.innerHTML = html;
}

/* ── PRICING CARDS ────────────────────────────── */

const PLANS = [
  {
    id: 'gratis',
    name: 'Gratis',
    mnd: 0,
    aar: 0,
    desc: 'For deg som vil utforske plattformen og ta gjennomtenkte beslutninger uten tidspress.',
    features: [
      { yes: true,  text: 'Søk og se alle åpne objekter' },
      { yes: true,  text: 'Kalkulatorer (utleie + flipp)' },
      { yes: true,  text: 'Investoranalyse per objekt' },
      { yes: true,  text: 'Favoritter og notater' },
      { yes: true,  text: '1 lagret søk' },
      { yes: false, text: 'Premium-objekter', dimmed: true },
      { yes: false, text: 'E-postvarsler', dimmed: true },
      { yes: false, text: 'Excel-eksport', dimmed: true },
    ],
    cta: 'Registrer gratis',
    ctaHref: 'registrer.html',
    ctaClass: 'btn btn-secondary btn-full',
    featured: false,
    note: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    mnd: 199,
    aar: 159,
    desc: 'For deg som søker aktivt og ikke vil gå glipp av objekter som matcher kriteriene dine.',
    features: [
      { yes: true,  text: 'Alt i Gratis' },
      { yes: true,  text: 'Premium-objekter låst opp' },
      { yes: true,  text: 'E-postvarsler ved nye treff' },
      { yes: true,  text: '10 lagrede søk' },
      { yes: false, text: 'Excel/CSV-eksport', dimmed: true },
      { yes: false, text: 'SMS-varsler', dimmed: true },
      { yes: false, text: 'Prioritert support', dimmed: true },
    ],
    cta: 'Velg Pro',
    ctaHref: 'registrer.html?plan=pro',
    ctaClass: 'btn btn-primary btn-full',
    featured: true,
    note: 'Kanseller når som helst',
  },
  {
    id: 'investor',
    name: 'Investor',
    mnd: 499,
    aar: 399,
    desc: 'For deg som jobber systematisk med eiendomsinvesteringer og trenger full tilgang og eksport.',
    features: [
      { yes: true,  text: 'Alt i Pro' },
      { yes: true,  text: 'Ubegrenset lagrede søk' },
      { yes: false, text: 'Excel- og CSV-eksport (snart)', dimmed: true },
      { yes: false, text: 'SMS-varsler (snart)', dimmed: true },
      { yes: true,  text: 'Prioritert support (< 1 dag)' },
    ],
    cta: 'Velg Investor',
    ctaHref: 'registrer.html?plan=investor',
    ctaClass: 'btn btn-gold btn-full',
    featured: false,
    note: 'Kanseller når som helst',
    investor: true,
  },
];

function renderPricing() {
  const grid = document.getElementById('pricing-grid');
  if (!grid) return;

  grid.innerHTML = PLANS.map(plan => {
    const pris     = AARLIG && plan.aar > 0 ? plan.aar : plan.mnd;
    const billingNote = plan.mnd === 0 ? ''
      : AARLIG ? `Faktureres ${(pris * 12).toLocaleString('no-NO')} kr/år`
               : 'Faktureres månedlig';

    const featuresHTML = plan.features.map(f => `
      <div class="pm-plan-feature${f.dimmed ? ' dimmed' : ''}">
        <svg class="pm-plan-feature-icon ${f.yes ? 'yes' : 'no'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          ${f.yes
            ? '<polyline points="20 6 9 17 4 12"/>'
            : '<line x1="5" y1="12" x2="19" y2="12"/>'}
        </svg>
        ${f.text}
      </div>`).join('');

    return `
      <div class="pm-plan${plan.featured ? ' featured' : ''}${plan.investor ? ' investor' : ''}">
        ${plan.featured ? '<div class="pm-plan-banner">Mest brukt</div>' : ''}
        <div class="pm-plan-top">
          <div class="pm-plan-name">${plan.name}</div>
          <div class="pm-plan-price">
            <span class="pm-plan-amount">${pris === 0 ? '0' : pris.toLocaleString('no-NO')}</span>
            ${pris > 0 ? '<span class="pm-plan-currency">kr</span><span class="pm-plan-per">/mnd</span>' : '<span class="pm-plan-per" style="font-size:18px;padding-bottom:4px">kr</span>'}
          </div>
          <div class="pm-plan-billing">${billingNote}</div>
          <p class="pm-plan-desc">${plan.desc}</p>
        </div>
        <div class="pm-plan-body">
          <div class="pm-plan-features">${featuresHTML}</div>
          <div class="pm-plan-cta">
            <a href="${plan.ctaHref}" class="${plan.ctaClass}">${plan.cta}</a>
            ${plan.note ? `<p style="text-align:center;font-size:11px;color:var(--gray-400);margin-top:8px">${plan.note}</p>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

/* ── FAQ ──────────────────────────────────────── */

const FAQ_DATA = [
  {
    q: 'Hva er egentlig grensen mellom gratis og betalt?',
    a: 'Gratisplanen gir tilgang til alle åpne objekter, kalkulatorer og én lagret søkeprofil. Du kan gjøre fullstendige analyser på alle åpne objekter. Pro og Investor legger til premium-objekter (ca. 15–20% av totalen), e-postvarsler og flere lagrede søk.',
  },
  {
    q: 'Hva skjer med abonnementet mitt hvis jeg kansellerer?',
    a: 'Du beholder tilgang til Pro- eller Investor-funksjonene ut betalingsperioden. Etter det går du automatisk tilbake til gratisplanen — ingen videre trekk, ingen skjulte kostnader.',
  },
  {
    q: 'Kan jeg prøve Pro før jeg betaler?',
    a: 'Vi tilbyr ikke prøveperiode per nå, men gratisplanen er fullverdig nok til at du kan vurdere om Pro gir mening for deg. Du kan også se hvilke objekter som er premiumlåste fra søkesiden.',
  },
  {
    q: 'Faktureres jeg automatisk videre?',
    a: 'Ja, abonnementet fornyes automatisk månedlig eller årlig avhengig av hva du valgte. Du får en påminnelse på e-post 7 dager før fornyelse. Du kan kansellere når som helst fra Min side.',
  },
  {
    q: 'Hva koster det med MVA?',
    a: 'Alle priser på denne siden er inkludert norsk MVA (25%). Det er ingen skjulte avgifter.',
  },
  {
    q: 'Er det noe bindingstid?',
    a: 'Nei. Månedlig fakturering kan kanselleres når som helst. Velger du å betale for et helt år sparer du 20%, men du binder deg da til året.',
  },
  {
    q: 'Hva er en «premium-leilighet»?',
    a: 'Noen objekter har spesielt detaljert analyse, tidssensitiv informasjon eller er kurert fra meglernettverk som kun distribuerer til betalende investorer. Disse er merket med Pro-badge i søket.',
  },
  {
    q: 'Kan bedrifter eller holdingselskaper kjøpe Investor?',
    a: 'Ja. Ta kontakt på hei@eiendomsanalyse.no for informasjon om fakturaavtale, fleruseroppsettet og team-funksjonalitet (under utvikling).',
  },
];

function renderFAQ() {
  const list = document.getElementById('faq-list');
  if (!list) return;

  list.innerHTML = FAQ_DATA.map((item, i) => `
    <div class="pm-faq-item" id="faq-${i}">
      <button class="pm-faq-q" onclick="toggleFAQ(${i})" aria-expanded="false">
        <span>${item.q}</span>
        <span class="pm-faq-toggle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </span>
      </button>
      <div class="pm-faq-a" id="faq-a-${i}">
        <div class="pm-faq-a-inner">${item.a}</div>
      </div>
    </div>`).join('');
}

function toggleFAQ(idx) {
  const item   = document.getElementById(`faq-${idx}`);
  const answer = document.getElementById(`faq-a-${idx}`);
  const btn    = item.querySelector('.pm-faq-q');
  const inner  = answer.querySelector('.pm-faq-a-inner');

  // Close others
  FAQ_DATA.forEach((_, i) => {
    if (i !== idx) {
      const oi = document.getElementById(`faq-${i}`);
      const oa = document.getElementById(`faq-a-${i}`);
      if (oi && oa) {
        oi.classList.remove('open');
        oa.style.maxHeight = '0';
        oi.querySelector('.pm-faq-q')?.setAttribute('aria-expanded', 'false');
      }
    }
  });

  const isOpen = item.classList.toggle('open');
  btn.setAttribute('aria-expanded', isOpen);
  answer.style.maxHeight = isOpen ? inner.offsetHeight + 'px' : '0';
}