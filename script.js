// GLOBAL STATE
let allResults = [];
let currentFilter = 'all';

// TYPE MAPPING
const typeMap = {
  'medical':    { label: 'Medical',     cls: 'medical',  icon: '+' },
  'legal aid':  { label: 'Legal Aid',   cls: 'legal',    icon: 'L' },
  'shelter':    { label: 'Shelter',     cls: 'shelter',  icon: 'S' },
  'counselling':{ label: 'Counselling', cls: 'mental',   icon: 'C' },
};

function getTypeInfo(type = '') {
  return typeMap[type.toLowerCase()] || { label: type, cls: '', icon: '*' };
}

// RENDER CARDS
function renderCards(data) {
  const grid = document.getElementById('results');
  const empty = document.getElementById('emptyState');

  if (!data || data.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  grid.innerHTML = data.map((c) => {
    const info = getTypeInfo(c.type);
    const location = c.location || '';
    const county = c.county ? ` · ${c.county} County` : '';

    return `
      <div class="facility-card">
        <div class="card-top">
          <div class="card-icon">${info.icon}</div>
          <span class="card-badge">${info.label}</span>
        </div>

        <div class="card-name">${c.name}</div>

        <div class="card-meta">
          <div class="meta-item">
            <span>${location}${county}</span>
          </div>

          ${c.phone ? `
          <div class="meta-item">
            <span>${c.phone}</span>
          </div>` : ''}
        </div>

        <div class="card-tags">
          <span class="tag ${info.cls}">${info.label}</span>
        </div>

        <div class="card-footer">
          ${c.phone ? `<a href="tel:${c.phone}" class="btn-call">Call Now</a>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// FILTER
function filterServices(type) {
  currentFilter = type;

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  event.target.classList.add('active');

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

// SEARCH
async function searchServices() {
  const input = document.getElementById('locationInput');
  const location = input.value.trim();

  const loading = document.getElementById('loadingState');
  const error   = document.getElementById('errorState');
  const empty   = document.getElementById('emptyState');
  const grid    = document.getElementById('results');

  error.classList.add('hidden');
  empty.classList.add('hidden');
  grid.innerHTML = '';

  if (!location) {
    empty.classList.remove('hidden');
    empty.innerHTML = "<p>Please enter a location to search</p>";
    return;
  }

  loading.innerHTML = `
    <div class="skeleton-grid">
      ${Array(6).fill('<div class="skeleton-card"></div>').join('')}
    </div>`;

  try {
    const res = await fetch(`/api/centers?location=${encodeURIComponent(location)}`);

    if (!res.ok) throw new Error('Server error');

    allResults = await res.json();
    loading.innerHTML = '';

    renderCards(allResults);

  } catch (err) {
    loading.innerHTML = '';
    error.classList.remove('hidden');
    console.error("Fetch error:", err);
  }
}

// GEOLOCATION
function getLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
        );
        const data = await res.json();

        const addr = data.address || {};

        const place =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.county ||
          addr.state ||
          "Nairobi";

        document.getElementById("locationInput").value = place;

        searchServices();

      } catch (err) {
        console.error("Geolocation error:", err);
        document.getElementById("locationInput").value = "Nairobi";
        searchServices();
      }
    },
    () => {
      alert("Please allow location access");
    }
  );
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
  renderCards([]);

  document.getElementById('locationInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchServices();
  });
});

