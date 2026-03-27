/* =============================================
   LANDING.JS — v2
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('navbar-root').innerHTML = navbarHTML('index.html');
  document.getElementById('footer-root').innerHTML = footerHTML();
  initNavbar();

  renderLandingObjects();
  renderFAQ();
  initFAQ();
});

/* OBJEKTKORT */

function renderLandingObjects() {
  const container = document.getElementById('landing-objects');
  if (!container) return;

  const visObjekter = OBJEKTER.filter(o => !o.premium).slice(0, 3);
  container.innerHTML = visObjekter.map(obj => objektKortHTML(obj)).join('');

  container.querySelectorAll('.property-card-fav').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const lagret = toggleFavoritt(id);
      btn.classList.toggle('saved', lagret);
      btn.innerHTML = iconHeart(lagret);
      showToast(lagret ? 'Lagt til i favoritter' : 'Fjernet fra favoritter', lagret ? 'success' : 'info');
    });
  });
}

function objektKortHTML(obj) {
  const fav = erFavoritt(obj.id);

  const statsHTML = obj.strategi === 'flipp'
    ? `
      <div class="property-stat">
        <div class="property-stat-label">Kjøpspris</div>
        <div class="property-stat-value">${formaterPris(obj.prisantydning)}</div>
      </div>
      <div class="property-stat">
        <div class="property-stat-label">Rehab est.</div>
        <div class="property-stat-value neutral">${formaterPris(obj.rehabKostnad)}</div>
      </div>
      <div class="property-stat">
        <div class="property-stat-label">Fortjeneste</div>
        <div class="property-stat-value positive">${formaterPris(obj.bruttoFortjeneste)}</div>
      </div>`
    : `
      <div class="property-stat">
        <div class="property-stat-label">Yield est.</div>
        <div class="property-stat-value ${yieldKlasse(obj.yieldEstimat)}">${formaterYield(obj.yieldEstimat)}</div>
      </div>
      <div class="property-stat">
        <div class="property-stat-label">Mnd. CF</div>
        <div class="property-stat-value ${kontantstroemKlasse(obj.kontantstroemEstimat)}">${formaterKr(obj.kontantstroemEstimat)}</div>
      </div>
      <div class="property-stat">
        <div class="property-stat-label">Totalpris</div>
        <div class="property-stat-value">${formaterPris(obj.prisantydning)}</div>
      </div>`;

  return `
    <article class="property-card">
      <a href="objekt.html?id=${obj.id}" style="display:contents;color:inherit;text-decoration:none">
        <div class="property-card-image">
          <img src="${obj.bilder[0]}" alt="${obj.tittel}" loading="lazy">
          <div class="property-card-badges">
            ${strategiBadge(obj.strategi)}
            ${obj.premium ? premiumBadgeHTML() : ''}
          </div>
          <button class="property-card-fav ${fav ? 'saved' : ''}"
                  data-id="${obj.id}"
                  aria-label="${fav ? 'Fjern fra favoritter' : 'Legg til i favoritter'}">
            ${iconHeart(fav)}
          </button>
        </div>
        <div class="property-card-body">
          <div>
            <h3 class="property-card-title">${obj.tittel}</h3>
            <p class="property-card-meta">
              ${obj.by}
              <span class="property-card-meta-dot"></span>
              ${obj.type}
              ${obj.areal > 0 ? `<span class="property-card-meta-dot"></span>${obj.areal} m²` : ''}
            </p>
          </div>
          <div class="property-card-stats">${statsHTML}</div>
        </div>
      </a>
      <div class="property-card-footer">
        <span class="property-card-price">${formaterPris(obj.prisantydning)}</span>
        <a href="objekt.html?id=${obj.id}" class="btn btn-primary btn-sm">Se analyse →</a>
      </div>
    </article>`;
}

window.objektKortHTML = objektKortHTML;

/* FAQ */

const FAQ_DATA = [
  {
    q: "Hva skiller dette fra å bruke Finn.no?",
    a: "Finn.no er laget for folk som skal kjøpe bolig for å bo der. Her er filtreringen og informasjonen tilpasset investorer: du kan filtrere på yield-estimat, se kontantstrøm beregnet per objekt, og bruke kalkulatoren til å vurdere finansieringen — alt på én plass."
  },
  {
    q: "Hvordan er yield-estimatene beregnet?",
    a: "Yield er beregnet på bakgrunn av estimert månedlig leieinntekt, totalpris og felleskostnader. Leieinntektene er basert på markedsdata for tilsvarende objekter i samme område og størrelseskategori. Alle estimater er merket tydelig som estimater — de er et utgangspunkt, ikke en garanti."
  },
  {
    q: "Er alle kostnader inkludert i kontantstrømsberegningen?",
    a: "Vi beregner netto kontantstrøm etter leieinntekt, felleskostnader, estimert vedlikehold, rentekostnad og avdrag. Du kan justere egenkapital og rente i finansieringskalkulatoren. Det som ikke er inkludert automatisk er forsikring, meglerkostnader ved kjøp og eventuelle skattehensyn."
  },
  {
    q: "Hva er forskjellen på Gratis, Pro og Investor?",
    a: "Gratisplanen gir tilgang til alle åpne objekter og kalkulatoren, men bare ett lagret søk og ingen varsler. Pro gir ubegrenset favoritter, 10 lagrede søk, tilgang til premium-objekter og e-postvarsler. Investor er for de mest aktive med ubegrenset lagring, SMS-varsler og Excel-eksport."
  },
  {
    q: "Kan jeg bruke plattformen gratis for alltid?",
    a: "Ja. Grunnleggende søk, analyse og kalkulator er alltid gratis. Du trenger ikke oppgi betalingsinformasjon for å registrere deg. Hvis du vil ha varsler, premium-objekter eller lagre mer enn ett søk, trenger du en betalt plan."
  },
  {
    q: "Hvor trygge er personopplysningene mine?",
    a: "Vi er GDPR-kompatible og samler bare inn det vi trenger for å levere tjenesten. Vi selger ikke data. All kommunikasjon er kryptert. Du kan slette kontoen din og alle tilhørende data til enhver tid."
  },
  {
    q: "Legger dere til nye objekter jevnlig?",
    a: "Ja. Plattformen oppdateres løpende med nye objekter fra hele landet. Pro- og Investor-brukere kan aktivere e-postvarsler slik at de får beskjed umiddelbart når nye objekter som matcher søket deres blir publisert."
  }
];

function renderFAQ() {
  const list = document.getElementById('faq-list');
  if (!list) return;
  list.innerHTML = FAQ_DATA.map((item, i) => `
    <div class="faq-item" data-faq="${i}">
      <button class="faq-question" aria-expanded="false" aria-controls="faq-panel-${i}">
        <span>${item.q}</span>
        <span class="faq-q-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </span>
      </button>
      <div class="faq-answer" id="faq-panel-${i}" role="region">
        <div class="faq-answer-inner">${item.a}</div>
      </div>
    </div>
  `).join('');
}

function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const inner = item.querySelector('.faq-answer-inner');

      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-answer').style.maxHeight = '0';
          other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });

      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      answer.style.maxHeight = open ? inner.offsetHeight + 'px' : '0';
    });
  });
}