/* SafeReach — script.js
   Handles: API calls, search, filter, pagination, modal, error states */

const API_BASE = "http://localhost:3000/api";
const PER_PAGE = 9;

let allCenters   = [];
let filtered     = [];
let currentPage  = 1;
let activeFilter = "all";

/* ── Utility ───── */
function $(id) { return document.getElementById(id); }

function showOnly(...ids) {
  ["loadingState","errorState","emptyState"].forEach(id => {
    $(id).classList.add("hidden");
  });
  ids.forEach(id => $(id) && $(id).classList.remove("hidden"));
}

/* ── Init ────── */
document.addEventListener("DOMContentLoaded", () => {
  loadCenters();

  $("locationInput").addEventListener("keydown", e => {
    if (e.key === "Enter") searchServices();
  });
});

/* ── Load Centers ───── */
async function loadCenters() {
  showOnly("loadingState");
  $("results").innerHTML = "";

  try {
    const res  = await fetch(`${API_BASE}/centers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    allCenters = json.data || json || [];

    if (!Array.isArray(allCenters) || allCenters.length === 0) {
      throw new Error("No data");
    }

    $("statCenters").textContent = allCenters.length + "+";
    filtered = [...allCenters];
    renderCards();
    showOnly();

  } catch (err) {
    console.error("Load error:", err);
    showOnly("errorState");
    $("loadingState").classList.add("hidden");
    $("errorState").classList.remove("hidden");
  }
}

/* ── Search ───────────────────────────────── */
function searchServices() {
  const query = $("locationInput").value.trim().toLowerCase();
  currentPage = 1;

  if (!query) {
    filtered = applyFilter(allCenters, activeFilter);
    renderCards();
    return;
  }

  const searched = allCenters.filter(c => {
    const name    = (c.facility_name || "").toLowerCase();
    const country = (c.country       || "").toLowerCase();
    const region  = (c.region        || c.county || c.state || "").toLowerCase();
    const city    = (c.city          || c.town   || "").toLowerCase();
    return name.includes(query) || country.includes(query)
        || region.includes(query) || city.includes(query);
  });

  filtered = applyFilter(searched, activeFilter);
  renderCards();
}

/* ── Filter ───── */
function filterServices(type) {
  activeFilter = type;
  currentPage  = 1;

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === type);
  });

  const query = $("locationInput").value.trim().toLowerCase();
  let base = query
    ? allCenters.filter(c => {
        const name   = (c.facility_name || "").toLowerCase();
        const region = (c.region || c.county || "").toLowerCase();
        const city   = (c.city   || c.town   || "").toLowerCase();
        return name.includes(query) || region.includes(query) || city.includes(query);
      })
    : [...allCenters];

  filtered = applyFilter(base, type);
  renderCards();
}

function applyFilter(list, type) {
  if (type === "all") return list;

  const map = {
    medical: ["hospital","health","clinic","medical","dispensary","nursing","referral","nhif"],
    legal:   ["legal","law","justice","court","rights","advocacy"],
    shelter: ["shelter","refuge","safe house","home","rehabilitation","rescue"],
    mental:  ["counsell","mental","psycho","therapy","rehab","wellness"],
  };

  const keywords = map[type] || [];
  return list.filter(c => {
    const str = [
      c.facility_name, c.facility_type, c.type, c.services,
    ].join(" ").toLowerCase();
    return keywords.some(kw => str.includes(kw));
  });
}

/* ── Render Cards ────── */
function renderCards() {
  const container = $("results");
  container.innerHTML = "";
  $("pagination").innerHTML = "";

  showOnly();

  if (filtered.length === 0) {
    $("emptyState").classList.remove("hidden");
    return;
  }

  const start = (currentPage - 1) * PER_PAGE;
  const page  = filtered.slice(start, start + PER_PAGE);

  page.forEach((center, idx) => {
    const card = buildCard(center);
    card.style.animationDelay = `${idx * 0.04}s`;
    container.appendChild(card);
  });

  renderPagination();
}

/* ── Build Card ───── */
function buildCard(center) {
  const name  = center.facility_name || center.name || "Health Facility";
  const type  = center.facility_type || center.type || "";
  const city  = center.city  || center.town   || "";
  const region= center.region|| center.county || "";
  const country=center.country|| "Kenya";
  const phone = center.phone || center.contact || center.telephone || "";
  const id    = center.id    || center.facility_id || "";

  const tags  = inferTags(name, type);
  const icon  = inferIcon(name, type);

  const div = document.createElement("div");
  div.className = "facility-card";

  div.innerHTML = `
    <div class="card-top">
      <div class="card-icon">${icon}</div>
      <span class="card-badge">${escHtml(type || "Health Centre")}</span>
    </div>
    <h3 class="card-name">${escHtml(name)}</h3>
    <div class="card-meta">
      <div class="meta-item">
        <span>${escHtml([city, region, country].filter(Boolean).join(", "))}</span>
      </div>
      ${phone ? `<div class="meta-item"><span>${escHtml(phone)}</span></div>` : ""}
    </div>
    <div class="card-tags">${tags.map(t => `<span class="tag ${t.cls}">${t.label}</span>`).join("")}</div>
    <div class="card-footer">
      <button class="btn-detail" onclick="viewDetails('${escHtml(id)}', '${escHtml(name)}')">
        View Details
      </button>
      ${phone ? `<a class="btn-call" href="tel:${escHtml(phone)}">Call</a>` : ""}
    </div>
  `;
  return div;
}

function inferIcon(name, type) {
  const s = (name + " " + type).toLowerCase();
  if (s.includes("hospital") || s.includes("referral")) return "Hospital";
  if (s.includes("dispensary"))                          return "Dispensary";
  if (s.includes("nursing"))                             return "Nursing";
  if (s.includes("clinic"))                              return "Clinic";
  return "Hospital";
}

function inferTags(name, type) {
  const s = (name + " " + type).toLowerCase();
  const tags = [];
  if (s.includes("hospital") || s.includes("clinic") || s.includes("medical") ||
      s.includes("health") || s.includes("dispensary") || s.includes("nursing"))
    tags.push({ cls: "medical", label: "Medical" });
  if (s.includes("legal") || s.includes("law") || s.includes("rights"))
    tags.push({ cls: "legal", label: "Legal Aid" });
  if (s.includes("shelter") || s.includes("refuge") || s.includes("safe house"))
    tags.push({ cls: "shelter", label: "Shelter" });
  if (s.includes("counsel") || s.includes("mental") || s.includes("psycho"))
    tags.push({ cls: "mental", label: "Counselling" });
  if (tags.length === 0) tags.push({ cls: "", label: "Healthcare" });
  return tags;
}

/* ── Pagination ───── */
function renderPagination() {
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  if (totalPages <= 1) return;

  const bar = $("pagination");
  bar.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.className = "page-btn";
  prevBtn.textContent = "←";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => goPage(currentPage - 1);
  bar.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && Math.abs(i - currentPage) > 2 && i !== 1 && i !== totalPages) {
      if (i === currentPage - 3 || i === currentPage + 3) {
        const dots = document.createElement("span");
        dots.textContent = "…";
        dots.style.cssText = "padding:0 8px;color:var(--ink-60);display:flex;align-items:center;";
        bar.appendChild(dots);
      }
      continue;
    }
    const btn = document.createElement("button");
    btn.className = "page-btn" + (i === currentPage ? " active" : "");
    btn.textContent = i;
    btn.onclick = () => goPage(i);
    bar.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = "page-btn";
  nextBtn.textContent = "→";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => goPage(currentPage + 1);
  bar.appendChild(nextBtn);
}

function goPage(n) {
  currentPage = n;
  renderCards();
  document.getElementById("services").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── View Details Modal ──────── */
async function viewDetails(id, name) {
  openModal();
  $("modalContent").innerHTML = `
    <div style="text-align:center;padding:40px 0;color:var(--ink-60)">
      <div style="font-size:2rem;margin-bottom:12px"></div>
      <p>Loading details for <strong>${escHtml(name)}</strong>…</p>
    </div>`;

  try {
    const res  = await fetch(`${API_BASE}/facility/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const d    = data.data || data;
    renderModal(d);
  } catch {
    $("modalContent").innerHTML = `
      <div style="text-align:center;padding:40px 0">
        <div style="font-size:2rem;margin-bottom:12px">⚠️</div>
        <h3 style="font-family:var(--serif);margin-bottom:8px">Could not load details</h3>
        <p style="color:var(--ink-60)">The facility API didn't return data for this entry.</p>
      </div>`;
  }
}

function renderModal(d) {
  const rows = [
    ["Location",   [d.city, d.region||d.county, d.country].filter(Boolean).join(", ")],
    ["Type",       d.facility_type || d.type || "—"],
    ["Phone",      d.phone || d.contact || d.telephone || "—"],
    ["Website",    d.website || "—"],
    ["Ownership",  d.ownership || d.owner_type || "—"],
    ["Hours",      d.operating_hours || d.hours || "Open 24 hours (may vary)"],
    ["Beds",       d.beds || d.bed_count || "—"],
    ["Services",   d.services || "General healthcare and GBV support services"],
  ].filter(r => r[2] && r[2] !== "—");

  $("modalContent").innerHTML = `
    <h2 class="modal-facility-name">${escHtml(d.facility_name || d.name || "Facility")}</h2>
    <span class="card-badge" style="font-size:0.75rem">${escHtml(d.facility_type || "Health Facility")}</span>

    <div class="modal-section">
      <h4>Facility Information</h4>
      ${rows.map(([icon, label, val]) => `
        <div class="modal-detail-row">
          <span class="modal-detail-icon">${icon}</span>
          <div><strong style="font-size:0.78rem;color:var(--ink-60);display:block;margin-bottom:2px">${label}</strong>${escHtml(String(val))}</div>
        </div>`).join("")}
    </div>

    <div class="modal-section">
      <h4>GBV Support Services</h4>
      <p style="font-size:0.875rem;color:var(--ink-60);line-height:1.7">
        This facility is listed in Kenya's health network and may provide support services
        for survivors of gender-based violence including clinical care, psychological support,
        and referrals. Please call ahead to confirm available services.
      </p>
    </div>

    ${d.phone ? `
    <div style="margin-top:24px">
      <a href="tel:${escHtml(d.phone || d.contact || "")}" class="btn-call" style="display:inline-flex;gap:6px;padding:12px 24px;border-radius:var(--radius-sm)">
         Call This Facility
      </a>
    </div>` : ""}
  `;
}

/* ── Modal Controls ─────── */
function openModal() {
  $("modalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  $("modalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

/* ── Banner ─────── */
function closeBanner() {
  const banner = $("emergencyBanner");
  banner.style.maxHeight = banner.offsetHeight + "px";
  banner.style.transition = "max-height 0.3s ease, opacity 0.3s ease";
  requestAnimationFrame(() => {
    banner.style.maxHeight = "0";
    banner.style.opacity   = "0";
  });
  setTimeout(() => { banner.style.display = "none"; }, 320);
}

/* ── Security: HTML escaping ──────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
