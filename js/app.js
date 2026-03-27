/* =============================================
   APP.JS — Globale funksjoner
   Investorplattform v1
   ============================================= */

// --- NAVBAR & MOBILMENY ---

function initNavbar() {
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const navbar = document.querySelector('.navbar');

  if (!menuBtn || !mobileMenu) return;

  menuBtn.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.innerHTML = open ? iconClose() : iconMenu();
  });

  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      mobileMenu.classList.remove('open');
      menuBtn.innerHTML = iconMenu();
      menuBtn.setAttribute('aria-expanded', false);
    }
  });

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-link, .mobile-menu-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPath || href.replace('.html', '') === currentPath.replace('.html', ''))) {
      link.classList.add('active');
    }
  });
}

// --- TOAST VARSLER ---

function showToast(melding, type = 'info', varighet = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const ikon = type === 'success' ? iconCheck() :
               type === 'error'   ? iconX() : iconInfo();

  toast.innerHTML = `${ikon}<span>${melding}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, varighet);
}

// --- SVG IKONER ---

function iconMenu() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
}

function iconClose() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
}

function iconCheck() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`;
}

function iconX() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
}

function iconInfo() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
}

function iconHeart(fylt = false) {
  return fylt
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

function iconLock() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
}

function iconStar() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
}

// --- TABS ---

function initTabs(container) {
  if (!container) return;
  const btns = container.querySelectorAll('.tab-btn');
  const panels = container.querySelectorAll('.tab-panel');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');
      const panel = container.querySelector(`[data-panel="${target}"]`);
      if (panel) panel.classList.add('active');
    });
  });
}

// --- NAVBAR HTML GENERATOR ---

function navbarHTML(activePage = '') {
  const links = [
    { href: 'sok.html', label: 'Søk objekter' },
    { href: 'kalkulator.html', label: 'Kalkulator' },
    { href: 'premium.html', label: 'Priser' },
  ];

  const navLinks = links.map(l =>
    `<a href="${l.href}" class="navbar-link${activePage === l.href ? ' active' : ''}">${l.label}</a>`
  ).join('');

  const mobileLinks = [
    { href: 'index.html', label: 'Hjem', icon: iconHome() },
    { href: 'sok.html', label: 'Søk objekter', icon: iconSearch() },
    { href: 'kalkulator.html', label: 'Kalkulator', icon: iconCalc() },
    { href: 'premium.html', label: 'Priser', icon: iconStar() },
    { href: 'min-side.html', label: 'Min side', icon: iconUser() },
  ].map(l =>
    `<a href="${l.href}" class="mobile-menu-link${activePage === l.href ? ' active' : ''}">${l.icon}${l.label}</a>`
  ).join('');

  return `
    <nav class="navbar" role="navigation" aria-label="Navigasjon">
      <div class="navbar-inner">
        <a href="index.html" class="navbar-logo">
          <div class="navbar-logo-mark">
            ${iconBuilding()}
          </div>
          <span class="navbar-logo-text">Eiendoms<span>Analyse</span></span>
        </a>
        <div class="navbar-nav">
          ${navLinks}
        </div>
        <div class="navbar-actions">
          <a href="min-side.html" class="btn btn-ghost btn-sm" id="nav-dashboard" style="display:none">Min side</a>
          <a href="logg-inn.html" class="btn btn-ghost btn-sm" id="nav-login">Logg inn</a>
          <a href="registrer.html" class="btn btn-primary btn-sm" id="nav-register">Start gratis</a>
          <button class="navbar-menu-btn" id="menu-btn" aria-label="Meny" aria-expanded="false">
            ${iconMenu()}
          </button>
        </div>
      </div>
    </nav>
    <div class="mobile-menu" id="mobile-menu" role="dialog" aria-label="Mobilmeny">
      ${mobileLinks}
      <div class="mobile-menu-divider"></div>
      <div class="mobile-menu-actions">
        <a href="logg-inn.html" class="btn btn-secondary btn-full">Logg inn</a>
        <a href="registrer.html" class="btn btn-primary btn-full">Start gratis</a>
      </div>
    </div>`;
}

function footerHTML() {
  const y = new Date().getFullYear();
  return `
    <footer class="footer" role="contentinfo">
      <div class="container">

        <div class="footer-trust">
          <div class="footer-trust-item">
            <div class="footer-trust-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div class="footer-trust-title">Kryptert tilkobling</div>
              <div class="footer-trust-desc">All data overføres via TLS/HTTPS</div>
            </div>
          </div>
          <div class="footer-trust-item">
            <div class="footer-trust-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <div class="footer-trust-title">Personvernforordningen (GDPR)</div>
              <div class="footer-trust-desc">Vi behandler ikke mer enn nødvendig</div>
            </div>
          </div>
          <div class="footer-trust-item">
            <div class="footer-trust-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <div class="footer-trust-title">Ikke finansiell rådgivning</div>
              <div class="footer-trust-desc">Alle tall er veiledende estimater</div>
            </div>
          </div>
          <div class="footer-trust-item">
            <div class="footer-trust-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </div>
            <div>
              <div class="footer-trust-title">Norsk selskap</div>
              <div class="footer-trust-desc">EiendomsAnalyse AS · Org. 123 456 789</div>
            </div>
          </div>
        </div>

        <div class="footer-grid">
          <div class="footer-brand">
            <div class="footer-logo">
              <div class="footer-logo-mark">${iconBuilding()}</div>
              <span class="footer-logo-text">EiendomsAnalyse</span>
            </div>
            <p class="footer-tagline">Profesjonell investoranalyse for norske eiendomsobjekter. Finn, analyser og beslutt med bedre datagrunnlag — ikke magefølelse.</p>
            <div class="footer-contact">
              <a href="mailto:hei@eiendomsanalyse.no" class="footer-contact-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                hei@eiendomsanalyse.no
              </a>
              <span class="footer-contact-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Storgata 1, 0182 Oslo
              </span>
            </div>
          </div>

          <div>
            <p class="footer-col-title">Plattform</p>
            <div class="footer-links">
              <a href="sok.html" class="footer-link">Søk objekter</a>
              <a href="kalkulator.html" class="footer-link">Kalkulator</a>
              <a href="premium.html" class="footer-link">Priser og planer</a>
              <a href="min-side.html" class="footer-link">Min side</a>
            </div>
          </div>

          <div>
            <p class="footer-col-title">Selskap</p>
            <div class="footer-links">
              <a href="mailto:hei@eiendomsanalyse.no" class="footer-link">Kontakt oss</a>
            </div>
          </div>

          <div>
            <p class="footer-col-title">Juridisk</p>
            <div class="footer-links">
              <a href="personvern.html" class="footer-link">Personvernerklæring</a>
              <a href="vilkar.html" class="footer-link">Bruksvilkår</a>
            </div>
          </div>
        </div>

        <div class="footer-data-notes">
          <div class="footer-data-note">
            <span class="footer-data-note-badge est">EST</span>
            <span>Estimert: basert på markedsdata, ikke verifisert av EiendomsAnalyse</span>
          </div>
          <div class="footer-data-note">
            <span class="footer-data-note-badge fact">FAKTA</span>
            <span>Faktisk data: hentet direkte fra megler, prospekt eller offentlige registre</span>
          </div>
          <div class="footer-data-note">
            <span class="footer-data-note-badge calc">KALK</span>
            <span>Kalkulert: beregnet av EiendomsAnalyse basert på andre data i prospektet</span>
          </div>
        </div>

        <div class="footer-bottom">
          <div>
            <div class="footer-legal-links">
              <a href="personvern.html" class="footer-legal-link">Personvern</a>
              <a href="vilkar.html" class="footer-legal-link">Vilkår</a>
            </div>
            <div style="margin-top:8px">© ${y} EiendomsAnalyse AS · Org.nr. 123 456 789 · Oslo, Norge</div>
          </div>
          <p class="footer-disclaimer">Alle analyser, estimater og investor-scorer på denne plattformen er veiledende og utgjør ikke finansiell, juridisk eller skattemessig rådgivning. Investeringer i eiendom innebærer risiko. Kontakt en uavhengig rådgiver før større beslutninger.</p>
        </div>

      </div>
    </footer>`;
}

// Ekstra ikoner
function iconBuilding() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><line x1="12" y1="12" x2="12" y2="12.01"/></svg>`;
}

function iconHome() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
}

function iconSearch() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
}

function iconCalc() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg>`;
}

function iconUser() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
}

// --- INIT VED DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
  const navbarRoot = document.getElementById('navbar-root');
  if (navbarRoot) navbarRoot.innerHTML = navbarHTML();

  const footerRoot = document.getElementById('footer-root');
  if (footerRoot) footerRoot.innerHTML = footerHTML();

  initNavbar();

  document.querySelectorAll('[data-tabs]').forEach(initTabs);
});