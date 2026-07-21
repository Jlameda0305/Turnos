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

// Ensure N8N_BASE_URL and fetchWithTimeout are available from utils.js
if (typeof N8N_BASE_URL === 'undefined') {
  console.error('admin-utils.js requires utils.js to be loaded first.');
}
