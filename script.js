// SEARCH FUNCTION
async function searchServices() {
  const location = document.getElementById("locationInput").value;

  try {
    const res = await fetch(`http://127.0.0.1:5000/api/centers?location=${location}`);
    const data = await res.json();

    let html = "";

    data.forEach(c => {
      html += `
        <div style="border:1px solid #ccc; margin:10px; padding:10px;">
          <h3>${c.name}</h3>
         // ── State ──────────────────────────────────────────────
let allResults = [];
let currentFilter = 'all';

// ── Banner ─────────────────────────────────────────────
function closeBanner() {
  const banner = document.getElementById('emergencyBanner');
  if (banner) {
    banner.style.display = 'none';
    // Adjust header sticky top
    const header = document.querySelector('.site-header');
    if (header) header.style.top = '0';
  }
}

// ── Type → tag class mapping ───────────────────────────
const typeMap = {
  'medical':    { label: 'Medical',     cls: 'medical',  icon: '+' },
  'legal aid':  { label: 'Legal Aid',   cls: 'legal',    icon: 'L' },
  'shelter':    { label: 'Shelter',     cls: 'shelter',  icon: 'S' },
  'counselling':{ label: 'Counselling', cls: 'mental',   icon: 'C' },
};

function getTypeInfo(type = '') {
  return typeMap[type.toLowerCase()] || { label: type, cls: '', icon: '*' };
}

// ── Render Cards ───────────────────────────────────────
function renderCards(data) {
  const grid = document.getElementById('results');
  const empty = document.getElementById('emptyState');

  if (!data || data.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  grid.innerHTML = data.map((c, i) => {
    const info = getTypeInfo(c.type);
    const location = c.location || '';
    const county = c.county ? ` · ${c.county} County` : '';

    return `
      <div class="facility-card" style="animation-delay:${i * 0.05}s">
        <div class="card-top">
          <div class="card-icon">${info.icon}</div>
          <span class="card-badge">${info.label}</span>
        </div>
        <div class="card-name">${c.name}</div>
        <div class="card-meta">
          <div class="meta-item">
            <span class="meta-icon">Location:</span>
            <span>${location}${county}</span>
          </div>
          ${c.phone ? `
          <div class="meta-item">
            <span class="meta-icon">Phone:</span>
            <span>${c.phone}</span>
          </div>` : ''}
        </div>
        <div class="card-tags">
          <span class="tag ${info.cls}">${info.label}</span>
        </div>
        <div class="card-footer">
          <a href="tel:${c.phone}" class="btn-call">Call Now</a>
        </div>
      </div>
    `;
  }).join('');
}

// ── Filter ─────────────────────────────────────────────
function filterServices(type) {
  currentFilter = type;

  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Filter in memory
  if (type === 'all') {
    renderCards(allResults);
    return;
  }

  const filterMap = {
    medical: 'medical',
    legal:   'legal aid',
    shelter: 'shelter',
    mental:  'counselling',
  };

  const filtered = allResults.filter(
    c => c.type?.toLowerCase() === filterMap[type]
  );
  renderCards(filtered);
}

// ── Search ─────────────────────────────────────────────
async function searchServices() {
  const input = document.getElementById('locationInput');
  const location = input.value.trim();

  const loading = document.getElementById('loadingState');
  const error   = document.getElementById('errorState');
  const empty   = document.getElementById('emptyState');
  const grid    = document.getElementById('results');

  // Show skeleton loader
  error.classList.add('hidden');
  empty.classList.add('hidden');
  grid.innerHTML = '';
  loading.innerHTML = `
    <div class="skeleton-grid">
      ${Array(6).fill('<div class="skeleton-card"></div>').join('')}
    </div>`;

  try {
    const url = location
      ? `http://127.0.0.1:5000/api/centers?location=${encodeURIComponent(location)}`
      : `http://127.0.0.1:5000/api/centers`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Server error');

    allResults = await res.json();
    loading.innerHTML = '';

    // Re-apply active filter
    if (currentFilter !== 'all') {
      filterServices_internal(currentFilter);
    } else {
      renderCards(allResults);
    }

  } catch (err) {
    loading.innerHTML = '';
    error.classList.remove('hidden');
    console.error('Fetch error:', err);
  }
}

// Internal filter (no event dependency)
function filterServices_internal(type) {
  const filterMap = {
    medical: 'medical',
    legal:   'legal aid',
    shelter: 'shelter',
    mental:  'counselling',
  };
  if (type === 'all') { renderCards(allResults); return; }
  const filtered = allResults.filter(
    c => c.type?.toLowerCase() === filterMap[type]
  );
  renderCards(filtered);
}

// ── Geolocation ────────────────────────────────────────
function getLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by this browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition(showPosition, showError);
}

async function showPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  // Reverse geocode using free Nominatim API
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await res.json();

    // Try to extract city/town/county
    const addr = data.address || {};
    const place =
      addr.city || addr.town || addr.village ||
      addr.county || addr.state_district || 'Kenya';

    document.getElementById('locationInput').value = place;
  } catch {
    document.getElementById('locationInput').value = 'Nairobi';
  }

  searchServices();
}

function showError() {
  alert('Unable to retrieve your location. Please type it manually.');
}

// ── Auto-load on page ready ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  searchServices();

  // Allow Enter key in search input
  document.getElementById('locationInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchServices();
  });
});

