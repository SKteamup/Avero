/* =============================================
   ADMIN.JS — v2
   Rask manuell innlegging av objekter
   ============================================= */

/* ── STATE ────────────────────────────────────── */
let currentEdit   = null;   // null = new, string = existing id
let valgte        = new Set();
let sortField     = 'dato';
let sortDir       = -1;
let isDirty       = false;
let confirmCallback = null;

/* ── INIT ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Login form
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Object list events
  document.getElementById('obj-search').addEventListener('input', renderTable);
  document.getElementById('obj-status-filter').addEventListener('change', renderTable);
  document.getElementById('obj-strategi-filter').addEventListener('change', renderTable);
  document.getElementById('obj-by-filter').addEventListener('change', renderTable);
  document.getElementById('select-all').addEventListener('change', toggleSelectAll);

  // Close drawer on overlay click
  document.getElementById('form-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('form-overlay')) promptCloseForm();
  });

  // Keyboard escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (document.getElementById('confirm-overlay').classList.contains('open')) {
        closeConfirm();
      } else if (document.getElementById('form-overlay').classList.contains('open')) {
        promptCloseForm();
      }
    }
  });

  populateByFilter();
  renderTable();
  renderUserTable();
  renderStats();
  updateNavCounts();
});

/* ── LOGIN ────────────────────────────────────── */

async function handleLogin(e) {
  e.preventDefault();
  const epost   = document.getElementById('login-email').value.trim();
  const passord = document.getElementById('login-pw').value;
  const errEl   = document.getElementById('login-error');
  const btn     = document.getElementById('login-btn');

  if (!window.Supa) {
    errEl.textContent = 'Supabase er ikke koblet til. Sett inn nøkler i js/supabase/client.js';
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Logger inn…';
  if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '.spin{animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
  errEl.classList.add('hidden');

  try {
    await window.Supa.auth.loggInn({ epost, passord });

    const ok = await window.Supa.auth.erAdmin();
    if (!ok) {
      await window.Supa.auth.loggUt();
      throw new Error('Denne kontoen har ikke admintilgang');
    }

    document.getElementById('login-page').style.display = 'none';
    document.getElementById('admin-app').classList.add('visible');
    document.getElementById('topbar-user-name').textContent = epost;

    await lastInnObjekter();
    await lastInnBrukere();

  } catch (err) {
    errEl.textContent = err.message.includes('Invalid login credentials')
      ? 'Feil e-post eller passord'
      : err.message;
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Logg inn';
  }
}

async function handleLogout() {
  if (window.Supa) {
    try { await window.Supa.auth.loggUt(); } catch (_) {}
  }
  document.getElementById('admin-app').classList.remove('visible');
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('login-pw').value = '';
  document.getElementById('login-btn').disabled = false;
  document.getElementById('login-btn').textContent = 'Logg inn';
}

/* ── LAST INN DATA FRA SUPABASE ───────────────── */

async function lastInnObjekter() {
  if (!window.Supa) return; // ingen Supabase — lokal data.js brukes

  try {
    const res = await window.Supa.admin.adminHentObjekter({ perSide: 200 });
    OBJEKTER.length = 0;
    res.forEach(r => {
      const o = window.Supa.objekter.mapObjekt(r);
      // DB bruker lowercase status — map til titlecase som resten av UI forventer
      o.status = o.status === 'publisert' ? 'Publisert'
               : o.status === 'utkast'    ? 'Utkast'
               : o.status === 'inaktiv'   ? 'Inaktiv'
               : o.status;
      OBJEKTER.push(o);
    });
    renderTable();
    renderStats();
    updateNavCounts();
    // Bygg filtervalg på nytt med oppdaterte byer
    resetAndPopulateByFilter();
  } catch (err) {
    adminToast('Kunne ikke laste objekter: ' + err.message, 'error');
  }
}

async function lastInnBrukere() {
  if (!window.Supa) return;

  try {
    const res = await window.Supa.admin.adminHentBrukere();
    BRUKERE.length = 0;
    res.forEach(u => BRUKERE.push({
      navn:   u.navn  || '—',
      epost:  u.epost || '—',
      plan:   u.plan === 'gratis' ? 'Gratis' : u.plan === 'pro' ? 'Pro' : 'Investor',
      dato:   u.opprettet ? u.opprettet.slice(0, 10) : '—',
      status: u.aktiv ? 'Aktiv' : 'Inaktiv',
    }));
    renderUserTable();
    document.getElementById('nav-usr-count').textContent = BRUKERE.length;
  } catch (err) {
    console.warn('Kunne ikke laste brukere:', err.message);
  }
}

/* ── NAV VIEWS ────────────────────────────────── */

window.showView = function(view) {
  ['objekter','brukere'].forEach(v => {
    document.getElementById(`view-${v}`).classList.toggle('hidden', v !== view);
    document.getElementById(`nav-${v === 'objekter' ? 'objekter' : 'brukere'}`).classList.toggle('active', v === view);
  });
};

function updateNavCounts() {
  document.getElementById('nav-obj-count').textContent = OBJEKTER.length;
  document.getElementById('nav-usr-count').textContent = BRUKERE.length;
}

function resetByFilter() {
  const sel = document.getElementById('obj-by-filter');
  while (sel.options.length > 1) sel.remove(1);
}

function populateByFilter() {
  const byer = [...new Set(OBJEKTER.map(o => o.by))].sort();
  const sel  = document.getElementById('obj-by-filter');
  byer.forEach(by => {
    const opt = document.createElement('option');
    opt.value = by;
    opt.textContent = by;
    sel.appendChild(opt);
  });
}

function resetAndPopulateByFilter() {
  resetByFilter();
  populateByFilter();
}

/* ── STATS ────────────────────────────────────── */

function renderStats() {
  const pub     = OBJEKTER.filter(o => o.status === 'Publisert').length;
  const utkast  = OBJEKTER.filter(o => o.status === 'Utkast').length;
  const premium = OBJEKTER.filter(o => o.premium).length;
  const avgY    = OBJEKTER.filter(o => o.yieldEstimat).reduce((s,o) => s + o.yieldEstimat, 0) /
                  Math.max(1, OBJEKTER.filter(o => o.yieldEstimat).length);

  document.getElementById('obj-stats').innerHTML = [
    { v: OBJEKTER.length, l: 'Totalt' },
    { v: pub,             l: 'Publisert',  style: 'color:var(--green)' },
    { v: utkast,          l: 'Utkast',     style: 'color:var(--amber)' },
    { v: avgY.toFixed(1).replace('.', ',') + '%', l: 'Snitt yield' },
  ].map(s => `
    <div class="admin-stat">
      <div class="admin-stat-value" ${s.style ? `style="${s.style}"` : ''}>${s.v}</div>
      <div class="admin-stat-label">${s.l}</div>
    </div>`).join('');
}

/* ── OBJECT TABLE ─────────────────────────────── */

function filtrerObjekter() {
  const q   = document.getElementById('obj-search').value.toLowerCase();
  const st  = document.getElementById('obj-status-filter').value;
  const str = document.getElementById('obj-strategi-filter').value;
  const by  = document.getElementById('obj-by-filter').value;

  return [...OBJEKTER]
    .filter(o => {
      if (q  && !`${o.tittel} ${o.by} ${o.type} ${o.adresse}`.toLowerCase().includes(q)) return false;
      if (st  && o.status    !== st)  return false;
      if (str && o.strategi  !== str) return false;
      if (by  && o.by        !== by)  return false;
      return true;
    })
    .sort((a, b) => {
      const f = sortField;
      if (f === 'pris')  return (b.prisantydning - a.prisantydning) * sortDir;
      if (f === 'score') return ((b.investorScore || 0) - (a.investorScore || 0)) * sortDir;
      return (new Date(b.lagt_til) - new Date(a.lagt_til)) * Math.abs(sortDir);
    });
}

window.sortTabell = function(field) {
  if (sortField === field) sortDir *= -1;
  else { sortField = field; sortDir = -1; }
  renderTable();
};

function renderTable() {
  const res   = filtrerObjekter();
  const tbody = document.getElementById('obj-tbody');
  const empty = document.getElementById('obj-empty');

  if (res.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  tbody.innerHTML = res.map(obj => {
    const stratLabel = obj.strategi === 'utleie' ? 'Utleie' : 'Flipp';
    const stratStyle = obj.strategi === 'utleie'
      ? 'background:rgba(15,31,61,.08);color:var(--navy)'
      : 'background:var(--gold-light);color:var(--gold)';

    const yieldStr = obj.strategi === 'utleie'
      ? (obj.yieldEstimat ? obj.yieldEstimat.toFixed(1).replace('.', ',') + '%' : '—')
      : (obj.flipROI ? obj.flipROI.toFixed(1).replace('.', ',') + '% ROI' : '—');

    const score = obj.investorScore || 0;
    const scoreCl = score >= 80 ? 'color:var(--green)' : score >= 65 ? 'color:var(--amber)' : 'color:var(--red)';

    const statusKey = (obj.status || 'Utkast').toLowerCase();

    const dato = obj.lagt_til
      ? new Date(obj.lagt_til).toLocaleDateString('no-NO', { day:'numeric', month:'short' })
      : '—';

    const img = obj.bilder?.[0];

    return `
      <tr class="${obj.status === 'Inaktiv' ? 'inactive' : ''}" id="row-${obj.id}">
        <td>
          <input type="checkbox" class="obj-cb" value="${obj.id}" style="accent-color:var(--navy);width:14px;height:14px;cursor:pointer"
            onchange="toggleSelect('${obj.id}',this.checked)" ${valgte.has(obj.id) ? 'checked' : ''}>
        </td>
        <td style="max-width:220px">
          <div class="obj-title-cell">
            ${img
              ? `<img src="${img}" class="obj-thumb" alt="" loading="lazy" onerror="this.style.display='none'">`
              : `<div class="obj-thumb" style="display:flex;align-items:center;justify-content:center;background:var(--gray-100);color:var(--gray-400)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>`
            }
            <div>
              <div class="obj-title-text" style="display:flex;align-items:center;gap:5px">
                ${obj.tittel}
                ${obj.premium ? '<span class="obj-premium-dot" title="Premium"></span>' : ''}
              </div>
              <div style="font-size:11px;color:var(--gray-400)">${obj.type} · ${obj.areal > 0 ? obj.areal + ' m²' : ''}</div>
            </div>
          </div>
        </td>
        <td>${obj.by}</td>
        <td><span style="padding:2px 7px;border-radius:4px;font-size:11px;font-weight:600;${stratStyle}">${stratLabel}</span></td>
        <td style="font-family:var(--font-mono);font-size:12px">${obj.prisantydning?.toLocaleString('no-NO')} kr</td>
        <td style="font-variant-numeric:tabular-nums">${yieldStr}</td>
        <td><span style="font-weight:700;font-variant-numeric:tabular-nums;${scoreCl}">${score || '—'}</span></td>
        <td><span class="status-pill ${statusKey}">${obj.status || 'Utkast'}</span></td>
        <td style="color:var(--gray-400)">${dato}</td>
        <td>
          <div class="table-actions">
            <button class="table-action-btn" onclick="openForm('${obj.id}')" title="Rediger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="table-action-btn" onclick="quickToggleStatus('${obj.id}')" title="${obj.status === 'Publisert' ? 'Deaktiver' : 'Publiser'}">
              ${obj.status === 'Publisert'
                ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`
                : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`}
            </button>
            <button class="table-action-btn danger" onclick="promptDeleteById('${obj.id}')" title="Slett">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

/* ── SELECTION ────────────────────────────────── */

window.toggleSelect = function(id, checked) {
  checked ? valgte.add(id) : valgte.delete(id);
  updateBulkBar();
};

function toggleSelectAll() {
  const all = document.getElementById('select-all').checked;
  document.querySelectorAll('.obj-cb').forEach(cb => {
    cb.checked = all;
    all ? valgte.add(cb.value) : valgte.delete(cb.value);
  });
  updateBulkBar();
}

function clearSelection() {
  valgte.clear();
  document.getElementById('select-all').checked = false;
  document.querySelectorAll('.obj-cb').forEach(cb => cb.checked = false);
  updateBulkBar();
}

function updateBulkBar() {
  const bar = document.getElementById('bulk-bar');
  bar.classList.toggle('visible', valgte.size > 0);
  document.getElementById('bulk-label').textContent = `${valgte.size} valgt`;
}

window.bulkAksjon = async function(type) {
  const mapDisplay = { publiser: 'Publisert', utkast: 'Utkast', inaktiv: 'Inaktiv' };
  const mapDB      = { publiser: 'publisert', utkast: 'utkast', inaktiv: 'inaktiv' };
  const ids = [...valgte];

  if (window.Supa) {
    try {
      await window.Supa.admin.adminBulkStatus(ids, mapDB[type]);
      clearSelection();
      await lastInnObjekter();
      adminToast(`${ids.length} objekter satt til ${mapDisplay[type]}`, 'success');
    } catch (err) {
      adminToast('Feil ved bulk-oppdatering: ' + err.message, 'error');
    }
  } else {
    ids.forEach(id => {
      const o = OBJEKTER.find(x => x.id === id);
      if (o) o.status = mapDisplay[type];
    });
    clearSelection();
    renderTable();
    renderStats();
    adminToast(`Objekter oppdatert til ${mapDisplay[type]}`, 'success');
  }
};

window.quickToggleStatus = async function(id) {
  const o = OBJEKTER.find(x => x.id === id);
  if (!o) return;
  const gammelStatus = o.status;
  const nyStatus = gammelStatus === 'Publisert' ? 'Inaktiv' : 'Publisert';

  // Optimistisk lokal oppdatering
  o.status = nyStatus;
  renderTable();
  renderStats();

  if (window.Supa) {
    try {
      await window.Supa.admin.adminOppdaterObjekt(id, { status: nyStatus.toLowerCase() });
      adminToast(`${o.tittel}: ${nyStatus}`, 'info');
    } catch (err) {
      // Reverter ved feil
      o.status = gammelStatus;
      renderTable();
      renderStats();
      adminToast('Statusendring feilet: ' + err.message, 'error');
    }
  } else {
    adminToast(`${o.tittel}: ${nyStatus}`, 'info');
  }
};

/* ── OBJECT FORM ──────────────────────────────── */

window.openForm = function(id) {
  currentEdit = id;
  isDirty = false;
  document.getElementById('unsaved-dot').classList.remove('visible');

  const obj = id ? OBJEKTER.find(o => o.id === id) : null;
  const title = obj ? 'Rediger objekt' : 'Nytt objekt';
  const sub   = obj ? `${obj.tittel} · ${obj.by}` : 'Fyll ut feltene nedenfor';

  document.getElementById('form-drawer-title').textContent = title;
  document.getElementById('form-drawer-sub').textContent   = sub;
  document.getElementById('form-delete-btn').style.display = obj ? 'flex' : 'none';

  const formStatus = obj?.status || 'Publisert';
  document.getElementById('form-status-label').textContent =
    formStatus === 'Publisert' ? 'Sett til utkast' : 'Sett til publisert';
  document.getElementById('form-status-toggle').dataset.status = formStatus;

  renderFormBody(obj);

  document.getElementById('form-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeForm = function() {
  document.getElementById('form-overlay').classList.remove('open');
  document.body.style.overflow = '';
  currentEdit = null;
  isDirty = false;
};

function promptCloseForm() {
  if (isDirty) {
    openConfirm(
      'Forkast endringer?',
      'Du har ulagrede endringer. Vil du forkaste dem og lukke?',
      closeForm
    );
  } else {
    closeForm();
  }
}

window.toggleFormStatus = function() {
  const btn     = document.getElementById('form-status-toggle');
  const current = btn.dataset.status;
  const next    = current === 'Publisert' ? 'Utkast' : 'Publisert';
  btn.dataset.status = next;
  document.getElementById('form-status-label').textContent =
    next === 'Publisert' ? 'Sett til utkast' : 'Sett til publisert';
  markDirty();
};

function markDirty() {
  isDirty = true;
  document.getElementById('unsaved-dot').classList.add('visible');
}

/* ── FORM BODY ────────────────────────────────── */

function renderFormBody(obj) {
  const body = document.getElementById('form-body');
  const v = k => obj?.[k] ?? '';
  const vn = k => obj?.[k] ?? '';

  body.innerHTML = `

    <!-- ① GRUNNLEGGENDE INFO -->
    <div class="form-section" id="sec-basis">
      <div class="form-section-header" onclick="toggleSection('sec-basis')">
        <div class="form-section-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
        <span class="form-section-title">Grunnleggende</span>
        <svg class="form-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="form-section-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tittel / adresse <span class="form-label-req">*</span></label>
            <input type="text" class="form-input" id="f-tittel" value="${v('tittel')}" placeholder="f.eks. Ekebergveien 14">
          </div>
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Full adresse</label>
            <input type="text" class="form-input" id="f-adresse" value="${v('adresse')}" placeholder="Gate nr, postnr By">
          </div>
          <div class="form-group">
            <label class="form-label">By <span class="form-label-req">*</span></label>
            <input type="text" class="form-input" id="f-by" value="${v('by')}" placeholder="Oslo" list="by-list">
            <datalist id="by-list"><option value="Oslo"><option value="Bergen"><option value="Trondheim"><option value="Stavanger"><option value="Tromsø"></datalist>
          </div>
        </div>
        <div class="form-row cols-3">
          <div class="form-group">
            <label class="form-label">Type <span class="form-label-req">*</span></label>
            <select class="form-select" id="f-type">
              ${['Leilighet','Tomannsbolig','Enebolig','Rekkehus','Næringseiendom'].map(t =>
                `<option ${v('type') === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Strategi <span class="form-label-req">*</span></label>
            <select class="form-select" id="f-strategi" onchange="updateStrategyFields()">
              <option value="utleie" ${v('strategi') === 'utleie' ? 'selected' : ''}>Utleie</option>
              <option value="flipp"  ${v('strategi') === 'flipp'  ? 'selected' : ''}>Flipp</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Eierform</label>
            <select class="form-select" id="f-eierform">
              ${['Selveier','Andel','Aksje'].map(e =>
                `<option ${v('eierform') === e ? 'selected' : ''}>${e}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row cols-4">
          <div class="form-group">
            <label class="form-label">Areal (m²)</label>
            <input type="number" class="form-input" id="f-areal" value="${vn('areal')}" min="0" step="1">
          </div>
          <div class="form-group">
            <label class="form-label">Antall rom</label>
            <input type="number" class="form-input" id="f-rom" value="${vn('rom')}" min="0" max="20">
          </div>
          <div class="form-group">
            <label class="form-label">Etasje</label>
            <input type="text" class="form-input" id="f-etasje" value="${v('etasje')}" placeholder="3. etasje">
          </div>
          <div class="form-group">
            <label class="form-label">Byggeår</label>
            <input type="number" class="form-input" id="f-byggeaar" value="${vn('byggeaar')}" min="1800" max="2030">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Beskrivelse</label>
          <textarea class="form-textarea" id="f-beskrivelse" rows="3" placeholder="Kort beskrivelse av objektet til investorer…">${v('beskrivelse')}</textarea>
        </div>
      </div>
    </div>

    <!-- ② PRIS OG ØKONOMI -->
    <div class="form-section" id="sec-pris">
      <div class="form-section-header" onclick="toggleSection('sec-pris')">
        <div class="form-section-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
        <span class="form-section-title">Pris og økonomi</span>
        <svg class="form-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="form-section-body">
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Prisantydning (kr) <span class="form-label-req">*</span></label>
            <input type="number" class="form-input" id="f-pris" value="${vn('prisantydning')}" step="50000" min="0" oninput="recalcTotalPris()">
          </div>
          <div class="form-group">
            <label class="form-label">Fellesgjeld (kr)</label>
            <input type="number" class="form-input" id="f-fellesgjeld" value="${vn('fellesgjeld')}" step="10000" min="0" oninput="recalcTotalPris()">
          </div>
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Totalpris (beregnet)</label>
            <input type="number" class="form-input" id="f-totalpris" value="${vn('totalPris')}" readonly style="background:var(--gray-50);color:var(--gray-500)">
            <span class="form-hint">Prisantydning + fellesgjeld</span>
          </div>
          <div class="form-group">
            <label class="form-label">Felleskostnader (kr/mnd)</label>
            <input type="number" class="form-input" id="f-felleskost" value="${vn('felleskostnader')}" step="100" min="0">
          </div>
        </div>

        <!-- Utleie-felter -->
        <div id="utleie-fields">
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label">Estimert leieinntekt (kr/mnd)</label>
              <input type="number" class="form-input" id="f-leie" value="${vn('leieinntektEstimat')}" step="500" min="0" oninput="recalcYield()">
            </div>
            <div class="form-group">
              <label class="form-label">Brutto yield est. (%)</label>
              <input type="number" class="form-input" id="f-yield" value="${vn('yieldEstimat')}" step="0.1" min="0" max="20" placeholder="Beregnes automatisk">
              <span class="form-hint">Beregnes fra leie / pris, eller skriv manuelt</span>
            </div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label">Netto yield est. (%)</label>
              <input type="number" class="form-input" id="f-nettoyield" value="${vn('nettoYield')}" step="0.1" min="0" max="20">
            </div>
            <div class="form-group">
              <label class="form-label">Månedlig CF est. (kr)</label>
              <input type="number" class="form-input" id="f-cf" value="${vn('kontantstroemEstimat')}" step="100" placeholder="Etter lån og kostnader">
            </div>
          </div>
        </div>

        <!-- Flipp-felter -->
        <div id="flipp-fields" class="hidden">
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label">Rehab-kostnad est. (kr)</label>
              <input type="number" class="form-input" id="f-rehab" value="${vn('rehabKostnad')}" step="50000" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Estimert salgsverdi (kr)</label>
              <input type="number" class="form-input" id="f-salgsverdi" value="${vn('estimertSalgsverdi')}" step="50000" min="0">
            </div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label">Brutto fortjeneste est. (kr)</label>
              <input type="number" class="form-input" id="f-fortjeneste" value="${vn('bruttoFortjeneste')}" step="50000" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Flipp ROI est. (%)</label>
              <input type="number" class="form-input" id="f-fliproi" value="${vn('flipROI')}" step="0.5" min="0">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ③ INVESTORDATA -->
    <div class="form-section" id="sec-investor">
      <div class="form-section-header" onclick="toggleSection('sec-investor')">
        <div class="form-section-icon gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
        <span class="form-section-title">Investordata</span>
        <svg class="form-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="form-section-body">
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Tilstand</label>
            <select class="form-select" id="f-tilstand">
              ${['Nyoppusset','God stand','Noe slitasje','Oppussing nødvendig'].map(t =>
                `<option ${v('tilstand') === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Utleiepotensial</label>
            <select class="form-select" id="f-utleiepotensial">
              ${['Svært høyt','Høyt','Middels','Lavt'].map(u =>
                `<option ${v('utleiepotensial') === u ? 'selected' : ''}>${u}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Investor-score (0–100)</label>
          <input type="range" id="f-score" min="0" max="100" step="1"
            value="${vn('investorScore') || 70}"
            oninput="updateScorePreview(this.value)"
            style="width:100%;accent-color:var(--navy);cursor:pointer">
          <div class="score-preview">
            <div class="score-preview-value" id="score-preview-val"
              style="color:${scoreColor(vn('investorScore') || 70)}">${vn('investorScore') || 70}</div>
            <div class="score-preview-bar-wrap">
              <div class="score-bar">
                <div class="score-bar-fill" id="score-bar-fill"
                  style="width:${vn('investorScore') || 70}%;background:${scoreColor(vn('investorScore') || 70)}"></div>
              </div>
              <div class="score-bar-labels"><span>0 — Svakt</span><span>50 — Moderat</span><span>100 — Sterkt</span></div>
            </div>
          </div>
          <span class="form-hint">Basert på yield, kontantstrøm, tilstand og beliggenhet</span>
        </div>
      </div>
    </div>

    <!-- ④ BILDER -->
    <div class="form-section" id="sec-bilder">
      <div class="form-section-header" onclick="toggleSection('sec-bilder')">
        <div class="form-section-icon purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
        <span class="form-section-title">Bilder <span style="font-size:11px;font-weight:400;color:var(--gray-400)" id="img-count-label">(${(obj?.bilder || []).length} bilder)</span></span>
        <svg class="form-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="form-section-body">
        <p style="font-size:12px;color:var(--gray-500);margin-bottom:8px">Legg inn Unsplash-URL-er eller direkte lenker til bilder. Første bilde brukes som forsidebilde.</p>
        <div class="img-list" id="img-list">
          ${(obj?.bilder || []).map((url, i) => imgItemHTML(url, i)).join('')}
        </div>
        <div class="add-img-row">
          <input type="text" class="form-input" id="new-img-url" placeholder="https://images.unsplash.com/photo-…?w=800&q=80" class="form-input mono">
          <button class="btn btn-secondary btn-sm" onclick="addImage()" style="flex-shrink:0">Legg til</button>
        </div>
        <p style="font-size:11px;color:var(--gray-400);margin-top:6px">
          Eksempel: <code style="font-family:var(--font-mono);font-size:10px;background:var(--gray-100);padding:1px 4px;border-radius:3px">https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80</code>
        </p>
      </div>
    </div>

    <!-- ⑤ MEGLER OG META -->
    <div class="form-section collapsed" id="sec-meta">
      <div class="form-section-header" onclick="toggleSection('sec-meta')">
        <div class="form-section-icon gray"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
        <span class="form-section-title">Megler og metadata</span>
        <svg class="form-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="form-section-body">
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Meglernavn</label>
            <input type="text" class="form-input" id="f-meglernavn" value="${v('meglerNavn')}" placeholder="Navn Navnesen">
          </div>
          <div class="form-group">
            <label class="form-label">Meglerfirma</label>
            <input type="text" class="form-input" id="f-meglerfirma" value="${v('meglerFirma')}" placeholder="Meglerfirma AS">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Lenke til original annonse</label>
          <input type="url" class="form-input" id="f-annonse" value="${v('originalAnnonse')}" placeholder="https://www.finn.no/…">
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Nabolag — kollektiv</label>
            <input type="text" class="form-input" id="f-n-kollektiv" value="${obj?.nabolag?.kollektiv || ''}" placeholder="8 min til T-bane">
          </div>
          <div class="form-group">
            <label class="form-label">Nabolag — snitt kr/m²</label>
            <input type="number" class="form-input" id="f-n-snittpris" value="${obj?.nabolag?.snittprisOmrade || ''}" step="1000" min="0">
          </div>
        </div>
      </div>
    </div>

    <!-- ⑥ INNSTILLINGER -->
    <div class="form-section collapsed" id="sec-innst">
      <div class="form-section-header" onclick="toggleSection('sec-innst')">
        <div class="form-section-icon red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/></svg></div>
        <span class="form-section-title">Innstillinger</span>
        <svg class="form-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="form-section-body">
        <div class="form-toggle-row">
          <div>
            <div class="form-toggle-label">Premium-objekt</div>
            <div class="form-toggle-desc">Kun synlig for Pro- og Investor-brukere</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="f-premium" ${obj?.premium ? 'checked' : ''} onchange="markDirty()">
            <div class="toggle-track"></div>
            <div class="toggle-thumb"></div>
          </label>
        </div>
      </div>
    </div>
  `;

  // Init strategy fields visibility
  updateStrategyFields();

  // Mark dirty on any input change
  document.querySelectorAll('#form-body input, #form-body select, #form-body textarea').forEach(el => {
    el.addEventListener('input', markDirty);
    el.addEventListener('change', markDirty);
  });
}

/* ── FORM HELPERS ─────────────────────────────── */

window.toggleSection = function(id) {
  document.getElementById(id).classList.toggle('collapsed');
};

window.updateStrategyFields = function() {
  const s = document.getElementById('f-strategi')?.value;
  document.getElementById('utleie-fields')?.classList.toggle('hidden', s !== 'utleie');
  document.getElementById('flipp-fields')?.classList.toggle('hidden',  s !== 'flipp');
};

window.recalcTotalPris = function() {
  const p = parseFloat(document.getElementById('f-pris')?.value)  || 0;
  const g = parseFloat(document.getElementById('f-fellesgjeld')?.value) || 0;
  const t = document.getElementById('f-totalpris');
  if (t) t.value = p + g;
  recalcYield();
};

window.recalcYield = function() {
  const p  = parseFloat(document.getElementById('f-pris')?.value)  || 0;
  const l  = parseFloat(document.getElementById('f-leie')?.value)  || 0;
  const yEl = document.getElementById('f-yield');
  if (yEl && p > 0 && l > 0) {
    yEl.value = ((l * 12 / p) * 100).toFixed(2);
  }
};

window.updateScorePreview = function(val) {
  const col = scoreColor(parseInt(val));
  document.getElementById('score-preview-val').textContent  = val;
  document.getElementById('score-preview-val').style.color  = col;
  document.getElementById('score-bar-fill').style.width     = val + '%';
  document.getElementById('score-bar-fill').style.background = col;
};

function scoreColor(s) {
  if (s >= 80) return 'var(--green)';
  if (s >= 65) return 'var(--amber)';
  return 'var(--red)';
}

/* ── IMAGE MANAGER ────────────────────────────── */

function imgItemHTML(url, i) {
  return `
    <div class="img-item" id="img-item-${i}" data-url="${url}">
      <img src="${url}" class="img-item-thumb" alt="" onerror="this.classList.add('placeholder');this.outerHTML='<div class=\\'img-item-thumb placeholder\\'><svg width=\\'18\\' height=\\'18\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'/></svg></div>'">
      <span class="img-item-url" title="${url}">${url}</span>
      <div class="img-item-actions">
        ${i > 0 ? `<button class="table-action-btn" onclick="moveImg(${i}, -1)" title="Flytt opp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg></button>` : ''}
        <button class="table-action-btn danger" onclick="removeImg(${i})" title="Fjern bilde"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
    </div>`;
}

function getImgUrls() {
  return [...document.querySelectorAll('#img-list .img-item')].map(el => el.dataset.url);
}

function refreshImgList() {
  const urls = getImgUrls();
  document.getElementById('img-list').innerHTML = urls.map((u, i) => imgItemHTML(u, i)).join('');
  document.getElementById('img-count-label').textContent = `(${urls.length} bilder)`;
  markDirty();
}

window.addImage = function() {
  const inp = document.getElementById('new-img-url');
  const url = inp.value.trim();
  if (!url) { adminToast('Skriv inn en URL', 'error'); return; }

  const list = document.getElementById('img-list');
  const idx  = getImgUrls().length;
  const div  = document.createElement('div');
  div.innerHTML = imgItemHTML(url, idx);
  list.appendChild(div.firstElementChild);
  inp.value = '';
  document.getElementById('img-count-label').textContent = `(${idx + 1} bilder)`;
  markDirty();
};

window.removeImg = function(i) {
  const items = document.querySelectorAll('#img-list .img-item');
  items[i]?.remove();
  refreshImgList();
};

window.moveImg = function(i, dir) {
  const urls = getImgUrls();
  const ni   = i + dir;
  if (ni < 0 || ni >= urls.length) return;
  [urls[i], urls[ni]] = [urls[ni], urls[i]];
  document.getElementById('img-list').innerHTML = urls.map((u, j) => imgItemHTML(u, j)).join('');
  markDirty();
};

/* ── SAVE FORM ────────────────────────────────── */

window.saveForm = function(targetStatus) {
  const tittel = document.getElementById('f-tittel')?.value.trim();
  if (!tittel) {
    adminToast('Tittel / adresse er påkrevd', 'error');
    document.getElementById('f-tittel').focus();
    return;
  }

  const by = document.getElementById('f-by')?.value.trim();
  if (!by) {
    adminToast('By er påkrevd', 'error');
    document.getElementById('f-by').focus();
    return;
  }

  const strategi = document.getElementById('f-strategi')?.value;
  const status   = document.getElementById('form-status-toggle')?.dataset.status === 'Inaktiv'
    ? 'Inaktiv' : targetStatus;

  const obj = {
    id:            currentEdit || `obj-${Date.now()}`,
    tittel,
    adresse:       document.getElementById('f-adresse')?.value.trim() || tittel,
    by,
    fylke:         by,
    type:          document.getElementById('f-type')?.value          || 'Leilighet',
    strategi,
    eierform:      document.getElementById('f-eierform')?.value       || 'Selveier',
    rom:           parseInt(document.getElementById('f-rom')?.value)  || 0,
    areal:         parseInt(document.getElementById('f-areal')?.value)|| 0,
    etasje:        document.getElementById('f-etasje')?.value         || '',
    byggeaar:      parseInt(document.getElementById('f-byggeaar')?.value) || 0,
    prisantydning: parseFloat(document.getElementById('f-pris')?.value) || 0,
    fellesgjeld:   parseFloat(document.getElementById('f-fellesgjeld')?.value) || 0,
    totalPris:     parseFloat(document.getElementById('f-totalpris')?.value)   || 0,
    felleskostnader: parseFloat(document.getElementById('f-felleskost')?.value)|| 0,
    tilstand:      document.getElementById('f-tilstand')?.value        || 'God stand',
    utleiepotensial: document.getElementById('f-utleiepotensial')?.value || 'Høyt',
    investorScore: parseInt(document.getElementById('f-score')?.value) || 70,
    premium:       document.getElementById('f-premium')?.checked       || false,
    meglerNavn:    document.getElementById('f-meglernavn')?.value      || '',
    meglerFirma:   document.getElementById('f-meglerfirma')?.value     || '',
    originalAnnonse: document.getElementById('f-annonse')?.value      || '#',
    beskrivelse:   document.getElementById('f-beskrivelse')?.value     || '',
    status,
    lagt_til:      currentEdit
      ? (OBJEKTER.find(o => o.id === currentEdit)?.lagt_til || new Date().toISOString().slice(0,10))
      : new Date().toISOString().slice(0,10),
    bilder:        getImgUrls(),
    nabolag: {
      kollektiv:       document.getElementById('f-n-kollektiv')?.value || '',
      snittprisOmrade: parseInt(document.getElementById('f-n-snittpris')?.value) || 0,
    },
    fasiliteter: [],
  };

  // Strategy-specific fields
  if (strategi === 'utleie') {
    obj.leieinntektEstimat      = parseFloat(document.getElementById('f-leie')?.value)     || 0;
    obj.yieldEstimat            = parseFloat(document.getElementById('f-yield')?.value)    || null;
    obj.nettoYield              = parseFloat(document.getElementById('f-nettoyield')?.value)|| null;
    obj.kontantstroemEstimat    = parseFloat(document.getElementById('f-cf')?.value)       || null;
  } else {
    obj.rehabKostnad            = parseFloat(document.getElementById('f-rehab')?.value)    || 0;
    obj.estimertSalgsverdi      = parseFloat(document.getElementById('f-salgsverdi')?.value)|| 0;
    obj.bruttoFortjeneste       = parseFloat(document.getElementById('f-fortjeneste')?.value)||0;
    obj.flipROI                 = parseFloat(document.getElementById('f-fliproi')?.value)  || null;
  }

  // Lagre
  const saveBtn = document.getElementById('form-save-btn');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Lagrer…'; }

  const lagre = async () => {
    if (window.Supa) {
      // Supabase: konverter status til lowercase før lagring
      const supabaseObj = { ...obj, status: status.toLowerCase() };
      if (currentEdit) {
        await window.Supa.admin.adminOppdaterObjekt(currentEdit, supabaseObj);
      } else {
        await window.Supa.admin.adminOpprettObjekt(supabaseObj);
      }
      await lastInnObjekter();
    } else {
      // Fallback: lokal array
      if (currentEdit) {
        const idx = OBJEKTER.findIndex(o => o.id === currentEdit);
        if (idx !== -1) OBJEKTER[idx] = obj;
      } else {
        OBJEKTER.unshift(obj);
      }
      renderTable();
      renderStats();
      updateNavCounts();
      resetAndPopulateByFilter();
    }

    isDirty = false;
    closeForm();
    const msg = currentEdit
      ? `«${tittel}» oppdatert — ${status}`
      : `«${tittel}» opprettet — ${status}`;
    adminToast(msg, 'success');
  };

  lagre().catch(err => {
    adminToast('Lagring feilet: ' + err.message, 'error');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Lagre'; }
  });
};

/* ── STATUS TOGGLE ────────────────────────────── */

window.promptDelete = function() {
  const obj = currentEdit ? OBJEKTER.find(o => o.id === currentEdit) : null;
  if (!obj) return;
  openConfirm(
    `Slett «${obj.tittel}»?`,
    'Objektet slettes permanent og kan ikke gjenopprettes.',
    async () => {
      try {
        if (window.Supa) {
          await window.Supa.admin.adminSlettObjekt(currentEdit);
          closeForm();
          await lastInnObjekter();
        } else {
          const idx = OBJEKTER.findIndex(o => o.id === currentEdit);
          if (idx !== -1) OBJEKTER.splice(idx, 1);
          closeForm();
          renderTable();
          renderStats();
          updateNavCounts();
          resetAndPopulateByFilter();
        }
        adminToast(`«${obj.tittel}» er slettet`, 'info');
      } catch (err) {
        adminToast('Sletting feilet: ' + err.message, 'error');
      }
    }
  );
};

window.promptDeleteById = function(id) {
  const obj = OBJEKTER.find(o => o.id === id);
  if (!obj) return;
  openConfirm(
    `Slett «${obj.tittel}»?`,
    'Objektet slettes permanent og kan ikke gjenopprettes.',
    async () => {
      try {
        if (window.Supa) {
          await window.Supa.admin.adminSlettObjekt(id);
          await lastInnObjekter();
        } else {
          const idx = OBJEKTER.findIndex(o => o.id === id);
          if (idx !== -1) OBJEKTER.splice(idx, 1);
          renderTable();
          renderStats();
          updateNavCounts();
          resetAndPopulateByFilter();
        }
        adminToast(`«${obj.tittel}» er slettet`, 'info');
      } catch (err) {
        adminToast('Sletting feilet: ' + err.message, 'error');
      }
    }
  );
};

/* ── USER TABLE ───────────────────────────────── */

function renderUserTable() {
  const tbody = document.getElementById('usr-tbody');
  tbody.innerHTML = BRUKERE.map(u => `
    <tr>
      <td style="font-weight:600;color:var(--gray-900)">${u.navn}</td>
      <td style="font-family:var(--font-mono);font-size:12px">${u.epost}</td>
      <td>
        <span class="status-pill ${u.plan === 'Gratis' ? 'utkast' : 'publisert'}" style="font-size:10px">
          ${u.plan}
        </span>
      </td>
      <td style="color:var(--gray-400)">${u.dato}</td>
      <td><span class="status-pill ${u.status === 'Aktiv' ? 'publisert' : 'inaktiv'}">${u.status}</span></td>
    </tr>`).join('');
}

/* ── CONFIRM MODAL ────────────────────────────── */

function openConfirm(title, text, onOk) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-text').textContent  = text;
  confirmCallback = onOk;
  document.getElementById('confirm-overlay').classList.add('open');
}

window.closeConfirm = function() {
  document.getElementById('confirm-overlay').classList.remove('open');
  confirmCallback = null;
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('confirm-ok-btn').addEventListener('click', () => {
    confirmCallback?.();
    closeConfirm();
  });
});

/* ── EXPORT ───────────────────────────────────── */

window.exportCSV = function() {
  const res = filtrerObjekter();
  const headers = ['ID','Tittel','By','Type','Strategi','Pris','Fellesgjeld','Yield','Score','Status'];
  const rows = res.map(o => [
    o.id, o.tittel, o.by, o.type, o.strategi,
    o.prisantydning, o.fellesgjeld, o.yieldEstimat || '',
    o.investorScore || '', o.status
  ].map(v => `"${v}"`).join(','));
  const csv  = [headers.join(','), ...rows].join('\n');
  const link = document.createElement('a');
  link.href  = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  link.download = `objekter-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  adminToast('CSV eksportert', 'success');
};

/* ── TOAST ────────────────────────────────────── */

function adminToast(msg, type = 'info') {
  let tc = document.getElementById('admin-toast-container');
  const el = document.createElement('div');
  el.className = `admin-toast ${type}`;
  el.innerHTML = `<span>${msg}</span>`;
  tc.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

/* re-export markDirty globally */
window.markDirty = markDirty;
function markDirty() {
  isDirty = true;
  document.getElementById('unsaved-dot')?.classList.add('visible');
}