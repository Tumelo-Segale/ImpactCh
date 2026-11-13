/* ============================================================
   Admin - OJS Core (storage, stages, helpers)
   Open Journal Systems-style editorial workflow:
   Submission -> Review -> Copyediting -> Production -> Published
   Loaded after admin-core.js (uses loadSubs/saveSubs/showToast).
   ============================================================ */

const LS_REVIEWERS = "ich_reviewers";
const LS_ISSUES = "ich_issues";

const STAGES = [
  { id: "submission", label: "Submission" },
  { id: "review", label: "Review" },
  { id: "copyediting", label: "Copyediting" },
  { id: "production", label: "Production" },
  { id: "published", label: "Published" },
];

const RECOMMENDATIONS = {
  accept: "Accept Submission",
  minor: "Revisions Required (Minor)",
  major: "Revisions Required (Major)",
  resubmit: "Resubmit for Review",
  decline: "Decline Submission",
};

// ===== STORAGE =====
function loadReviewers() {
  try {
    return JSON.parse(localStorage.getItem(LS_REVIEWERS)) || [];
  } catch {
    return [];
  }
}
function saveReviewers(r) {
  localStorage.setItem(LS_REVIEWERS, JSON.stringify(r));
}
function loadIssues() {
  try {
    return JSON.parse(localStorage.getItem(LS_ISSUES)) || [];
  } catch {
    return [];
  }
}
function saveIssues(i) {
  localStorage.setItem(LS_ISSUES, JSON.stringify(i));
}

function ojsId(prefix) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function ojsNow() {
  return new Date().toISOString();
}
const AUTHOR_ROLES = ["Author", "Corresponding Author", "Co-Author"];
const CONTRIBUTOR_ROLES = [...AUTHOR_ROLES, "Translator", "Contributor"];

// Contributors default to the comma-separated authors string until edited.
function ojsContributors(sub) {
  if (sub.contributors && sub.contributors.length) return sub.contributors;
  return String(sub.authors || "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .map((name) => ({ id: ojsId("ct"), name, email: "", affiliation: "", role: "Author" }));
}
// Keep the legacy `authors` string (used everywhere else) in sync.
function ojsSyncAuthors(sub) {
  sub.authors = (sub.contributors || [])
    .filter((c) => AUTHOR_ROLES.includes(c.role))
    .map((c) => c.name)
    .join(", ");
}
function ojsIsSuper() {
  return !!(_currentAdmin && _currentAdmin.isSuperAdmin);
}
function ojsActor() {
  return _currentAdmin ? _currentAdmin.name : "Editor";
}

// ===== NORMALISATION =====
// Older submissions only have `status`. Give every record the OJS fields.
function ojsNorm(s) {
  const stage = s.stage || (s.status === "Published" ? "published" : "submission");
  return {
    ...s,
    stage,
    round: s.round || 1,
    reviewAssignments: s.reviewAssignments || [],
    decisions: s.decisions || [],
    revisions: s.revisions || [],
    discussions: s.discussions || [],
    history: s.history || [],
    copyeditFiles: s.copyeditFiles || [],
    galleyFiles: s.galleyFiles || [],
    awaitingRevision: !!s.awaitingRevision,
  };
}

function ojsGetSub(id) {
  const s = loadSubs().find((x) => x.id === id);
  return s ? ojsNorm(s) : null;
}

// Apply fn to a normalised copy of the submission and persist it.
// Returns the updated submission, or null if storage failed / not found.
function ojsMutate(id, fn) {
  const subs = loadSubs();
  const idx = subs.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const sub = ojsNorm(subs[idx]);
  fn(sub);
  subs[idx] = sub;
  try {
    saveSubs(subs);
  } catch {
    showToast("Storage full - could not save. Remove large files and retry.");
    return null;
  }
  return sub;
}

function ojsEvent(sub, text) {
  sub.history.push({ at: ojsNow(), by: ojsActor(), text });
}

function ojsStageIndex(stage) {
  return STAGES.findIndex((s) => s.id === stage);
}
function ojsStageLabel(sub) {
  if (sub.status === "Declined") return "Declined";
  const st = STAGES.find((s) => s.id === sub.stage);
  return st ? st.label : "Submission";
}

// ===== REVIEW HELPERS =====
function ojsRoundAssignments(sub, round) {
  return sub.reviewAssignments.filter((a) => a.round === (round || sub.round));
}
function ojsActiveReviewCount(email) {
  return loadSubs().reduce(
    (n, s) =>
      n +
      (s.reviewAssignments || []).filter(
        (a) =>
          a.email === email && (a.status === "invited" || a.status === "accepted")
      ).length,
    0
  );
}

// ===== FILES =====
function ojsReadFile(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () =>
      resolve({ name: file.name, size: file.size, type: file.type, data: r.result });
    r.onerror = () =>
      resolve({ name: file.name, size: file.size, type: file.type, data: null });
    r.readAsDataURL(file);
  });
}

function ojsFileList(files, emptyText, removeField) {
  if (!files || !files.length)
    return `<div class="wf-muted">${escHtml(emptyText || "No files.")}</div>`;
  return files
    .map((f, idx) => {
      const hasData = f.data && String(f.data).startsWith("data:");
      const size = f.size ? (f.size / 1024 / 1024).toFixed(2) + " MB" : "";
      return `<div class="wf-file">
        <div class="wf-file-name">${escHtml(f.name || "file")}<span>${size}</span></div>
        ${
          hasData
            ? `<a class="btn-sm btn-accent" href="${f.data}" download="${escHtml(
                f.name || "file"
              )}">Download</a>`
            : `<span class="wf-muted">Metadata only</span>`
        }
        ${
          removeField
            ? `<button type="button" class="btn-sm btn-danger" style="margin-left:0.5rem;" onclick="wfRemoveFile('${removeField}',${idx})">Remove</button>`
            : ""
        }
      </div>`;
    })
    .join("");
}

// Latest manuscript files the reviewers/editors should be working from.
function ojsCurrentManuscriptFiles(sub) {
  if (sub.revisions.length) return sub.revisions[sub.revisions.length - 1].files || [];
  return sub.manuscriptFiles || [];
}

// ===== EMAIL DRAFTS (no mail server; mirrors the invoice mailto flow) =====
function ojsMailto(to, subject, body) {
  window.open(
    "mailto:" +
      encodeURIComponent(to || "") +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body)
  );
}

function ojsBadge(label, kind) {
  return `<span class="badge badge-${kind}"><span class="badge-dot"></span>${escHtml(
    label
  )}</span>`;
}
function ojsStatusBadge(sub) {
  if (sub.status === "Declined") return ojsBadge("Declined", "declined");
  if (sub.stage === "published") return ojsBadge("Published", "published");
  if (sub.awaitingRevision) return ojsBadge("Revisions Requested", "revision");
  if (sub.stage === "submission") return ojsBadge("Submission", "submitted");
  return ojsBadge(ojsStageLabel(sub), "stage");
}

function ojsIssueLabel(issue) {
  if (!issue) return "Online First";
  return (
    "Vol. " +
    issue.volume +
    ", No. " +
    issue.number +
    " (" +
    issue.year +
    ")" +
    (issue.title ? " - " + issue.title : "")
  );
}
function ojsInvoiceFor(subId) {
  return loadInvoices().find((i) => i.subId === subId) || null;
}
