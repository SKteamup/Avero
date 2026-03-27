/* ============================================================
   js/auth.js
   Sidespesifikk logikk for logg-inn, registrer, glemt-passord.
   Kobler til js/supabase/auth.js for alle Supabase-kall.
   ============================================================ */

import {
  loggInn,
  registrer,
  sendTilbakestilling,
  lytt,
} from './supabase/auth.js';

// ── INIT ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const side = location.pathname;

  if (side.includes('logg-inn'))      initLogin();
  if (side.includes('registrer'))     initSignup();
  if (side.includes('glemt-passord')) initForgot();

  // Auth-state lytter: redirect ved innlogging/utlogging
  lytt((event) => {
    if (event === 'SIGNED_IN') {
      const autoRedirect = ['logg-inn', 'registrer'];
      if (autoRedirect.some(s => side.includes(s))) {
        setTimeout(() => { location.href = 'min-side.html'; }, 1000);
      }
    }
    if (event === 'SIGNED_OUT' && side.includes('min-side')) {
      location.href = 'logg-inn.html';
    }
  });
});

// ── LOGIN ─────────────────────────────────────────────────────

function initLogin() {
  initPwToggle('password', 'toggle-pw');

  document.getElementById('login-form')
    ?.addEventListener('submit', async e => {
      e.preventDefault();
      const epost   = val('email');
      const passord = val('password');
      if (!epost || !passord) return;

      const btn = document.getElementById('login-btn');
      setLoading(btn, 'Logger inn…');
      clearErrors();

      try {
        await loggInn({ epost, passord });
        // redirect via lytt()
      } catch (err) {
        resetBtn(btn, 'Logg inn');
        if (err.message?.includes('Invalid login')) {
          showFieldError('pw-error', 'password');
        } else {
          showToastMsg(err.message, 'error');
        }
      }
    });
}

// ── SIGNUP ────────────────────────────────────────────────────

function initSignup() {
  initPwToggle('password', 'toggle-pw');
  initPwStrength('password');

  document.getElementById('signup-form')
    ?.addEventListener('submit', async e => {
      e.preventDefault();

      const navn    = val('name');
      const epost   = val('email');
      const passord = val('password');
      const terms   = document.getElementById('terms')?.checked;

      let ok = true;
      if (!navn)                { showFieldError('name-error',  'name');     ok = false; }
      if (!isEmail(epost))      { showFieldError('email-error', 'email');    ok = false; }
      if ((passord?.length??0) < 8) { showFieldError('pw-error', 'password'); ok = false; }
      if (!terms)               { showFieldError('terms-error');              ok = false; }
      if (!ok) return;

      const btn = document.getElementById('signup-btn');
      setLoading(btn, 'Oppretter konto…');

      try {
        await registrer({ navn, epost, passord });
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('signup-success')?.classList.remove('hidden');
      } catch (err) {
        resetBtn(btn, 'Opprett konto — det er gratis');
        if (err.message?.includes('already registered')) {
          showFieldError('email-error', 'email');
        } else {
          showToastMsg(err.message, 'error');
        }
      }
    });
}

// ── GLEMT PASSORD ─────────────────────────────────────────────

function initForgot() {
  document.getElementById('forgot-form')
    ?.addEventListener('submit', async e => {
      e.preventDefault();
      const epost = val('email');

      if (!isEmail(epost)) {
        showFieldError('email-error', 'email');
        return;
      }

      const btn = document.getElementById('forgot-btn');
      setLoading(btn, 'Sender…');

      try {
        await sendTilbakestilling(epost);
        document.getElementById('forgot-form-state').style.display = 'none';
        document.getElementById('forgot-success')?.classList.remove('hidden');
        const el = document.getElementById('sent-to');
        if (el) el.textContent = epost;
      } catch (err) {
        resetBtn(btn, 'Send tilbakestillingslenke');
        showToastMsg(err.message, 'error');
      }
    });
}

// ── HELPERS ───────────────────────────────────────────────────

function val(id) { return document.getElementById(id)?.value?.trim() ?? ''; }
function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function showFieldError(errId, inputId) {
  document.getElementById(errId)?.classList.remove('hidden');
  if (inputId) document.getElementById(inputId)?.classList.add('error');
}

function clearErrors() {
  document.querySelectorAll('.auth-field-error').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.auth-input').forEach(el => el.classList.remove('error'));
}

function showToastMsg(msg, type) {
  if (typeof showToast === 'function') showToast(msg, type);
  else console.error(msg);
}

function setLoading(btn, label) {
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin .7s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> ${label}`;
  if (!document.getElementById('spin-st')) {
    const s = document.createElement('style');
    s.id = 'spin-st';
    s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
}

function resetBtn(btn, label) {
  if (!btn) return;
  btn.disabled = false;
  btn.textContent = label;
}

function initPwToggle(inputId, btnId) {
  const inp = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (!inp || !btn) return;
  btn.addEventListener('click', () => {
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });
}

function initPwStrength(inputId) {
  const pw = document.getElementById(inputId);
  if (!pw) return;
  pw.addEventListener('input', () => {
    const wrap  = document.getElementById('pw-strength');
    const fill  = document.getElementById('pw-strength-fill');
    const label = document.getElementById('pw-strength-label');
    if (!wrap) return;
    const v = pw.value;
    if (!v) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    let s = 0;
    if (v.length >= 8)           s++;
    if (v.length >= 12)          s++;
    if (/[A-Z]/.test(v))         s++;
    if (/[0-9]/.test(v))         s++;
    if (/[^A-Za-z0-9]/.test(v))  s++;
    const lv = [
      { w: '20%',  bg: 'var(--red)',   l: 'Svakt' },
      { w: '40%',  bg: 'var(--red)',   l: 'Svakt' },
      { w: '60%',  bg: 'var(--amber)', l: 'Moderat' },
      { w: '80%',  bg: 'var(--amber)', l: 'Bra' },
      { w: '100%', bg: 'var(--green)', l: 'Sterkt' },
    ][Math.min(s, 4)];
    fill.style.width      = lv.w;
    fill.style.background = lv.bg;
    if (label) { label.textContent = lv.l; label.style.color = lv.bg; }
  });
}