/* ============================================================
   Impact Compass Holdings - User Auth
   ============================================================ */

const LS_USERS = "ich_users";
let _pendingJournalView = null;

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(LS_USERS)) || [];
  } catch {
    return [];
  }
}
function saveUsers(u) {
  localStorage.setItem(LS_USERS, JSON.stringify(u));
}

function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem("ich_current_user")) || null;
  } catch {
    return null;
  }
}
function setCurrentUser(user) {
  sessionStorage.setItem("ich_current_user", JSON.stringify(user));
}
function clearCurrentUser() {
  sessionStorage.removeItem("ich_current_user");
}

function initUserAuth() {
  updateNavUserArea();
}

function updateNavUserArea() {
  const el = document.getElementById("nav-user-area");
  const mEl = document.getElementById("mobile-user-area");
  const user = getCurrentUser();
  if (el) {
    if (user) {
      el.innerHTML = `<span style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;color:var(--accent);">${escapeHtml(
        user.firstName
      )}</span>
                   <button onclick="userLogout()" style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.1);padding:0.3rem 0.75rem;transition:all 0.25s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.35)'">Sign Out</button>`;
    } else {
      el.innerHTML = `<button onclick="openUserAuthModal()" style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;color:var(--accent);border:1px solid rgba(193,154,107,0.3);padding:0.4rem 1rem;transition:all 0.25s;" onmouseover="this.style.background='rgba(193,154,107,0.1)'" onmouseout="this.style.background='transparent'">Sign In</button>`;
    }
  }
  if (mEl) {
    if (user) {
      mEl.innerHTML = `<div class="mobile-user-row"><span class="mobile-user-name">${escapeHtml(
        user.firstName
      )} ${escapeHtml(user.lastName)}</span>
                   <button onclick="userLogout();toggleMobileMenu();" class="mobile-signout">Sign Out</button></div>`;
    } else {
      mEl.innerHTML = `<button onclick="openUserAuthModal();toggleMobileMenu();" class="mobile-link" style="color:var(--accent);">Sign In / Sign Up</button>`;
    }
  }
}

function openUserAuthModal() {
  document.getElementById("auth-modal-overlay").classList.add("open");
  switchUserAuthTab("signin");
}
function closeUserAuthModal() {
  document.getElementById("auth-modal-overlay").classList.remove("open");
}

function switchUserAuthTab(tab) {
  document.getElementById("user-form-signin").style.display =
    tab === "signin" ? "" : "none";
  document.getElementById("user-form-signup").style.display =
    tab === "signup" ? "" : "none";
  const si = document.getElementById("user-tab-signin");
  const su = document.getElementById("user-tab-signup");
  si.classList.toggle("active", tab === "signin");
  su.classList.toggle("active", tab === "signup");
}

// ===== ADMIN ACCOUNTS (single sign-in) =====
// The same form signs in authors/reviewers and administrators. We check who
// the credentials belong to and send admins to the portal.
const SUPER_ADMIN_EMAIL = "admin@impact.com";
const SUPER_ADMIN_PWD = "password";
function findAdminAccount(email, pwd) {
  if (email === SUPER_ADMIN_EMAIL && pwd === SUPER_ADMIN_PWD)
    return { email, name: "Super Admin", isSuperAdmin: true };
  try {
    const admins = JSON.parse(localStorage.getItem("ich_admins") || "[]");
    const m = admins.find((a) => a.email === email && a.password === pwd);
    if (m) return { email: m.email, name: m.name, isSuperAdmin: false };
  } catch {}
  return null;
}
function isAdminEmail(email) {
  if (email === SUPER_ADMIN_EMAIL) return true;
  try {
    return JSON.parse(localStorage.getItem("ich_admins") || "[]").some(
      (a) => a.email === email
    );
  } catch {
    return false;
  }
}

function attemptUserLogin() {
  const email = document
    .getElementById("u-login-email")
    .value.trim()
    .toLowerCase();
  const pwd = document.getElementById("u-login-password").value;
  const errEl = document.getElementById("u-login-error");
  errEl.style.display = "none";
  if (!email || !pwd) {
    errEl.textContent = "Please enter your email and password.";
    errEl.style.display = "block";
    return;
  }
  const admin = findAdminAccount(email, pwd);
  if (admin) {
    document.getElementById("u-login-password").value = "";
    return completeLogin({ kind: "admin", email: admin.email, admin });
  }
  const users = loadUsers();
  const user = users.find((u) => u.email === email && u.password === pwd);
  if (!user) {
    errEl.textContent = "Invalid email or password. Please try again.";
    errEl.style.display = "block";
    document.getElementById("u-login-password").value = "";
    return;
  }
  document.getElementById("u-login-password").value = "";
  completeLogin({ kind: "user", email: user.email, user });
}

function completeLogin(ctx) {
  if (ctx.kind === "admin") {
    sessionStorage.setItem("ich_admin_session", JSON.stringify({ email: ctx.admin.email }));
    clearCurrentUser();
    window.location.href = "admin/index.html";
    return;
  }
  completeUserLogin(ctx.user);
}
function completeUserLogin(user) {
  setCurrentUser(user);
  closeUserAuthModal();
  updateNavUserArea();
  if (_pendingJournalView) {
    const v = _pendingJournalView;
    _pendingJournalView = null;
    switchJournalView(v);
  }
  showSuccess(
    "Welcome back!",
    `Signed in as ${user.firstName} ${user.lastName}.`
  );
}

function attemptUserRegister() {
  const first = document.getElementById("u-reg-first").value.trim();
  const last = document.getElementById("u-reg-last").value.trim();
  const email = document
    .getElementById("u-reg-email")
    .value.trim()
    .toLowerCase();
  const pwd = document.getElementById("u-reg-password").value;
  const conf = document.getElementById("u-reg-confirm").value;
  const errEl = document.getElementById("u-reg-error");
  errEl.style.display = "none";
  if (!first || !last) {
    errEl.textContent = "Please enter your first and last name.";
    errEl.style.display = "block";
    return;
  }
  if (!email || !/^[^\@\s]+@[^\@\s]+\.[^\@\s]+$/.test(email)) {
    errEl.textContent = "Please enter a valid email address.";
    errEl.style.display = "block";
    return;
  }
  if (pwd.length < 8) {
    errEl.textContent = "Password must be at least 8 characters.";
    errEl.style.display = "block";
    return;
  }
  if (pwd !== conf) {
    errEl.textContent = "Passwords do not match.";
    errEl.style.display = "block";
    return;
  }
  if (isAdminEmail(email)) {
    errEl.textContent = "This email address is reserved. Please use a different one.";
    errEl.style.display = "block";
    return;
  }
  const users = loadUsers();
  if (users.find((u) => u.email === email)) {
    errEl.textContent =
      "An account with this email already exists. Please sign in.";
    errEl.style.display = "block";
    return;
  }
  const newUser = {
    email,
    password: pwd,
    firstName: first,
    lastName: last,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);
  closeUserAuthModal();
  updateNavUserArea();
  if (_pendingJournalView) {
    const v = _pendingJournalView;
    _pendingJournalView = null;
    switchJournalView(v);
  }
  showSuccess(
    "Account Created",
    `Welcome, ${first}! You can now submit manuscripts.`
  );
}

function userLogout() {
  clearCurrentUser();
  updateNavUserArea();
  switchJournalView("browse");
  showSuccess("Signed Out", "You have been signed out successfully.");
}
