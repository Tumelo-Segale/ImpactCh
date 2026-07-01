/* ============================================================
   Admin Tab - Dashboard
   ============================================================ */

function updateStats(subs, contacts) {
  document.getElementById("stat-total").textContent = subs.length;
  document.getElementById("stat-review").textContent = loadInvoices().length;
  document.getElementById("stat-published").textContent = loadInvoices().filter(
    (i) => {
      const due = new Date(i.issuedAt).getTime() + 14 * 86400000;
      return Date.now() <= due;
    }
  ).length;
  document.getElementById("stat-inquiries").textContent = contacts.length;
}

function renderDashRecent(subs) {
  const tbody = document.getElementById("dash-recent-table");
  if (!subs.length) {
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:2rem;">No submissions yet</td></tr>';
    return;
  }
  tbody.innerHTML = subs
    .slice(0, 6)
    .map(
      (s) => `
          <tr>
              <td><div class="td-title">${escHtml(
                s.title.length > 40 ? s.title.slice(0, 40) + "…" : s.title
              )}</div><div class="td-journal">${escHtml(
        getJournalAbbr(s.journal)
      )}</div></td>
              <td style="color:var(--text-muted);font-size:0.78rem;">${escHtml(
                s.authors
              )}</td>
              <td style="color:var(--text-muted);font-size:0.75rem;">${fmtDate(
                s.submittedAt
              )}</td>
          </tr>`
    )
    .join("");
}

function renderJournalBars(subs, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const counts = {};
  JOURNALS.forEach((j) => (counts[j.abbr] = 0));
  subs.forEach((s) => {
    const abbr = getJournalAbbr(s.journal);
    if (counts[abbr] !== undefined) counts[abbr]++;
  });
  const max = Math.max(1, ...Object.values(counts));
  el.innerHTML = JOURNALS.map(
    (j) => `
          <div class="journal-row">
              <div class="journal-abbr-mini">${j.abbr}</div>
              <div class="journal-bar-wrap"><div class="journal-bar-fill" style="width:${
                (counts[j.abbr] / max) * 100
              }%"></div></div>
              <div class="journal-count">${counts[j.abbr]}</div>
          </div>`
  ).join("");
}

function renderActivityFeed(subs) {
  const el = document.getElementById("activity-feed");
  if (!subs.length) {
    el.innerHTML =
      '<div class="empty-state"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><p>No recent activity</p></div>';
    return;
  }
  el.innerHTML = subs
    .slice(0, 8)
    .map(
      (s) => `
          <div class="activity-item">
              <div class="activity-icon" style="background:${
                s.status === "Published"
                  ? "var(--green-light)"
                  : "var(--blue-light)"
              };color:${
        s.status === "Published" ? "var(--green)" : "#7ba3ff"
      };">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
              </div>
              <div>
                  <div class="activity-text"><strong>${escHtml(
                    s.title.length > 50 ? s.title.slice(0, 50) + "…" : s.title
                  )}</strong> - ${escHtml(s.status)}</div>
                  <div class="activity-time">${escHtml(
                    getJournalAbbr(s.journal)
                  )} · ${fmtDate(s.submittedAt)}</div>
              </div>
          </div>`
    )
    .join("");
}
