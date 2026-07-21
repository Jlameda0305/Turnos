/* ══════════════════════════════════════════════════
   AIONEX — Shared Utilities
   ══════════════════════════════════════════════════ */

const N8N_BASE_URL = 'https://vps-6071355-x.dattaweb.com';

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

// ── Icons (Lucide) Auto-Render ─────────────────
if (typeof lucide !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    for (let m of mutations) {
      if (m.addedNodes.length > 0) {
        // Ignorar nodos SVG que Lucide acaba de crear
        for (let node of m.addedNodes) {
          if (node.nodeType === 1 && !node.classList.contains('lucide')) {
            shouldUpdate = true;
            break;
          }
        }
      }
      if (shouldUpdate) break;
    }
    
    if (shouldUpdate) {
      observer.disconnect();
      lucide.createIcons();
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
