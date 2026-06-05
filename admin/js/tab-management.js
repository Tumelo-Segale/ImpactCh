/* ============================================================
   Admin Tabs - Journals · Contacts · Users · Admins · Reports · Settings
   ============================================================ */

// ===========================
// JOURNALS
// ===========================
function renderJournalsAdmin() {
  const el = document.getElementById("journals-grid-admin");
  const subs = loadSubs();
  el.innerHTML = JOURNALS.map((j) => {
    const count = subs.filter(
      (s) => s.journal === j.name || getJournalAbbr(s.journal) === j.abbr
    ).length;
    return `<div class="panel" style="padding:0;">
            <div style="padding:1.5rem;border-bottom:1px solid var(--border);">
                <div style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;font-weight:700;color:var(--accent);margin-bottom:0.5rem;">${
                  j.abbr
                }</div>
                <div style="font-family:var(--font-serif);font-size:1.1rem;color:#fff;font-weight:400;line-height:1.3;">${
                  j.name
                }</div>
            </div>
            <div style="padding:1.25rem;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:0.78rem;color:var(--text-muted);">${j.desc.slice(
                  0,
                  60
                )}…</span>
            </div>
            <div style="padding:0.875rem 1.25rem;border-top:1px solid var(--border);display:flex;gap:1.5rem;">
                <span style="font-size:0.78rem;color:var(--text-muted);">Submissions: <strong style="color:#fff;">${count}</strong></span>
                <span style="font-size:0.78rem;color:var(--green);">● Google Scholar</span>
            </div>
        </div>`;
  }).join("");
}

// ===========================
// CONTACTS / INQUIRIES
// ===========================
function renderContacts() {
  const contacts = loadContacts();
  const el = document.getElementById("contacts-body");
  if (!contacts.length) {
    el.innerHTML =
      '<div class="empty-state"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><p>No inquiries yet.</p></div>';
    return;
  }
  el.innerHTML = contacts
    .map(
      (c, i) => `
        <div class="contact-card-admin${c.read ? " is-read" : ""}">
            <div class="contact-card-head">
                <strong class="contact-card-name">${escHtml(
                  c.name || "-"
                )}</strong>
                <span class="contact-card-email">${escHtml(
                  c.email || ""
                )}</span>
                ${
                  !c.read
                    ? '<span style="font-size:8px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;background:var(--red-light);color:var(--red);padding:2px 8px;">Unread</span>'
                    : ""
                }
                <span class="contact-card-date">${fmtDate(c.date)}</span>
            </div>
            <div class="contact-card-subject">${escHtml(
              c.subject || "General Inquiry"
            )}</div>
            <div class="contact-card-message">${escHtml(c.message || "")}</div>
            <div class="contact-card-actions">
                ${
                  !c.read
                    ? `<button class="btn-sm btn-read" style="padding:0.35rem 0.875rem;font-size:8px;" onclick="markContactRead(${i})">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Mark as Read
                </button>`
                    : ""
                }
                <button class="btn-sm btn-danger" style="padding:0.35rem 0.875rem;font-size:8px;" onclick="confirmDeleteContact(${i})">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>Delete
                </button>
            </div>
        </div>`
    )
    .join("");
}

function markContactRead(idx) {
  const contacts = loadContacts();
  if (contacts[idx]) {
    contacts[idx].read = true;
    saveContacts(contacts);
    refreshAll();
    renderContacts();
    showToast("Marked as read");
  }
}

function confirmDeleteContact(idx) {
  showConfirm(
    "Delete Inquiry",
    "Permanently delete this inquiry? This action cannot be undone.",
    () => {
      const contacts = loadContacts();
      contacts.splice(idx, 1);
      saveContacts(contacts);
      refreshAll();
      renderContacts();
      showToast("Inquiry deleted");
    },
    "Delete",
    true
  );
}

// ===========================
// USERS
// ===========================
function renderUsers() {
  let users = [];
  try {
    users = JSON.parse(localStorage.getItem(LS_USERS)) || [];
  } catch {}
  const subs = loadSubs();
  const tbody = document.getElementById("users-tbody");
  if (!users.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">No registered users yet.</td></tr>';
    return;
  }
  tbody.innerHTML = users
    .map((u, i) => {
      const userSubs = subs.filter((s) => s.submittedByEmail === u.email);
      return `<tr>
            <td style="color:#fff;font-weight:500;">${escHtml(
              u.firstName + " " + u.lastName
            )}</td>
            <td style="color:var(--text-muted);font-size:0.78rem;">${escHtml(
              u.email
            )}</td>
            <td style="color:var(--text-muted);font-size:0.75rem;">${fmtDate(
              u.createdAt
            )}</td>
            <td><span style="font-size:0.82rem;color:${
              userSubs.length > 0 ? "var(--accent)" : "var(--text-muted)"
            };">${userSubs.length}</span></td>
            <td style="display:flex;gap:0.4rem;">
                ${
                  userSubs.length > 0
                    ? `<button class="btn-sm btn-ghost" style="padding:0.35rem 0.75rem;font-size:8px;" onclick="filterByEmailAndGoToSubs('${escHtml(
                        u.email
                      )}')">View Submissions</button>`
                    : ""
                }
                <button class="btn-sm btn-danger" style="padding:0.35rem 0.75rem;font-size:8px;" onclick="confirmDeleteUser(${i})">Delete</button>
            </td>
        </tr>`;
    })
    .join("");
}

function filterByEmailAndGoToSubs(email) {
  currentFilter.query = email;
  showPage("submissions");
  const searchInput = document.querySelector(".toolbar-search");
  if (searchInput) searchInput.value = email;
}

function confirmDeleteUser(idx) {
  let users = [];
  try {
    users = JSON.parse(localStorage.getItem(LS_USERS)) || [];
  } catch {}
  const user = users[idx];
  if (!user) return;
  showConfirm(
    "Delete User Account",
    `Delete account for ${user.firstName} ${user.lastName} (${user.email})? Submissions will remain.`,
    () => {
      users.splice(idx, 1);
      localStorage.setItem(LS_USERS, JSON.stringify(users));
      refreshAll();
      renderUsers();
      showToast("User deleted");
    },
    "Delete",
    true
  );
}

// ===========================
// ADMINS (Super-admin only)
// ===========================
function renderAdmins() {
  const tbody = document.getElementById("admins-tbody");
  if (!tbody) return;
  const admins = loadAdmins();
  const badge = document.getElementById("badge-admins");
  if (badge) badge.textContent = admins.length;
  if (!admins.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">No sub-admins added yet.</td></tr>';
    return;
  }
  tbody.innerHTML = admins
    .map(
      (a, i) => `<tr>
        <td style="color:#fff;font-weight:600;">${escHtml(a.name)}</td>
        <td style="color:var(--text-muted);font-size:0.78rem;">${escHtml(
          a.email
        )}</td>
        <td style="color:var(--text-muted);font-size:0.75rem;">${fmtDate(
          a.createdAt
        )}</td>
        <td><span style="font-size:8px;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;padding:0.25rem 0.6rem;background:rgba(193,154,107,0.1);color:var(--accent);border:1px solid rgba(193,154,107,0.25);">Sub-Admin</span></td>
        <td style="display:flex;gap:0.4rem;flex-wrap:wrap;">
            <button class="btn-sm btn-ghost"  style="padding:0.35rem 0.75rem;font-size:8px;" onclick="openEditAdmin(${i})">Edit</button>
            <button class="btn-sm btn-danger" style="padding:0.35rem 0.75rem;font-size:8px;" onclick="confirmDeleteAdmin(${i})">Remove</button>
        </td>
    </tr>`
    )
    .join("");
}

function openAddAdminModal() {
  if (!_currentAdmin || !_currentAdmin.isSuperAdmin) return;
  [
    "new-admin-name",
    "new-admin-email",
    "new-admin-pwd",
    "new-admin-pwd2",
  ].forEach((id) => (document.getElementById(id).value = ""));
  document.getElementById("add-admin-error").style.display = "none";
  document.getElementById("modal-add-admin").classList.add("open");
}

function saveNewAdmin() {
  const name = document.getElementById("new-admin-name").value.trim();
  const email = document
    .getElementById("new-admin-email")
    .value.trim()
    .toLowerCase();
  const pwd = document.getElementById("new-admin-pwd").value;
  const pwd2 = document.getElementById("new-admin-pwd2").value;
  const errEl = document.getElementById("add-admin-error");
  errEl.style.display = "none";
  if (!name) {
    errEl.textContent = "Please enter a name.";
    errEl.style.display = "block";
    return;
  }
  if (!email || !/^[^\@\s]+@[^\@\s]+\.[^\@\s]+$/.test(email)) {
    errEl.textContent = "Please enter a valid email.";
    errEl.style.display = "block";
    return;
  }
  if (pwd.length < 8) {
    errEl.textContent = "Password must be at least 8 characters.";
    errEl.style.display = "block";
    return;
  }
  if (pwd !== pwd2) {
    errEl.textContent = "Passwords do not match.";
    errEl.style.display = "block";
    return;
  }
  if (email === SUPER_ADMIN_EMAIL) {
    errEl.textContent = "That email is reserved for the super admin.";
    errEl.style.display = "block";
    return;
  }
  const admins = loadAdmins();
  if (admins.find((a) => a.email === email)) {
    errEl.textContent = "An admin with this email already exists.";
    errEl.style.display = "block";
    return;
  }
  admins.push({
    name,
    email,
    password: pwd,
    createdAt: new Date().toISOString(),
  });
  saveAdmins(admins);
  closeModal("modal-add-admin");
  renderAdmins();
  refreshAll();
  showToast("Admin account created for " + name);
}

function openEditAdmin(idx) {
  const admins = loadAdmins();
  const admin = admins[idx];
  if (!admin) return;
  document.getElementById("edit-admin-idx").value = idx;
  document.getElementById("edit-admin-name").value = admin.name;
  document.getElementById("edit-admin-email").value = admin.email;
  document.getElementById("edit-admin-pwd").value = "";
  document.getElementById("edit-admin-error").style.display = "none";
  document.getElementById("modal-edit-admin").classList.add("open");
}

function saveEditAdmin() {
  const idx = parseInt(document.getElementById("edit-admin-idx").value);
  const name = document.getElementById("edit-admin-name").value.trim();
  const email = document
    .getElementById("edit-admin-email")
    .value.trim()
    .toLowerCase();
  const pwd = document.getElementById("edit-admin-pwd").value;
  const errEl = document.getElementById("edit-admin-error");
  errEl.style.display = "none";
  if (!name) {
    errEl.textContent = "Name cannot be empty.";
    errEl.style.display = "block";
    return;
  }
  if (!email || !/^[^\@\s]+@[^\@\s]+\.[^\@\s]+$/.test(email)) {
    errEl.textContent = "Please enter a valid email.";
    errEl.style.display = "block";
    return;
  }
  if (pwd && pwd.length < 8) {
    errEl.textContent = "Password must be at least 8 characters.";
    errEl.style.display = "block";
    return;
  }
  if (email === SUPER_ADMIN_EMAIL) {
    errEl.textContent = "That email is reserved for the super admin.";
    errEl.style.display = "block";
    return;
  }
  const admins = loadAdmins();
  if (admins.find((a, i) => i !== idx && a.email === email)) {
    errEl.textContent = "Another admin with this email already exists.";
    errEl.style.display = "block";
    return;
  }
  admins[idx].name = name;
  admins[idx].email = email;
  if (pwd) admins[idx].password = pwd;
  saveAdmins(admins);
  closeModal("modal-edit-admin");
  renderAdmins();
  showToast("Admin account updated");
}

function confirmDeleteAdmin(idx) {
  const admins = loadAdmins();
  const admin = admins[idx];
  if (!admin) return;
  showConfirm(
    "Remove Admin",
    `Remove admin account for ${escHtml(admin.name)} (${escHtml(
      admin.email
    )})? They will immediately lose access.`,
    () => {
      admins.splice(idx, 1);
      saveAdmins(admins);
      renderAdmins();
      refreshAll();
      showToast("Admin removed");
    },
    "Remove",
    true
  );
}

// ===========================
// REPORTS
// ===========================
function renderReports(subs) {
  const pub = subs.filter((s) => s.status === "Published").length;
  const total = subs.length;
  document.getElementById("rpt-avg").textContent = total ? pub : "-";
  document.getElementById("rpt-acceptance").textContent = total
    ? Math.round((pub / total) * 100) + "%"
    : "-";
  const journalCounts = {};
  JOURNALS.forEach((j) => (journalCounts[j.abbr] = 0));
  subs.forEach((s) => {
    const a = getJournalAbbr(s.journal);
    if (a) journalCounts[a] = (journalCounts[a] || 0) + 1;
  });
  const topJ = Object.entries(journalCounts).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("rpt-journal").textContent =
    topJ && topJ[1] > 0 ? topJ[0] : "-";
  const galleys = document.getElementById("rpt-galleys");
  if (galleys)
    galleys.textContent = localStorage.getItem("ich_galley_count") || "0";
  renderJournalBars(subs, "rpt-journal-bars");
}

function exportGalleyAll() {
  const subs = loadSubs().filter((s) => s.status === "Published");
  if (!subs.length) {
    showToast("No published manuscripts");
    return;
  }
  subs.forEach((s, i) => setTimeout(() => generateGalley(s.id), i * 300));
  showToast("Generating " + subs.length + " galleys…");
}

// ===========================
// GALLEY PDF
// ===========================
function generateGalley(id) {
  const sub = loadSubs().find((s) => s.id === id);
  if (!sub) return;
  const count = parseInt(localStorage.getItem("ich_galley_count") || "0") + 1;
  localStorage.setItem("ich_galley_count", count);
  _generateGalleyDoc(sub);
}

function _generateGalleyDoc(sub) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFillColor(193, 154, 107);
  doc.rect(0, 0, 210, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(5, 5, 6);
  doc.text("IMPACT COMPASS JOURNALS - GALLEY PROOF", 10, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(193, 154, 107);
  doc.text(sub.journal, 10, 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(sub.title, 180);
  doc.text(titleLines, 10, 40);
  const titleEnd = 40 + titleLines.length * 10;
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Authors: ${sub.authors}`, 10, titleEnd + 8);
  doc.setFontSize(10);
  const d = sub.approvedAt ? new Date(sub.approvedAt) : new Date();
  doc.text(
    `Published: ${d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`,
    10,
    titleEnd + 18
  );
  doc.setDrawColor(193, 154, 107);
  doc.setLineWidth(0.5);
  doc.line(10, titleEnd + 26, 200, titleEnd + 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text("Abstract", 10, titleEnd + 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  const absLines = doc.splitTextToSize(sub.abstract || "", 180);
  doc.text(absLines, 10, titleEnd + 50);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "© 2026 Impact Compass Holdings. All articles indexed in Google Scholar.",
    10,
    280
  );
  const safeTitle = sub.title
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60);
  doc.save(`${safeTitle}.pdf`);
}

// ===========================
// SETTINGS
// ===========================
function switchSetting(el, sectionId) {
  document
    .querySelectorAll(".settings-nav-item")
    .forEach((n) => n.classList.remove("active"));
  document
    .querySelectorAll(".settings-section")
    .forEach((s) => s.classList.remove("active"));
  el.classList.add("active");
  document.getElementById(sectionId).classList.add("active");
}

function initSettingsForm() {
  if (!_currentAdmin) return;
  const nameEl = document.getElementById("profile-name");
  const emailEl = document.getElementById("profile-email");
  if (nameEl)
    nameEl.value = _currentAdmin.isSuperAdmin
      ? "Super Administrator"
      : _currentAdmin.name;
  if (emailEl) {
    emailEl.value = _currentAdmin.email;
    emailEl.disabled = _currentAdmin.isSuperAdmin;
    emailEl.title = _currentAdmin.isSuperAdmin
      ? "Super admin email cannot be changed here."
      : "";
  }
}

function saveProfile() {
  if (!_currentAdmin) return;
  const name = (document.getElementById("profile-name") || {}).value?.trim();
  const email = (document.getElementById("profile-email") || {}).value
    ?.trim()
    .toLowerCase();
  if (!name) {
    showToast("Name cannot be empty");
    return;
  }
  if (!_currentAdmin.isSuperAdmin) {
    const admins = loadAdmins();
    const idx = admins.findIndex((a) => a.email === _currentAdmin.email);
    if (idx !== -1) {
      if (email && email !== admins[idx].email) {
        if (email === SUPER_ADMIN_EMAIL) {
          showToast("That email is reserved.");
          return;
        }
        if (admins.find((a, i) => i !== idx && a.email === email)) {
          showToast("Email already in use by another admin.");
          return;
        }
        admins[idx].email = email;
        _currentAdmin.email = email;
        _adminEmail = email;
      }
      admins[idx].name = name;
      saveAdmins(admins);
      renderAdmins();
    }
  }
  _currentAdmin.name = name;
  applyRoleRestrictions();
  showSuccess("Profile Updated", "Your profile information has been saved.");
}

function changePassword() {
  if (!_currentAdmin) return;
  const cur = (document.getElementById("cur-pwd") || {}).value || "";
  const nw = (document.getElementById("new-pwd") || {}).value || "";
  const conf = (document.getElementById("conf-pwd") || {}).value || "";
  if (_currentAdmin.isSuperAdmin) {
    showToast("Super admin password is managed in the system configuration.");
    return;
  }
  const admins = loadAdmins();
  const idx = admins.findIndex((a) => a.email === _currentAdmin.email);
  if (idx === -1) {
    showToast("Admin account not found.");
    return;
  }
  if (cur !== admins[idx].password) {
    showToast("Current password is incorrect.");
    return;
  }
  if (nw.length < 8) {
    showToast("New password must be at least 8 characters.");
    return;
  }
  if (nw !== conf) {
    showToast("New passwords do not match.");
    return;
  }
  admins[idx].password = nw;
  saveAdmins(admins);
  ["cur-pwd", "new-pwd", "conf-pwd"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  showSuccess(
    "Password Updated",
    "Your password has been changed successfully."
  );
}

function initPaymentSettingsForm() {
  const ps = loadPaySettings();
  const f = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };
  f("setting-pay-link", ps.payLink);
  f("setting-pay-label", ps.payLabel);
  f("setting-bank-name", ps.bankName);
  f("setting-acc-name", ps.accName);
  f("setting-acc-num", ps.accNum);
  f("setting-branch", ps.branch);
  f("setting-ref-format", ps.refFormat || "ICH-{ID}");
  const typeEl = document.getElementById("setting-acc-type");
  if (typeEl && ps.accType) typeEl.value = ps.accType;
}

function savePaymentSettings() {
  const ps = {
    payLink:
      (document.getElementById("setting-pay-link") || {}).value?.trim() || "",
    payLabel:
      (document.getElementById("setting-pay-label") || {}).value?.trim() ||
      "Pay Online",
    bankName:
      (document.getElementById("setting-bank-name") || {}).value?.trim() || "",
    accName:
      (document.getElementById("setting-acc-name") || {}).value?.trim() || "",
    accNum:
      (document.getElementById("setting-acc-num") || {}).value?.trim() || "",
    branch:
      (document.getElementById("setting-branch") || {}).value?.trim() || "",
    accType:
      (document.getElementById("setting-acc-type") || {}).value ||
      "Cheque / Current",
    refFormat:
      (document.getElementById("setting-ref-format") || {}).value?.trim() ||
      "ICH-{ID}",
  };
  localStorage.setItem(LS_PAY, JSON.stringify(ps));
  showSuccess(
    "Payment Settings Saved",
    "Your payment link and bank details will appear on all future invoices."
  );
}
