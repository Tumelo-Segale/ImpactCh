/* ============================================================
   Impact Compass Holdings - OJS (public side)
   Author workflow tracker, Reviewer dashboard, Journal archive.
   Loaded after app.js, user-auth.js and submissions.js.
   ============================================================ */

const LS_ISSUES_PUB = "ich_issues";
const LS_CONTACTS_PUB = "ich_contacts";

const OJS_STAGES = [
  { id: "submission", label: "Submission" },
  { id: "review", label: "Review" },
  { id: "copyediting", label: "Copyediting" },
  { id: "production", label: "Production" },
  { id: "published", label: "Published" },
];

const REC_LABELS = {
  accept: "Accept Submission",
  minor: "Revisions Required (Minor)",
  major: "Revisions Required (Major)",
  resubmit: "Resubmit for Review",
  decline: "Decline Submission",
};

let _stagedRevision = [];
let _archiveFilter = { journal: "", query: "" };
let _reviewAid = null;
let _reviewSubId = null;
let _copyeditSubId = null;

// ===== HELPERS =====
function pubId(prefix) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function pubDate(iso) {
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
function journalAbbr(name) {
  const j = JOURNALS.find((x) => x.name === name || x.abbr === name);
  return j ? j.abbr : name || "";
}
function pubNorm(s) {
  return {
    ...s,
    stage: s.stage || (s.status === "Published" ? "published" : "submission"),
    round: s.round || 1,
    reviewAssignments: s.reviewAssignments || [],
    decisions: s.decisions || [],
    revisions: s.revisions || [],
    discussions: s.discussions || [],
    history: s.history || [],
    copyeditFiles: s.copyeditFiles || [],
    galleyFiles: s.galleyFiles || [],
  };
}
function loadPubIssues() {
  try {
    return JSON.parse(localStorage.getItem(LS_ISSUES_PUB)) || [];
  } catch {
    return [];
  }
}
function pubActorName() {
  const u = getCurrentUser();
  return u ? u.firstName + " " + u.lastName : "Author";
}

// Apply fn to a normalised copy of one submission and save it.
function pubMutate(id, fn) {
  const subs = loadSubmissions();
  const idx = subs.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const sub = pubNorm(subs[idx]);
  fn(sub);
  subs[idx] = sub;
  try {
    saveSubmissions(subs);
  } catch {
    showSuccess(
      "Storage Full",
      "Your browser storage is full, so this could not be saved. Try smaller files."
    );
    return null;
  }
  return sub;
}
function pubEvent(sub, text) {
  sub.history.push({ at: new Date().toISOString(), by: pubActorName(), text });
}
function notifyEditorial(entry) {
  try {
    const existing = JSON.parse(localStorage.getItem(LS_CONTACTS_PUB) || "[]");
    existing.unshift({ ...entry, date: new Date().toISOString(), read: false });
    localStorage.setItem(LS_CONTACTS_PUB, JSON.stringify(existing));
  } catch {}
}
function downloadDataFile(f) {
  if (!f || !f.data || !String(f.data).startsWith("data:")) return false;
  const a = document.createElement("a");
  a.href = f.data;
  a.download = f.name || "file";
  a.click();
  return true;
}
function fileLinks(files) {
  if (!files || !files.length)
    return '<span class="ojs-muted">No files.</span>';
  return files
    .map((f) =>
      f.data && String(f.data).startsWith("data:")
        ? `<a class="ojs-file" href="${f.data}" download="${escapeHtml(f.name)}">⬇ ${escapeHtml(f.name)}</a>`
        : `<span class="ojs-file muted">${escapeHtml(f.name || "file")} (metadata only)</span>`
    )
    .join("");
}

// ============================================================
// AUTHOR: workflow panel shown inside each submission card
// ============================================================
function buildOjsPanel(raw) {
  const sub = pubNorm(raw);
  const declined = sub.status === "Declined";
  const cur = OJS_STAGES.findIndex((s) => s.id === sub.stage);

  const stepper = declined
    ? `<div class="ojs-banner bad"><b>Declined.</b> The editor has declined this submission.</div>`
    : `<div class="ojs-stepper">${OJS_STAGES.map(
        (s, i) =>
          `<div class="ojs-step ${i < cur ? "done" : i === cur ? "current" : ""}"><span class="ojs-dot">${
            i < cur ? "✓" : i + 1
          }</span><span class="ojs-step-label">${s.label}</span></div>`
      ).join("")}</div>`;

  // Latest editorial decision visible to the author
  const decisions = sub.decisions.filter(
    (d) => d.type !== "send_to_review" && d.type !== "new_round"
  );
  const last = decisions[decisions.length - 1];
  let decisionHtml = "";
  if (last) {
    const shared = (last.sharedReviewIds || [])
      .map((rid) => sub.reviewAssignments.find((a) => a.id === rid))
      .filter(Boolean);
    const reviewsHtml = shared.length
      ? `<details class="ojs-details"><summary>Reviewer comments (${shared.length})</summary>${shared
          .map(
            (a, i) => `<div class="ojs-review">
              <div class="ojs-muted">Reviewer ${i + 1} · ${escapeHtml(REC_LABELS[a.recommendation] || "")}</div>
              <div class="ojs-text">${escapeHtml(a.toAuthor || "")}</div></div>`
          )
          .join("")}</details>`
      : "";
    const kind = last.type === "decline" ? "bad" : last.type === "accept" ? "good" : "warn";
    decisionHtml = `<div class="ojs-banner ${kind}">
      <b>Editorial decision: ${escapeHtml(last.label)}</b> <span class="ojs-muted">· ${pubDate(last.at)}</span>
      ${last.note ? `<div class="ojs-text">${escapeHtml(last.note)}</div>` : ""}
      ${reviewsHtml}</div>`;
  }

  // Revision request
  let actions = "";
  if (sub.awaitingRevision && !declined) {
    actions += `<div class="ojs-banner warn"><b>Revisions requested.</b> Upload your revised manuscript and a response to the reviewers.
      <div style="margin-top:0.75rem;"><button class="btn-primary" style="font-size:10px;padding:0.7rem 1.4rem;" onclick="openRevise('${sub.id}')">Submit Revisions</button></div></div>`;
  }

  // Copyedit approval
  if (sub.stage === "copyediting" && sub.copyeditRequestedAt && sub.copyeditFiles.length) {
    const appr = sub.copyeditApproval;
    if (appr && appr.status === "approved") {
      actions += `<div class="ojs-banner good">You approved the copyedited manuscript on ${pubDate(appr.at)}.</div>`;
    } else if (appr && appr.status === "changes") {
      actions += `<div class="ojs-banner warn">You requested changes to the copyedit on ${pubDate(appr.at)}. The editor will upload a new version.</div>`;
    } else {
      actions += `<div class="ojs-banner warn"><b>Please review your copyedited manuscript.</b>
        <div class="ojs-files">${fileLinks(sub.copyeditFiles)}</div>
        <div class="ojs-btn-row">
          <button class="btn-primary" style="font-size:10px;padding:0.7rem 1.4rem;" onclick="approveCopyedit('${sub.id}')">Approve Copyedit</button>
          <button class="btn-ghost" style="font-size:10px;padding:0.7rem 1.4rem;" onclick="openCopyeditChanges('${sub.id}')">Request Changes</button>
        </div></div>`;
    }
  }

  // Messages from the editor
  const msgs = sub.discussions.filter((m) => m.role === "editor");
  const msgHtml = msgs.length
    ? `<details class="ojs-details"><summary>Messages from the editor (${msgs.length})</summary>${msgs
        .map(
          (m) => `<div class="ojs-review"><div class="ojs-muted">${escapeHtml(m.by)} · ${pubDate(m.at)}</div><div class="ojs-text">${escapeHtml(m.text)}</div></div>`
        )
        .join("")}</details>`
    : "";

  const round =
    sub.stage === "review" && !declined
      ? `<div class="ojs-muted" style="margin-top:0.5rem;">Review round ${sub.round}</div>`
      : "";

  return `<div class="ojs-panel">${stepper}${round}${decisionHtml}${actions}${msgHtml}</div>`;
}

// ===== Submit revisions =====
function openRevise(id) {
  const sub = loadSubmissions().find((s) => s.id === id);
  if (!sub) return;
  _stagedRevision = [];
  document.getElementById("revise-title").textContent = sub.title;
  document.getElementById("revise-file").value = "";
  document.getElementById("revise-file-list").innerHTML = "";
  document.getElementById("revise-note").value = "";
  document.getElementById("modal-revise").dataset.subId = id;
  openModal("modal-revise");
}

async function submitRevision() {
  const id = document.getElementById("modal-revise").dataset.subId;
  const note = document.getElementById("revise-note").value.trim();
  if (!_stagedRevision.length) {
    showSuccess("Missing File", "Please upload your revised manuscript.");
    return;
  }
  if (!note) {
    showSuccess("Missing Response", "Please describe the changes you made / respond to the reviewers.");
    return;
  }
  let files;
  try {
    files = await Promise.all(_stagedRevision.map(readFileAsBase64));
  } catch {
    files = _stagedRevision.map((f) => ({ name: f.name, size: f.size, type: f.type, data: null }));
  }
  const sub = pubMutate(id, (s) => {
    s.revisions.push({ round: s.round, at: new Date().toISOString(), note, files });
    s.awaitingRevision = false;
    pubEvent(s, "Revised manuscript submitted for round " + s.round);
  });
  if (!sub) return;
  notifyEditorial({
    name: pubActorName(),
    email: (getCurrentUser() || {}).email || "",
    subject: "Revision Submitted - " + sub.title.slice(0, 50),
    message: "The author submitted a revised manuscript.\n\n" + note + "\n\n[Manuscript ID: " + sub.id + "]",
    type: "revision_submitted",
  });
  _stagedRevision = [];
  closeModal("modal-revise");
  showSuccess("Revisions Submitted", "Your revised manuscript has been sent to the editor.");
  renderDashboard();
}

// ===== Copyedit approval =====
function approveCopyedit(id) {
  showConfirm(
    "Approve Copyedit",
    "Confirm that the copyedited manuscript is correct and ready for production?",
    () => {
      const sub = pubMutate(id, (s) => {
        s.copyeditApproval = { status: "approved", at: new Date().toISOString(), note: "" };
        pubEvent(s, "Author approved the copyedited manuscript");
      });
      if (sub) {
        notifyEditorial({
          name: pubActorName(),
          email: (getCurrentUser() || {}).email || "",
          subject: "Copyedit Approved - " + sub.title.slice(0, 50),
          message: "The author approved the copyedited manuscript.\n\n[Manuscript ID: " + sub.id + "]",
          type: "copyedit_update",
        });
        renderDashboard();
      }
    },
    "Approve"
  );
}
function openCopyeditChanges(id) {
  _copyeditSubId = id;
  document.getElementById("copyedit-note").value = "";
  openModal("modal-copyedit");
}
function submitCopyeditChanges() {
  const note = document.getElementById("copyedit-note").value.trim();
  if (!note) {
    showSuccess("Missing Details", "Please describe the changes you need.");
    return;
  }
  const sub = pubMutate(_copyeditSubId, (s) => {
    s.copyeditApproval = { status: "changes", at: new Date().toISOString(), note };
    pubEvent(s, "Author requested changes to the copyedit");
  });
  closeModal("modal-copyedit");
  if (sub) {
    notifyEditorial({
      name: pubActorName(),
      email: (getCurrentUser() || {}).email || "",
      subject: "Copyedit Changes Requested - " + sub.title.slice(0, 50),
      message: note + "\n\n[Manuscript ID: " + sub.id + "]",
      type: "copyedit_update",
    });
    renderDashboard();
  }
}

// ============================================================
// REVIEWER DASHBOARD
// ============================================================
function reviewerAssignments() {
  const user = getCurrentUser();
  if (!user) return [];
  const email = String(user.email || "").toLowerCase();
  const out = [];
  loadSubmissions().forEach((raw) => {
    const sub = pubNorm(raw);
    sub.reviewAssignments.forEach((a) => {
      if (String(a.email || "").toLowerCase() === email) out.push({ sub, a });
    });
  });
  return out;
}

function renderReviewerDashboard() {
  const el = document.getElementById("reviewer-content");
  if (!el) return;
  const list = reviewerAssignments();
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><p>You have no review assignments.</p>
      <p style="font-size:0.78rem;margin-top:0.5rem;">Reviewers are invited by the editorial office. Sign in with the email address the invitation was sent to.</p></div>`;
    return;
  }
  const order = { invited: 0, accepted: 1, completed: 2, declined: 3 };
  list.sort((x, y) => order[x.a.status] - order[y.a.status]);
  el.innerHTML = `<div class="submissions-list">${list.map(({ sub, a }) => buildReviewCard(sub, a)).join("")}</div>`;
}

function buildReviewCard(sub, a) {
  const open =
    a.round === sub.round && sub.stage === "review" && sub.status !== "Declined";
  const files = sub.revisions.length && a.round === sub.round
    ? sub.revisions[sub.revisions.length - 1].files
    : sub.manuscriptFiles;
  const due = a.dueAt ? new Date(a.dueAt) : null;
  const overdue = due && due.getTime() < Date.now() && (a.status === "invited" || a.status === "accepted");
  const label = { invited: "Invitation", accepted: "In progress", completed: "Completed", declined: "Declined" }[a.status];
  let actions = "";
  if (open && a.status === "invited") {
    actions = `<button class="btn-primary" style="font-size:10px;padding:0.7rem 1.4rem;" onclick="respondInvitation('${sub.id}','${a.id}',true)">Accept Invitation</button>
               <button class="btn-ghost" style="font-size:10px;padding:0.7rem 1.4rem;" onclick="respondInvitation('${sub.id}','${a.id}',false)">Decline</button>`;
  } else if (open && a.status === "accepted") {
    actions = `<button class="btn-primary" style="font-size:10px;padding:0.7rem 1.4rem;" onclick="openReviewForm('${sub.id}','${a.id}')">Submit Review</button>`;
  } else if (a.status === "completed") {
    actions = `<div class="ojs-muted">Submitted ${pubDate(a.completedAt)} · ${escapeHtml(REC_LABELS[a.recommendation] || "")}</div>`;
  } else if (!open && (a.status === "invited" || a.status === "accepted")) {
    actions = `<div class="ojs-muted">This review is no longer open.</div>`;
  }
  return `<div class="glass-card submission-card">
    <div class="submission-head"><div>
      <div class="submission-journal">${escapeHtml(sub.journal)}</div>
      <div class="submission-title">${escapeHtml(sub.title)}</div>
      <div class="ojs-muted">Authors withheld for blind review · Round ${a.round}</div>
    </div><div class="ojs-chip ${a.status}">${label}</div></div>
    <details class="ojs-details"><summary>Abstract</summary><div class="ojs-text">${escapeHtml(sub.abstract)}</div></details>
    ${a.status !== "declined" ? `<div class="ojs-files">${fileLinks(files)}</div>` : ""}
    <div class="ojs-muted" style="margin-top:0.6rem;${overdue ? "color:#f87171;" : ""}">Review due: ${pubDate(a.dueAt)}${overdue ? " (overdue)" : ""}</div>
    <div class="ojs-btn-row">${actions}</div></div>`;
}

function respondInvitation(subId, aid, accept) {
  const go = () => {
    const sub = pubMutate(subId, (s) => {
      const a = s.reviewAssignments.find((x) => x.id === aid);
      if (!a) return;
      a.status = accept ? "accepted" : "declined";
      a.respondedAt = new Date().toISOString();
      pubEvent(s, "Reviewer " + a.name + (accept ? " accepted" : " declined") + " the invitation");
    });
    if (!sub) return;
    notifyEditorial({
      name: pubActorName(),
      email: (getCurrentUser() || {}).email || "",
      subject: "Review Invitation " + (accept ? "Accepted" : "Declined") + " - " + sub.title.slice(0, 50),
      message: "Reviewer response recorded.\n\n[Manuscript ID: " + sub.id + "]",
      type: "review_update",
    });
    renderReviewerDashboard();
  };
  if (accept) go();
  else showConfirm("Decline Invitation", "Decline this review invitation?", go, "Decline");
}

function openReviewForm(subId, aid) {
  const sub = loadSubmissions().find((s) => s.id === subId);
  if (!sub) return;
  _reviewSubId = subId;
  _reviewAid = aid;
  document.getElementById("review-title").textContent = sub.title;
  document.getElementById("review-rec").value = "";
  document.getElementById("review-author").value = "";
  document.getElementById("review-editor").value = "";
  openModal("modal-review");
}

function submitReview() {
  const rec = document.getElementById("review-rec").value;
  const toAuthor = document.getElementById("review-author").value.trim();
  const toEditor = document.getElementById("review-editor").value.trim();
  if (!rec || !toAuthor) {
    showSuccess("Missing Information", "Please choose a recommendation and write comments to the author.");
    return;
  }
  const sub = pubMutate(_reviewSubId, (s) => {
    const a = s.reviewAssignments.find((x) => x.id === _reviewAid);
    if (!a) return;
    a.status = "completed";
    a.recommendation = rec;
    a.toAuthor = toAuthor;
    a.toEditor = toEditor;
    a.completedAt = new Date().toISOString();
    pubEvent(s, "Review submitted by " + a.name);
  });
  closeModal("modal-review");
  if (!sub) return;
  notifyEditorial({
    name: pubActorName(),
    email: (getCurrentUser() || {}).email || "",
    subject: "Review Submitted - " + sub.title.slice(0, 50),
    message: "Recommendation: " + (REC_LABELS[rec] || rec) + "\n\n[Manuscript ID: " + sub.id + "]",
    type: "review_update",
  });
  showSuccess("Review Submitted", "Thank you. Your review has been sent to the editor.");
  renderReviewerDashboard();
}

// ============================================================
// ARCHIVE
// ============================================================
function openJournalArchive(abbr) {
  _archiveFilter.journal = abbr;
  switchJournalView("archive");
}

function archiveArticles() {
  return loadSubmissions()
    .map(pubNorm)
    .filter((s) => s.stage === "published" && s.status === "Published");
}

function renderArchive() {
  const el = document.getElementById("archive-content");
  if (!el) return;
  const sel = document.getElementById("archive-journal");
  if (sel && sel.options.length === 0) {
    sel.innerHTML =
      '<option value="">All journals</option>' +
      JOURNALS.map((j) => `<option value="${j.abbr}">${j.abbr}</option>`).join("");
  }
  if (sel) sel.value = _archiveFilter.journal;
  const q = _archiveFilter.query.toLowerCase();
  const arts = archiveArticles().filter((s) => {
    if (_archiveFilter.journal && journalAbbr(s.journal) !== _archiveFilter.journal) return false;
    if (!q) return true;
    return [s.title, s.authors, s.keywords, s.abstract].join(" ").toLowerCase().includes(q);
  });
  const issues = loadPubIssues().filter(
    (i) => i.status === "published" && (!_archiveFilter.journal || i.journal === _archiveFilter.journal)
  );
  issues.sort((a, b) => b.year - a.year || b.volume - a.volume || b.number - a.number);

  const inIssue = new Set();
  let html = "";
  issues.forEach((i) => {
    const list = arts.filter((s) => s.issueId === i.id);
    list.forEach((s) => inIssue.add(s.id));
    if (!list.length) return;
    html += `<div class="archive-issue">
      <div class="archive-issue-head"><span class="archive-abbr">${escapeHtml(i.journal)}</span>
        <h3>Vol. ${escapeHtml(String(i.volume))}, No. ${escapeHtml(String(i.number))} (${escapeHtml(String(i.year))})${
          i.title ? " - " + escapeHtml(i.title) : ""
        }</h3></div>${list.map(buildArticleCard).join("")}</div>`;
  });
  const onlineFirst = arts.filter((s) => !inIssue.has(s.id));
  if (onlineFirst.length) {
    onlineFirst.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
    html += `<div class="archive-issue">
      <div class="archive-issue-head"><span class="archive-abbr">Online First</span><h3>Recently Published Articles</h3></div>
      ${onlineFirst.map(buildArticleCard).join("")}</div>`;
  }
  el.innerHTML =
    html ||
    `<div class="empty-state"><p>No published articles found.</p></div>`;
}

function buildArticleCard(s) {
  const abbr = journalAbbr(s.journal);
  return `<div class="glass-card article-card">
    <div class="article-meta">${escapeHtml(abbr)}${
      journalIssn(abbr) ? " · ISSN " + journalIssn(abbr) : ""
    } · ${pubDate(s.publishedAt || s.approvedAt)}${s.pages ? " · pp. " + escapeHtml(s.pages) : ""}</div>
    <div class="article-title">${escapeHtml(s.title)}</div>
    <div class="article-authors">${escapeHtml(s.authors)}</div>
    ${s.doi ? `<div class="article-doi">DOI: ${escapeHtml(s.doi)}</div>` : ""}
    <details class="ojs-details"><summary>Abstract</summary><div class="ojs-text">${escapeHtml(s.abstract)}</div>${
      s.keywords ? `<div class="ojs-muted" style="margin-top:0.5rem;">Keywords: ${escapeHtml(s.keywords)}</div>` : ""
    }</details>
    <div class="ojs-btn-row"><button class="btn-primary" style="font-size:10px;padding:0.7rem 1.4rem;" onclick="downloadGalley('${s.id}')">Download PDF</button></div>
  </div>`;
}

function downloadGalley(id) {
  const s = pubNorm(loadSubmissions().find((x) => x.id === id) || {});
  if (!s.id) return;
  if (s.galleyFiles.length && downloadDataFile(s.galleyFiles[0])) return;
  generateGalley(id);
}

function onArchiveFilter() {
  _archiveFilter.journal = document.getElementById("archive-journal").value;
  _archiveFilter.query = document.getElementById("archive-search").value.trim();
  renderArchive();
}
