/* ============================================================
   Admin Core - utilities, auth, navigation, polling
   ============================================================ */

// ===== CONSTANTS =====
const LS_KEY = "ich_submissions";
const LS_CONTACTS = "ich_contacts";
const LS_INVOICES = "ich_invoices";
const LS_ADMINS = "ich_admins";
const LS_USERS = "ich_users";
const LS_PAY = "ich_payment_settings";
const SUPER_ADMIN_EMAIL = "admin@impact.com";
const SUPER_ADMIN_PWD = "password";

const JOURNALS = [
  {
    abbr: "AJIESS",
    name: "African Journal on Impact Economic and Social Studies",
    desc: "Transformative economic policies and social development across the continent.",
  },
  {
    abbr: "IJHRGJS",
    name: "Int. Journal on Human Rights and Gender Justice Studies",
    desc: "Critical research in justice, equity, and human rights frameworks globally.",
  },
  {
    abbr: "IJPAHS",
    name: "Int. Journal of Public and Allied Health Sciences",
    desc: "Advancing public health research and innovative healthcare practices.",
  },
  {
    abbr: "IJTMLS",
    name: "Int. Journal of Technology and Managerial Leadership Studies",
    desc: "Bridging technological innovation and effective leadership.",
  },
  {
    abbr: "AJGGPS",
    name: "African Journal on Good Governance and Geopolitical Science",
    desc: "Political structures, governance models, and geopolitical strategies.",
  },
  {
    abbr: "AJISAR",
    name: "African Journal of Implementation Science and Applied Research",
    desc: "Bridging theory and practice in various research fields.",
  },
];

const PAGE_TITLES = {
  dashboard: "Dashboard",
  submissions: "Manuscripts",
  invoices: "Invoices",
  journals: "Journal Management",
  contacts: "Inquiries",
  users: "Registered Users",
  admins: "Admin Accounts",
  reports: "Reports & Analytics",
  settings: "Settings",
};

let _currentAdmin = null;
let _adminEmail = "admin";
let selectedIds = new Set();
let currentFilter = { query: "", status: "" };

// ===== HELPERS =====
function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function fmtDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}
function fmtCurrency(amt) {
  return (
    "R\u202f" +
    Number(amt || 0)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
}
function getJournalAbbr(name) {
  const j = JOURNALS.find((j) => j.name === name);
  return j
    ? j.abbr
    : (name || "")
        .split(" ")
        .filter((w) => w.length > 3)
        .map((w) => w[0])
        .join("")
        .slice(0, 6) || name;
}

// ===== STORAGE HELPERS =====
function loadSubs() {
  try {
    const subs = JSON.parse(localStorage.getItem(LS_KEY)) || [];
    const map = {
      Review: "Submitted",
      Copyediting: "Submitted",
      Production: "Published",
    };
    return subs.map((s) =>
      map[s.status] ? { ...s, status: map[s.status] } : s
    );
  } catch {
    return [];
  }
}
function saveSubs(s) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}
function loadContacts() {
  try {
    return JSON.parse(localStorage.getItem(LS_CONTACTS)) || [];
  } catch {
    return [];
  }
}
function saveContacts(c) {
  localStorage.setItem(LS_CONTACTS, JSON.stringify(c));
}
function loadInvoices() {
  try {
    return JSON.parse(localStorage.getItem(LS_INVOICES)) || [];
  } catch {
    return [];
  }
}
function saveInvoices(a) {
  localStorage.setItem(LS_INVOICES, JSON.stringify(a));
}
function loadAdmins() {
  try {
    return JSON.parse(localStorage.getItem(LS_ADMINS)) || [];
  } catch {
    return [];
  }
}
function saveAdmins(a) {
  localStorage.setItem(LS_ADMINS, JSON.stringify(a));
}
function loadPaySettings() {
  try {
    return JSON.parse(localStorage.getItem(LS_PAY)) || {};
  } catch {
    return {};
  }
}

// ===== TOAST =====
let _toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => (t.style.display = "none"), 2800);
}

// ===== CONFIRM / SUCCESS =====
let _confirmCb = null;
function showConfirm(title, message, onOk, okLabel, isDanger) {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-message").textContent = message;
  const btn = document.getElementById("confirm-ok-btn");
  btn.textContent = okLabel || "Confirm";
  btn.className = "btn-confirm-dlg" + (isDanger ? " danger" : "");
  _confirmCb = onOk;
  document.getElementById("confirm-overlay").classList.add("open");
}
function confirmOk() {
  document.getElementById("confirm-overlay").classList.remove("open");
  if (_confirmCb) {
    _confirmCb();
    _confirmCb = null;
  }
}
function confirmCancel() {
  document.getElementById("confirm-overlay").classList.remove("open");
  _confirmCb = null;
}
function showSuccess(title, message) {
  document.getElementById("success-title").textContent = title;
  document.getElementById("success-message").textContent = message;
  document.getElementById("success-overlay").classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// ===== AUTH =====
function attemptLogin() {
  const email = document
    .getElementById("login-email")
    .value.trim()
    .toLowerCase();
  const pwd = document.getElementById("login-password").value;
  const err = document.getElementById("login-error");
  err.style.display = "none";
  if (email === SUPER_ADMIN_EMAIL && pwd === SUPER_ADMIN_PWD) {
    _currentAdmin = {
      email: SUPER_ADMIN_EMAIL,
      name: "Super Admin",
      isSuperAdmin: true,
    };
    _adminEmail = email;
    doLoginSuccess();
    return;
  }
  const admins = loadAdmins();
  const match = admins.find((a) => a.email === email && a.password === pwd);
  if (match) {
    _currentAdmin = {
      email: match.email,
      name: match.name,
      isSuperAdmin: false,
    };
    _adminEmail = match.email;
    doLoginSuccess();
    return;
  }
  err.style.display = "block";
  document.getElementById("login-password").value = "";
}

function doLoginSuccess() {
  document.getElementById("login-overlay").style.display = "none";
  document.getElementById("app").classList.add("visible");
  initApp();
  applyRoleRestrictions();
}

function applyRoleRestrictions() {
  const isSA = _currentAdmin && _currentAdmin.isSuperAdmin;
  document
    .querySelectorAll("[data-super-only]")
    .forEach((el) => (el.style.display = isSA ? "" : "none"));
  const nameEl = document.getElementById("topbar-admin-name");
  const roleEl = document.getElementById("topbar-admin-role");
  if (nameEl) nameEl.textContent = _currentAdmin ? _currentAdmin.name : "";
  if (roleEl) roleEl.textContent = isSA ? "Super Admin" : "Admin";
}

function logout() {
  showConfirm(
    "Sign Out",
    "Are you sure you want to sign out of the Admin Portal?",
    () => {
      _currentAdmin = null;
      _adminEmail = "admin";
      document.getElementById("app").classList.remove("visible");
      document.getElementById("login-overlay").style.display = "flex";
      document.getElementById("login-email").value = "";
      document.getElementById("login-password").value = "";
    },
    "Sign Out"
  );
}

// ===== NAVIGATION =====
function showPage(id) {
  if (
    (id === "users" || id === "admins") &&
    (!_currentAdmin || !_currentAdmin.isSuperAdmin)
  )
    id = "dashboard";
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  const pageEl = document.getElementById("page-" + id);
  if (pageEl) pageEl.classList.add("active");
  document.querySelectorAll(".nav-item").forEach((n) => {
    if (
      n.getAttribute("onclick") &&
      n.getAttribute("onclick").includes("'" + id + "'")
    )
      n.classList.add("active");
  });
  document.getElementById("topbar-title").textContent = PAGE_TITLES[id] || id;
  refreshAll();
  window.scrollTo({ top: 0 });
  if (id === "journals") renderJournalsAdmin();
  if (id === "contacts") renderContacts();
  if (id === "users") renderUsers();
  if (id === "admins") renderAdmins();
}

// ===== INIT =====
function initApp() {
  updateTopbarDate();
  refreshAll();
  initSettingsForm();
  initPaymentSettingsForm();
  setInterval(refreshAll, 5000);
}

function updateTopbarDate() {
  const d = new Date();
  document.getElementById("topbar-date").textContent = d.toLocaleDateString(
    "en-ZA",
    { weekday: "short", day: "2-digit", month: "short", year: "numeric" }
  );
}

function refreshAll() {
  const subs = loadSubs();
  const contacts = loadContacts();
  updateStats(subs, contacts);
  renderDashRecent(subs);
  renderJournalBars(subs, "journal-bars");
  renderActivityFeed(subs);
  renderSubTable(subs);
  renderReports(subs);
  renderInvoicesTable();
  document.getElementById("badge-submissions").textContent = subs.length;
  let usersArr = [];
  try {
    usersArr = JSON.parse(localStorage.getItem(LS_USERS)) || [];
  } catch {}
  document.getElementById("badge-users").textContent = usersArr.length;
  try {
    const ab = document.getElementById("badge-admins");
    if (ab) ab.textContent = loadAdmins().length;
  } catch {}
  const unread = contacts.filter((c) => !c.read).length;
  const badge = document.getElementById("badge-contacts");
  const notifDot = document.getElementById("notif-dot");
  if (unread > 0) {
    badge.textContent = unread;
    badge.style.display = "";
    notifDot.classList.add("visible");
  } else {
    badge.style.display = "none";
    notifDot.classList.remove("visible");
  }
}

// ===== SIDEBAR (desktop: always visible; mobile: stub for future use) =====
function openSidebar() {
  const sb = document.getElementById("sidebar");
  if (sb) sb.classList.toggle("mobile-open");
}

// ===== KEY LISTENERS =====
document.getElementById("login-email").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("login-password").focus();
});
document.getElementById("login-password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") attemptLogin();
});
