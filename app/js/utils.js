/* ══════════════════════════════════════════════════
   AIONEX — Shared Utilities
   ══════════════════════════════════════════════════ */

const N8N_BASE_URL = 'https://vps-6207995-x.dattaweb.com';

// ── Cookies ──────────────────────────────────────

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name, value, days) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; path=/; max-age=0`;
}


// ── Toast Notifications ──────────────────────────

function showToast(message, type = 'error') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type}`;
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => toast.classList.remove('visible'), 4000);
}


// ── Fetch with Timeout ───────────────────────────

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('La conexión tardó demasiado. Verificá tu red e intentá de nuevo.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}


// ── Date / Time Formatters ───────────────────────

const HORA_INICIO = 8;
const HORA_FIN    = 18;
const INTERVALO   = 30; // en minutos

function generarHorarios() {
  const slots = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    for (let m = 0; m < 60; m += INTERVALO) {
      slots.push(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
    }
  }
  return slots;
}

function formatFechaDisplay(dateStr) {
  if (!dateStr) return '';
  const justDate = dateStr.split('T')[0];
  const [y, m, d] = justDate.split('-');
  return `${d}/${m}/${y}`;
}

function formatHoraDisplay(horaStr) {
  return horaStr ? horaStr.substring(0, 5) : '';
}


// ── Session Helpers ──────────────────────────────

function cerrarSesion() {
  deleteCookie('session_id');
  window.location.href = 'index.html';
}

function getSessionOrRedirect() {
  const sessionId = getCookie('session_id');
  if (!sessionId) {
    window.location.href = 'index.html';
    return null;
  }
  return sessionId;
}

// ── Null / Safe Value Helper ─────────────────────

function safeVal(val, fallback = '—') {
  if (val === null || val === undefined || val === 'null' || val === '' || val === 'undefined') {
    return fallback;
  }
  return val;
}


// ── WhatsApp Helper ──────────────────────────────

function buildWhatsAppUrl(telefono) {
  if (!telefono || ['null', 'undefined', ''].includes(String(telefono).trim())) return null;
  const digits = String(telefono).replace(/\D/g, '');
  if (digits.length < 8) return null;
  let normalized = digits;
  if (normalized.startsWith('0')) normalized = '54' + normalized.slice(1);
  else if (!normalized.startsWith('54')) normalized = '54' + normalized;
  if (normalized.length < 10 || normalized.length > 15) return null;
  return `https://wa.me/${normalized}`;
}


// ── Icons (Lucide) Helper & Auto-Render ────────
function refreshIcons(target) {
  if (typeof lucide !== 'undefined') {
    try {
      lucide.createIcons(target ? { nodes: [target] } : undefined);
    } catch (e) {
      console.warn('Error rendering icons:', e);
    }
  }
}

if (typeof lucide !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    refreshIcons();
  });
}
