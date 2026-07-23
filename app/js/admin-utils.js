const SUPABASE_URL = 'https://fosblgvcfhmkvbbejiid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvc2JsZ3ZjZmhta3ZiYmVqaWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTA0MjEsImV4cCI6MjA5OTIyNjQyMX0.shrNEOCsWnD7i9VuMRt2nNuLzaq3qot3uq82PAYkQ2c';

const ADMIN_N8N_PREFIX = `${N8N_BASE_URL}/webhook/admin`;

let supabaseClient = null;

// Initialize Supabase if the script is loaded
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Checks if the admin is logged in via Supabase Auth.
 * If not, redirects to the admin login page (index.html).
 * Must be called in async functions.
 */
async function getAdminSessionOrRedirect() {
  if (!supabaseClient) return null;
  const { data, error } = await supabaseClient.auth.getSession();
  
  if (error || !data.session) {
    window.location.href = 'index.html';
    return null;
  }

  // Setup mobile menu toggle logic if elements are present
  setTimeout(() => {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuBtn && navMenu && !mobileMenuBtn.dataset.initialized) {
      mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
      mobileMenuBtn.dataset.initialized = 'true';
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!mobileMenuBtn.contains(e.target) && !navMenu.contains(e.target)) {
          navMenu.classList.remove('active');
        }
      });
    }
  }, 0);

  return data.session;
}

/**
 * Wrapper for fetchWithTimeout that automatically injects the Supabase JWT
 * in the Authorization header.
 */
async function adminFetch(url, options = {}, timeoutMs = 8000) {
  const session = await getAdminSessionOrRedirect();
  if (!session) throw new Error("No admin session");

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${session.access_token}`
  };

  return fetchWithTimeout(url, { ...options, headers }, timeoutMs);
}

/**
 * Logs the admin out and redirects to login page.
 */
async function adminLogout() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  window.location.href = 'index.html';
}

/**
 * Centralized navigation renderer for admin pages.
 * @param {string} activePage - Name of current page ('dashboard', 'turnos', 'clientes', 'servicios', 'tipos-servicio')
 */
function renderAdminNav(activePage = '') {
  const header = document.querySelector('.admin-topnav') || document.getElementById('adminTopnavContainer');
  if (!header) return;

  header.className = 'admin-topnav';
  header.innerHTML = `
    <div class="admin-topnav-left">
      <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
      <div class="brand" style="margin-bottom: 0;">
        <div class="brand-icon" style="width:32px; height:32px;"><img src="../assets/logo-aionex.svg" alt="AIONEX" /></div>
        <span class="brand-name" style="font-size:1.2rem;">AIONEX</span>
        <span class="admin-badge-inline">ADMIN</span>
      </div>
    </div>

    <nav class="nav-menu" id="navMenu">
      <div class="nav-section-title">Principal</div>
      <a href="dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">
        <span class="icon"><i data-lucide="layout-dashboard"></i></span>
        Dashboard
      </a>
      <div class="nav-section-title">Gestión</div>
      <a href="turnos.html" class="nav-link ${activePage === 'turnos' ? 'active' : ''}">
        <span class="icon"><i data-lucide="calendar"></i></span>
        Turnos
      </a>
      <a href="clientes.html" class="nav-link ${['clientes', 'cliente-detalle'].includes(activePage) ? 'active' : ''}">
        <span class="icon"><i data-lucide="users"></i></span>
        Clientes
      </a>
      <a href="servicios.html" class="nav-link ${activePage === 'servicios' ? 'active' : ''}">
        <span class="icon"><i data-lucide="settings"></i></span>
        Servicios
      </a>
      <a href="tipos-servicio.html" class="nav-link ${activePage === 'tipos-servicio' ? 'active' : ''}">
        <span class="icon"><i data-lucide="tag"></i></span>
        Tipos de Servicio
      </a>
    </nav>
    
    <div class="admin-topnav-right">
      <div class="user-pill" id="userPill">
        <div class="avatar" id="userAvatar">A</div>
        <span id="userName">Admin</span>
        <button class="logout-btn" id="logoutBtn" title="Cerrar sesión"><i data-lucide="log-out"></i></button>
      </div>
    </div>
  `;

  // Attach mobile menu behavior
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.onclick = (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('active');
    };
    document.onclick = (e) => {
      if (!mobileMenuBtn.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('active');
      }
    };
  }

  // Attach logout behavior
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = adminLogout;
  }

  if (typeof refreshIcons === 'function') {
    refreshIcons(header);
  } else if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Ensure N8N_BASE_URL and fetchWithTimeout are available from utils.js
if (typeof N8N_BASE_URL === 'undefined') {
  console.error('admin-utils.js requires utils.js to be loaded first.');
}
