/* ============================================================
   Admin - Reviewers & Issues (OJS)
   ============================================================ */

let _editReviewerId = null;
let _editIssueId = null;
let _manageIssueId = null;

// ===========================
// REVIEWERS
// ===========================
function renderReviewers() {
  const tbody = document.getElementById("reviewers-tbody");
  if (!tbody) return;
  const list = loadReviewers();
  const badge = document.getElementById("badge-reviewers");
  if (badge) badge.textContent = list.length;
  if (!list.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem;">No reviewers yet. Add reviewers to invite them to peer review manuscripts.</td></tr>';
    return;
  }
  const subs = loadSubs();
  tbody.innerHTML = list
    .map((rv) => {
      const all = subs.flatMap((s) =>
        (s.reviewAssignments || []).filter((a) => a.email === rv.email)
      );
      const active = all.filter((a) => a.status === "invited" || a.status === "accepted").length;
      const done = all.filter((a) => a.status === "completed").length;
      return `<tr>
        <td><div class="td-title">${escHtml(rv.name)}${
          loadAdmins().some((a) => a.email === rv.email)
            ? ' <span style="font-size:8px;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;padding:0.15rem 0.5rem;margin-left:0.35rem;background:rgba(193,154,107,0.1);color:var(--accent);border:1px solid rgba(193,154,107,0.25);">Sub-admin</span>'
            : ""
        }</div><div class="td-journal">${escHtml(rv.email)}</div></td>
        <td style="color:var(--text-muted);font-size:0.78rem;">${escHtml(rv.affiliation || "-")}</td>
        <td style="color:var(--text-muted);font-size:0.78rem;">${escHtml(rv.interests || "-")}</td>
        <td style="font-size:0.72rem;color:var(--accent);">${escHtml((rv.journals || []).join(", ") || "All")}</td>
        <td style="font-size:0.78rem;color:var(--text-muted);">${active} active · ${done} done</td>
        <td style="display:flex;gap:0.4rem;">
          <button class="btn-sm btn-ghost" style="padding:0.35rem 0.75rem;font-size:8px;" onclick="openReviewerModal('${rv.id}')">Edit</button>
          <button class="btn-sm btn-danger" style="padding:0.35rem 0.75rem;font-size:8px;" onclick="confirmDeleteReviewer('${rv.id}')">Delete</button>
        </td></tr>`;
    })
    .join("");
}

function openReviewerModal(id) {
  _editReviewerId = id || null;
  const rv = id ? loadReviewers().find((r) => r.id === id) : null;
  document.getElementById("reviewer-modal-title").textContent = rv ? "Edit Reviewer" : "Add Reviewer";
  document.getElementById("rv-name").value = rv ? rv.name : "";
  document.getElementById("rv-email").value = rv ? rv.email : "";
  document.getElementById("rv-affil").value = rv ? rv.affiliation || "" : "";
  document.getElementById("rv-interests").value = rv ? rv.interests || "" : "";
  document.getElementById("rv-journals").innerHTML = JOURNALS.map(
    (j) => `<label class="wf-check"><input type="checkbox" value="${j.abbr}" ${
      rv && (rv.journals || []).includes(j.abbr) ? "checked" : ""
    }> ${j.abbr}</label>`
  ).join("");
  const users = JSON.parse(localStorage.getItem(LS_USERS) || "[]");
  const sel = document.getElementById("rv-prefill");
  const subAdmins = loadAdmins();
  sel.innerHTML =
    '<option value="">Prefill from a sub-admin or registered user…</option>' +
    (subAdmins.length
      ? '<optgroup label="Sub-admins">' +
        subAdmins
          .map(
            (a, i) =>
              `<option value="a:${i}">${escHtml(a.name)} (${escHtml(a.email)})</option>`
          )
          .join("") +
        "</optgroup>"
      : "") +
    (users.length
      ? '<optgroup label="Registered users">' +
        users
          .map(
            (u, i) =>
              `<option value="u:${i}">${escHtml(u.firstName + " " + u.lastName)} (${escHtml(u.email)})</option>`
          )
          .join("") +
        "</optgroup>"
      : "");
  sel.parentElement.style.display = rv ? "none" : "";
  document.getElementById("rv-error").style.display = "none";
  document.getElementById("modal-reviewer").classList.add("open");
}

function prefillReviewer(sel) {
  if (sel.value === "") return;
  const [kind, idx] = sel.value.split(":");
  let name = "",
    email = "";
  if (kind === "a") {
    const a = loadAdmins()[Number(idx)];
    if (!a) return;
    name = a.name;
    email = a.email;
  } else {
    const u = JSON.parse(localStorage.getItem(LS_USERS) || "[]")[Number(idx)];
    if (!u) return;
    name = u.firstName + " " + u.lastName;
    email = u.email;
  }
  document.getElementById("rv-name").value = name;
  document.getElementById("rv-email").value = email;
}

function saveReviewer() {
  const name = document.getElementById("rv-name").value.trim();
  const email = document.getElementById("rv-email").value.trim().toLowerCase();
  const err = document.getElementById("rv-error");
  const list = loadReviewers();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    err.textContent = "Enter a name and a valid email address.";
    err.style.display = "block";
    return;
  }
  if (list.some((r) => r.email === email && r.id !== _editReviewerId)) {
    err.textContent = "A reviewer with this email already exists.";
    err.style.display = "block";
    return;
  }
  const journals = Array.from(
    document.querySelectorAll("#rv-journals input:checked")
  ).map((c) => c.value);
  const data = {
    name,
    email,
    affiliation: document.getElementById("rv-affil").value.trim(),
    interests: document.getElementById("rv-interests").value.trim(),
    journals,
  };
  if (_editReviewerId) {
    const i = list.findIndex((r) => r.id === _editReviewerId);
    if (i >= 0) list[i] = { ...list[i], ...data };
  } else {
    list.push({ id: ojsId("rv"), createdAt: ojsNow(), ...data });
  }
  saveReviewers(list);
  closeModal("modal-reviewer");
  renderReviewers();
  showToast("Reviewer saved");
}

function confirmDeleteReviewer(id) {
  showConfirm(
    "Delete Reviewer",
    "Remove this reviewer from the registry? Existing assignments are kept.",
    () => {
      saveReviewers(loadReviewers().filter((r) => r.id !== id));
      renderReviewers();
      showToast("Reviewer deleted");
    },
    "Delete",
    true
  );
}

// ===========================
// ISSUES
// ===========================
function renderIssues() {
  const tbody = document.getElementById("issues-tbody");
  if (!tbody) return;
  const issues = loadIssues();
  const badge = document.getElementById("badge-issues");
  if (badge) badge.textContent = issues.length;
  if (!issues.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem;">No issues yet. Create an issue to schedule accepted articles for publication.</td></tr>';
    return;
  }
  const subs = loadSubs();
  tbody.innerHTML = issues
    .slice()
    .sort((a, b) => b.year - a.year || b.volume - a.volume || b.number - a.number)
    .map((i) => {
      const arts = subs.filter((s) => s.issueId === i.id);
      return `<tr>
        <td style="color:var(--accent);font-weight:700;font-size:0.8rem;">${escHtml(i.journal)}</td>
        <td><div class="td-title">Vol. ${escHtml(String(i.volume))}, No. ${escHtml(String(i.number))} (${escHtml(String(i.year))})</div>
            <div class="td-journal">${escHtml(i.title || "")}</div></td>
        <td style="font-size:0.78rem;color:var(--text-muted);">${arts.length} article(s)</td>
        <td>${i.status === "published" ? ojsBadge("Published", "published") : ojsBadge("Unpublished", "submitted")}</td>
        <td style="font-size:0.75rem;color:var(--text-muted);">${i.publishedAt ? fmtDate(i.publishedAt) : "-"}</td>
        <td style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          <button class="btn-sm btn-accent" style="padding:0.35rem 0.75rem;font-size:8px;" onclick="openIssueManage('${i.id}')">Manage</button>
          <button class="btn-sm btn-ghost" style="padding:0.35rem 0.75rem;font-size:8px;" onclick="openIssueModal('${i.id}')">Edit</button>
          <button class="btn-sm btn-danger" style="padding:0.35rem 0.75rem;font-size:8px;" onclick="confirmDeleteIssue('${i.id}')">Delete</button>
        </td></tr>`;
    })
    .join("");
}

function openIssueModal(id) {
  _editIssueId = id || null;
  const i = id ? loadIssues().find((x) => x.id === id) : null;
  document.getElementById("issue-modal-title").textContent = i ? "Edit Issue" : "New Issue";
  const sel = document.getElementById("is-journal");
  sel.innerHTML = JOURNALS.map(
    (j) => `<option value="${j.abbr}" ${i && i.journal === j.abbr ? "selected" : ""}>${j.abbr} - ${escHtml(j.name)}</option>`
  ).join("");
  document.getElementById("is-volume").value = i ? i.volume : 1;
  document.getElementById("is-number").value = i ? i.number : 1;
  document.getElementById("is-year").value = i ? i.year : new Date().getFullYear();
  document.getElementById("is-title").value = i ? i.title || "" : "";
  document.getElementById("is-error").style.display = "none";
  document.getElementById("modal-issue").classList.add("open");
}

function saveIssue() {
  const journal = document.getElementById("is-journal").value;
  const volume = parseInt(document.getElementById("is-volume").value, 10);
  const number = parseInt(document.getElementById("is-number").value, 10);
  const year = parseInt(document.getElementById("is-year").value, 10);
  const title = document.getElementById("is-title").value.trim();
  const err = document.getElementById("is-error");
  const issues = loadIssues();
  if (!(volume > 0 && number > 0 && year > 1900)) {
    err.textContent = "Volume, number and year must be valid numbers.";
    err.style.display = "block";
    return;
  }
  if (
    issues.some(
      (i) =>
        i.id !== _editIssueId &&
        i.journal === journal &&
        i.volume === volume &&
        i.number === number
    )
  ) {
    err.textContent = "That volume and number already exists for this journal.";
    err.style.display = "block";
    return;
  }
  if (_editIssueId) {
    const idx = issues.findIndex((i) => i.id === _editIssueId);
    if (idx >= 0) issues[idx] = { ...issues[idx], journal, volume, number, year, title };
  } else {
    issues.push({
      id: ojsId("iss"),
      journal,
      volume,
      number,
      year,
      title,
      status: "unpublished",
      createdAt: ojsNow(),
    });
  }
  saveIssues(issues);
  closeModal("modal-issue");
  renderIssues();
  showToast("Issue saved");
}

function confirmDeleteIssue(id) {
  const used = loadSubs().filter((s) => s.issueId === id);
  if (used.length) {
    showToast("Remove articles from this issue first (" + used.length + " assigned)");
    return;
  }
  showConfirm(
    "Delete Issue",
    "Permanently delete this issue?",
    () => {
      saveIssues(loadIssues().filter((i) => i.id !== id));
      renderIssues();
      showToast("Issue deleted");
    },
    "Delete",
    true
  );
}

function openIssueManage(id) {
  _manageIssueId = id;
  renderIssueManage();
  document.getElementById("modal-issue-manage").classList.add("open");
}

function renderIssueManage() {
  const issue = loadIssues().find((i) => i.id === _manageIssueId);
  const el = document.getElementById("issue-manage-body");
  if (!issue || !el) return;
  const arts = loadSubs()
    .map(ojsNorm)
    .filter((s) => s.issueId === issue.id);
  const scheduled = arts.filter((s) => s.stage === "production");
  const rows = arts.length
    ? arts
        .map(
          (s) => `<div class="wf-assign"><div class="wf-assign-top">
            <div><b>${escHtml(s.title)}</b><div class="wf-muted">${escHtml(s.authors)}${s.pages ? " · pp. " + escHtml(s.pages) : ""}</div></div>
            <div>${ojsStatusBadge(s)}</div></div>
            <div class="wf-actions" style="margin-top:0.5rem;">
              <button class="btn-sm btn-ghost" onclick="closeModal('modal-issue-manage');openWorkflow('${s.id}')">Open Workflow</button>
              ${s.stage === "production" ? `<button class="btn-sm btn-danger" onclick="removeFromIssue('${s.id}')">Remove from Issue</button>` : ""}
            </div></div>`
        )
        .join("")
    : `<div class="wf-muted">No articles are scheduled for this issue yet. Schedule articles from the Production tab of a manuscript.</div>`;
  el.innerHTML = `
    <div class="wf-head-top" style="margin-bottom:1rem;">
      <div><div class="wf-journal">${escHtml(issue.journal)}</div>
      <div class="wf-title">${escHtml(ojsIssueLabel(issue))}</div></div>
      <div>${issue.status === "published" ? ojsBadge("Published", "published") : ojsBadge("Unpublished", "submitted")}</div>
    </div>${rows}
    <div class="wf-actions" style="margin-top:1.25rem;">
      ${
        issue.status !== "published"
          ? `<button class="btn-sm btn-accent" onclick="publishIssue('${issue.id}')" ${scheduled.length ? "" : "disabled"}>Publish Issue (${scheduled.length} article${scheduled.length === 1 ? "" : "s"})</button>`
          : `<button class="btn-sm btn-danger" onclick="unpublishIssue('${issue.id}')">Unpublish Issue</button>`
      }
      <button class="btn-sm btn-ghost" onclick="exportIssueToc('${issue.id}')">Download Issue TOC (HTML)</button>
    </div>`;
}

function removeFromIssue(subId) {
  const sub = ojsMutate(subId, (s) => {
    s.issueId = "";
    ojsEvent(s, "Removed from issue");
  });
  if (sub) {
    renderIssueManage();
    renderIssues();
  }
}

function publishIssue(id) {
  const arts = loadSubs()
    .map(ojsNorm)
    .filter((s) => s.issueId === id && s.stage === "production");
  const unpaid = arts.filter((s) => {
    const inv = ojsInvoiceFor(s.id);
    return inv && !inv.paid;
  });
  const go = () => {
    arts.forEach((s) => ojsPublishArticle(s.id)); // each one syncs to the site
    const issues = loadIssues();
    const i = issues.find((x) => x.id === id);
    if (i) {
      i.status = "published";
      i.publishedAt = ojsNow();
      saveIssues(issues);
    }
    renderIssueManage();
    renderIssues();
    refreshAll();
    showToast("Issue published");
  };
  if (unpaid.length && !ojsIsSuper()) {
    showToast(unpaid.length + " article(s) have unconfirmed publication fees - ask a Super Admin to confirm payment.");
    return;
  }
  if (unpaid.length) {
    showConfirm(
      "Unpaid Publication Fees",
      unpaid.length + " article(s) in this issue have unpaid invoices. Publish the issue anyway?",
      go,
      "Publish Anyway"
    );
  } else go();
}

function unpublishIssue(id) {
  showConfirm(
    "Unpublish Issue",
    "The issue will be hidden from the public archive. Its articles stay published (Online First).",
    () => {
      const issues = loadIssues();
      const i = issues.find((x) => x.id === id);
      if (i) {
        i.status = "unpublished";
        i.publishedAt = null;
        saveIssues(issues);
      }
      renderIssueManage();
      renderIssues();
    },
    "Unpublish",
    true
  );
}

// ===========================
// EXPORTS (static pages for Google Scholar - see articles/README.md)
// ===========================
function ojsSafeName(title) {
  return String(title || "article")
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60);
}
function ojsDownload(filename, mime, text) {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
function ojsAttr(s) {
  return escHtml(String(s == null ? "" : s));
}

function ojsEnsureSlug(sub, all) {
  if (sub.articleSlug) return sub.articleSlug;
  const base = ojsSafeName(sub.title) || "article";
  const taken = (all || []).some((x) => x.id !== sub.id && x.articleSlug === base);
  return taken ? base + "_" + String(sub.id).slice(-6) : base;
}

function ojsLandingHtml(sub, cfg) {
  cfg = cfg || (typeof loadSiteSettings === "function" ? loadSiteSettings() : { baseUrl: "https://impactch.com" });
  const abbr = getJournalAbbr(sub.journal);
  const issue = loadIssues().find((i) => i.id === sub.issueId);
  const pub = new Date(sub.publishedAt || sub.approvedAt || Date.now());
  const date = pub.getFullYear() + "/" + String(pub.getMonth() + 1).padStart(2, "0") + "/" + String(pub.getDate()).padStart(2, "0");
  const slug = sub.articleSlug || ojsSafeName(sub.title);
  const base = (cfg.baseUrl || "https://impactch.com") + "/articles/";
  const contribs = ojsContributors(sub);
  const authors = contribs.filter((c) => AUTHOR_ROLES.includes(c.role));
  const others = contribs.filter((c) => !AUTHOR_ROLES.includes(c.role));
  const m = [];
  const meta = (n, v) => v !== "" && v != null && m.push(`<meta name="${n}" content="${ojsAttr(v)}">`);
  meta("citation_title", sub.title);
  authors.forEach((a) => {
    meta("citation_author", a.name);
    meta("citation_author_institution", a.affiliation);
  });
  meta("citation_journal_title", sub.journal);
  meta("citation_journal_abbrev", abbr);
  meta("citation_publisher", "Impact Compass Holdings");
  meta("citation_publication_date", date);
  meta("citation_year", pub.getFullYear());
  if (issue) {
    meta("citation_volume", issue.volume);
    meta("citation_issue", issue.number);
  }
  if (sub.pages) {
    const [fp, lp] = String(sub.pages).split(/[-–]/).map((x) => x.trim());
    meta("citation_firstpage", fp);
    meta("citation_lastpage", lp);
  }
  meta("citation_doi", sub.doi);
  meta("citation_abstract", sub.abstract);
  meta("citation_language", "en");
  meta("citation_keywords", sub.keywords);
  meta("citation_issn", journalIssn(abbr));
  meta("citation_pdf_url", base + slug + ".pdf");
  meta("citation_fulltext_html_url", base + slug + ".html");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${ojsAttr(sub.title)} | ${ojsAttr(abbr)}</title>
${m.join("\n")}
<style>body{font-family:Georgia,serif;max-width:46rem;margin:3rem auto;padding:0 1.25rem;line-height:1.7;color:#222}h1{font-size:1.8rem;line-height:1.25}.meta{color:#666;font-size:.9rem}a.btn{display:inline-block;margin-top:1rem;padding:.6rem 1.2rem;background:#c19a6b;color:#050506;text-decoration:none;font-family:sans-serif;font-size:.85rem;font-weight:700}</style>
</head><body>
<p class="meta">${ojsAttr(sub.journal)}${issue ? " · " + ojsAttr(ojsIssueLabel(issue)) : ""}</p>
<h1>${ojsAttr(sub.title)}</h1>
<p class="meta">${authors.map((a) => ojsAttr(a.name) + (a.affiliation ? " (" + ojsAttr(a.affiliation) + ")" : "")).join("; ")}</p>
${others.length ? `<p class="meta">${others.map((c) => ojsAttr(c.name) + " - " + ojsAttr(c.role)).join("; ")}</p>` : ""}
<h2>Abstract</h2><p>${ojsAttr(sub.abstract)}</p>
${sub.keywords ? `<p class="meta"><b>Keywords:</b> ${ojsAttr(sub.keywords)}</p>` : ""}
${sub.doi ? `<p class="meta"><b>DOI:</b> ${ojsAttr(sub.doi)}</p>` : ""}
<a class="btn" href="${slug}.pdf">Download PDF</a>
<p class="meta" style="margin-top:2rem">© ${pub.getFullYear()} Impact Compass Holdings (PTY) LTD</p>
</body></html>`;
}

function exportArticleLanding(subId) {
  const sub = ojsGetSub(subId);
  if (!sub) return;
  ojsDownload((sub.articleSlug || ojsSafeName(sub.title)) + ".html", "text/html", ojsLandingHtml(sub));
  showToast("Landing page downloaded");
}

function exportIssueToc(issueId) {
  const issue = loadIssues().find((i) => i.id === issueId);
  if (!issue) return;
  const arts = loadSubs().map(ojsNorm).filter((s) => s.issueId === issueId && s.stage === "published");
  const items = arts
    .map(
      (s) => `<li><a href="${ojsSafeName(s.title)}.html">${ojsAttr(s.title)}</a><br><span>${ojsAttr(s.authors)}${s.pages ? " · pp. " + ojsAttr(s.pages) : ""}</span></li>`
    )
    .join("\n");
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${ojsAttr(issue.journal)} ${ojsAttr(ojsIssueLabel(issue))}</title>
<style>body{font-family:Georgia,serif;max-width:46rem;margin:3rem auto;padding:0 1.25rem;line-height:1.6;color:#222}li{margin:1rem 0}span{color:#666;font-size:.9rem}a{color:#8a6a3f}</style>
</head><body><h1>${ojsAttr(issue.journal)}</h1><h2>${ojsAttr(ojsIssueLabel(issue))}</h2><ol>${items || "<li>No published articles.</li>"}</ol></body></html>`;
  ojsDownload(`issue_${issue.journal}_v${issue.volume}n${issue.number}.html`, "text/html", html);
}
