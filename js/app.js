/* ============================================================
   Impact Compass Holdings - App Core (nav, journals, utils)
   ============================================================ */

// ===== CONSTANTS =====
const LS_KEY = "ich_submissions";

// ===== UTILS =====
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ===== CONFIRM / SUCCESS DIALOGS =====
let _confirmCallback = null;
function showConfirm(title, message, onOk, okLabel) {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-message").textContent = message;
  document.getElementById("confirm-ok-btn").textContent = okLabel || "Confirm";
  _confirmCallback = onOk;
  document.getElementById("confirm-overlay").classList.add("open");
}
function confirmOk() {
  document.getElementById("confirm-overlay").classList.remove("open");
  if (_confirmCallback) {
    _confirmCallback();
    _confirmCallback = null;
  }
}
function confirmCancel() {
  document.getElementById("confirm-overlay").classList.remove("open");
  _confirmCallback = null;
}
function showSuccess(title, message) {
  document.getElementById("success-title").textContent = title;
  document.getElementById("success-message").textContent = message;
  document.getElementById("success-overlay").classList.add("open");
}
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// ===== NAVIGATION =====
let currentPage = "home";
function navigate(page) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  const target = document.getElementById("page-" + page);
  if (target) {
    target.classList.add("active");
    currentPage = page;
  }
  document
    .querySelectorAll(".nav-link")
    .forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.page === page)
    );
  document
    .querySelectorAll(".mobile-link")
    .forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.page === page)
    );
  window.scrollTo({ top: 0 });
  if (page === "journals") renderJournalGrid();
}

window.addEventListener("scroll", () => {
  document
    .getElementById("navbar")
    .classList.toggle("scrolled", window.scrollY > 20);
});

function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const iconMenu = document.getElementById("icon-menu");
  const iconX = document.getElementById("icon-x");
  const isOpen = menu.classList.toggle("open");
  iconMenu.classList.toggle("hidden", isOpen);
  iconX.classList.toggle("hidden", !isOpen);
}

// ===== JOURNALS =====
function renderJournalGrid() {
  const grid = document.getElementById("journals-grid");
  if (!grid) return;
  grid.innerHTML = JOURNALS.map(
    (j) => `
        <div class="glass-card journal-card">
            <div class="journal-abbr">${j.abbr}</div>
            <div class="journal-name">${j.name}</div>
            <p class="journal-desc">${j.desc}</p>
            <div class="ojs-journal-links"><span>ISSN ${journalIssn(j.abbr) || "-"}</span><button class="link-btn" onclick="openJournalArchive('${j.abbr}')">View Articles →</button></div>
            <div class="journal-footer"><span>Indexed in:</span><span class="journal-indexed">Google Scholar · Crossref · ResearchBib · Neliti</span></div>
        </div>`
  ).join("");
  const sel = document.getElementById("journal-select");
  if (sel && sel.options.length === 0) {
    JOURNALS.forEach((j) => {
      const opt = document.createElement("option");
      opt.value = j.name;
      opt.textContent = j.name;
      sel.appendChild(opt);
    });
  }
}

function switchJournalView(view) {
  if (
    (view === "submit" || view === "dashboard" || view === "reviewer") &&
    !getCurrentUser()
  ) {
    _pendingJournalView = view;
    openUserAuthModal();
    return;
  }
  _pendingJournalView = null;
  ["browse", "dashboard", "submit", "reviewer", "archive"].forEach((v) => {
    document.getElementById("view-" + v).classList.toggle("hidden", v !== view);
  });
  document.querySelectorAll(".subnav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.id === "tab-" + view);
  });
  if (view === "dashboard") renderDashboard();
  if (view === "reviewer") renderReviewerDashboard();
  if (view === "archive") renderArchive();
}

// ===== INIT =====
// Deferred so user-auth.js and submissions.js are parsed first
window.addEventListener("load", function () {
  renderJournalGrid();
  if (typeof initUserAuth === "function") initUserAuth();
  if (location.hash === "#reviewer" && getCurrentUser()) {
    navigate("journals");
    switchJournalView("reviewer");
  }
});
