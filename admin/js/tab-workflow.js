/* ============================================================
   Admin - Editorial Workflow (OJS)
   Submission -> Review -> Copyediting -> Production -> Published
   ============================================================ */

let _wf = { id: null, tab: "submission" };
let _decisionType = null;
let _recordAid = null;

const WF_TABS = [
  { id: "submission", label: "Submission" },
  { id: "review", label: "Review" },
  { id: "copyediting", label: "Copyediting" },
  { id: "production", label: "Production" },
  { id: "publication", label: "Publication" },
  { id: "discussion", label: "Discussion" },
  { id: "log", label: "Activity Log" },
];

// ===== OPEN / CLOSE / RENDER =====
function openWorkflow(id, tab) {
  const sub = ojsGetSub(id);
  if (!sub) return;
  _wf.id = id;
  _wf.tab = tab || (sub.stage === "published" ? "publication" : sub.stage);
  document.getElementById("modal-workflow").classList.add("open");
  renderWorkflow();
}
function closeWorkflow() {
  document.getElementById("modal-workflow").classList.remove("open");
  _wf.id = null;
  refreshAll();
}
function wfTab(tab) {
  _wf.tab = tab;
  renderWorkflow();
}

function renderWorkflow() {
  const sub = ojsGetSub(_wf.id);
  const el = document.getElementById("wf-body");
  if (!sub || !el) return;
  const cur = ojsStageIndex(sub.stage);
  const declined = sub.status === "Declined";

  const stepper = STAGES.map((st, i) => {
    const cls = declined
      ? "wf-step"
      : i < cur
      ? "wf-step done"
      : i === cur
      ? "wf-step current"
      : "wf-step";
    return `<div class="${cls}"><span class="wf-step-dot">${i < cur && !declined ? "✓" : i + 1}</span>${st.label}</div>`;
  }).join('<div class="wf-step-line"></div>');

  const tabs = WF_TABS.map(
    (t) =>
      `<button class="wf-tab ${_wf.tab === t.id ? "active" : ""}" onclick="wfTab('${t.id}')">${t.label}</button>`
  ).join("");

  el.innerHTML = `
    <div class="wf-head">
      <div class="wf-head-top">
        <div>
          <div class="wf-journal">${escHtml(getJournalAbbr(sub.journal))} · ID ${escHtml(sub.id)}</div>
          <div class="wf-title">${escHtml(sub.title)}</div>
          <div class="wf-muted">${escHtml(sub.authors)} · Submitted ${fmtDate(sub.submittedAt)}</div>
        </div>
        <div>${ojsStatusBadge(sub)}</div>
      </div>
      <div class="wf-stepper">${stepper}</div>
    </div>
    <div class="wf-tabs">${tabs}</div>
    <div class="wf-content">${renderWfTab(sub)}</div>`;
}

function renderWfTab(sub) {
  switch (_wf.tab) {
    case "submission":
      return wfSubmissionTab(sub);
    case "review":
      return wfReviewTab(sub);
    case "copyediting":
      return wfCopyeditTab(sub);
    case "production":
      return wfProductionTab(sub);
    case "publication":
      return wfPublicationTab(sub);
    case "discussion":
      return wfDiscussionTab(sub);
    case "log":
      return wfLogTab(sub);
  }
  return "";
}

function wfSection(title, inner) {
  return `<div class="wf-section"><div class="wf-section-title">${title}</div>${inner}</div>`;
}

// ===== SUBMISSION TAB =====
function wfSubmissionTab(sub) {
  const invoice = ojsInvoiceFor(sub.id);
  let actions = "";
  if (sub.status === "Declined") {
    actions = `<div class="wf-note">This submission was declined.</div>
      <button class="btn-sm btn-ghost" onclick="wfReopen()">Reopen Submission</button>`;
  } else if (sub.stage === "submission") {
    actions = `<div class="wf-actions">
      <button class="btn-sm btn-accent" onclick="wfSendToReview()">Send to Review</button>
      <button class="btn-sm btn-read" onclick="openApproveModal('${sub.id}')">Accept &amp; Skip Review</button>
      <button class="btn-sm btn-danger" onclick="wfDecision('decline')">Decline Submission</button>
    </div>`;
  }
  const revs = sub.revisions
    .map(
      (r) => `<div class="wf-revision">
        <div class="wf-muted">Revision for round ${r.round} · ${fmtDate(r.at)}</div>
        ${r.note ? `<div class="wf-quote">${escHtml(r.note)}</div>` : ""}
        ${ojsFileList(r.files, "No files.")}
      </div>`
    )
    .join("");
  return (
    wfSection(
      "Metadata",
      `<div class="wf-kv"><b>Journal</b><span>${escHtml(sub.journal)}</span></div>
       <div class="wf-kv"><b>Authors</b><span>${escHtml(sub.authors)}</span></div>
       <div class="wf-kv"><b>Submitter</b><span>${escHtml(sub.submittedByEmail || "-")}</span></div>
       ${
         ojsIsSuper()
           ? `<div class="wf-kv"><b>Fee invoice</b><span>${
               invoice
                 ? escHtml(invoice.invoiceNum) + (invoice.paid ? " · Paid" : " · Awaiting payment")
                 : "Not yet issued" +
                   (ojsStageIndex(sub.stage) >= 2 && sub.status !== "Declined"
                     ? ` <button class="btn-sm btn-accent" style="margin-left:0.75rem;" onclick="openApproveModal('${sub.id}',true)">Issue Invoice</button>`
                     : "")
             }</span></div>`
           : ""
       }
       <div class="wf-abstract">${escHtml(sub.abstract)}</div>`
    ) +
    wfSection("Contributors", wfContributorsHtml(sub)) +
    wfSection("Manuscript Files", ojsFileList(sub.manuscriptFiles, "No manuscript uploaded.")) +
    wfSection("Supplementary Files", ojsFileList(sub.suppFiles, "No supplementary files.")) +
    (revs ? wfSection("Author Revisions", revs) : "") +
    (actions ? wfSection("Editorial Actions", actions) : "")
  );
}

// ----- contributors -----
function wfContributorsHtml(sub) {
  const list = ojsContributors(sub);
  const rows = list
    .map(
      (c, i) => `<div class="wf-file">
        <div class="wf-file-name">${escHtml(c.name)}<span>${escHtml(c.role)}${
          c.affiliation ? " · " + escHtml(c.affiliation) : ""
        }${c.email ? " · " + escHtml(c.email) : ""}</span></div>
        <div class="wf-actions">
          <button class="btn-sm btn-ghost" ${i === 0 ? "disabled" : ""} onclick="wfMoveContributor('${c.id}',-1)">▲</button>
          <button class="btn-sm btn-ghost" ${i === list.length - 1 ? "disabled" : ""} onclick="wfMoveContributor('${c.id}',1)">▼</button>
          <button class="btn-sm btn-danger" onclick="wfRemoveContributor('${c.id}')">Remove</button>
        </div></div>`
    )
    .join("");
  return `${rows || '<div class="wf-muted">No contributors.</div>'}
    <div class="wf-form-grid" style="margin-top:0.875rem;">
      <div><label class="form-label">Name</label><input class="form-input" id="ct-name"></div>
      <div><label class="form-label">Role</label><select class="form-select" id="ct-role">${CONTRIBUTOR_ROLES.map(
        (r) => `<option>${r}</option>`
      ).join("")}</select></div>
      <div><label class="form-label">Affiliation</label><input class="form-input" id="ct-affil"></div>
      <div><label class="form-label">Email (optional)</label><input class="form-input" id="ct-email" type="email"></div>
    </div>
    <div class="wf-actions" style="margin-top:0.75rem;"><button class="btn-sm btn-accent" onclick="wfAddContributor()">Add Contributor</button></div>`;
}

function wfContributorsChanged(sub) {
  renderWorkflow();
  // a published article's landing page must stay in step with its authors
  if (sub && sub.stage === "published") syncArticleToSite(sub.id);
}

function wfAddContributor() {
  const name = document.getElementById("ct-name").value.trim();
  if (!name) return showToast("Enter the contributor's name");
  const email = document.getElementById("ct-email").value.trim();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showToast("Enter a valid email or leave it blank");
  const c = {
    id: ojsId("ct"),
    name,
    role: document.getElementById("ct-role").value,
    affiliation: document.getElementById("ct-affil").value.trim(),
    email,
  };
  const sub = ojsMutate(_wf.id, (s) => {
    s.contributors = ojsContributors(s).slice();
    s.contributors.push(c);
    ojsSyncAuthors(s);
    ojsEvent(s, "Contributor added: " + c.name + " (" + c.role + ")");
  });
  if (sub) wfContributorsChanged(sub);
}

function wfRemoveContributor(cid) {
  const cur = ojsGetSub(_wf.id);
  const list = ojsContributors(cur);
  const left = list.filter((c) => c.id !== cid);
  if (!left.some((c) => AUTHOR_ROLES.includes(c.role)))
    return showToast("At least one author is required");
  const sub = ojsMutate(_wf.id, (s) => {
    s.contributors = left;
    ojsSyncAuthors(s);
    ojsEvent(s, "Contributor removed");
  });
  if (sub) wfContributorsChanged(sub);
}

function wfMoveContributor(cid, dir) {
  const sub = ojsMutate(_wf.id, (s) => {
    const list = ojsContributors(s).slice();
    const i = list.findIndex((c) => c.id === cid);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    s.contributors = list;
    ojsSyncAuthors(s);
  });
  if (sub) wfContributorsChanged(sub);
}

function wfSendToReview() {
  const id = _wf.id;
  const sub = ojsMutate(id, (s) => {
    s.stage = "review";
    s.round = s.round || 1;
    s.status = "Submitted";
    s.decisions.push({
      id: ojsId("dec"),
      type: "send_to_review",
      label: "Sent to review",
      note: "",
      by: ojsActor(),
      at: ojsNow(),
      round: s.round,
    });
    ojsEvent(s, "Sent to review (round " + s.round + ")");
  });
  if (sub) {
    _wf.tab = "review";
    renderWorkflow();
    showToast("Moved to Review");
  }
}

function wfReopen() {
  const sub = ojsMutate(_wf.id, (s) => {
    s.status = "Submitted";
    s.stage = "submission";
    ojsEvent(s, "Submission reopened");
  });
  if (sub) renderWorkflow();
}

// ===== REVIEW TAB =====
function wfReviewTab(sub) {
  if (ojsStageIndex(sub.stage) < 1 && sub.status !== "Declined") {
    return `<div class="wf-note">This manuscript has not been sent to review yet.</div>
      <div class="wf-actions"><button class="btn-sm btn-accent" onclick="wfSendToReview()">Send to Review</button></div>`;
  }
  const inReview = sub.stage === "review" && sub.status !== "Declined";
  const rounds = [];
  for (let r = sub.round; r >= 1; r--) rounds.push(r);

  const roundBlocks = rounds
    .map((r) => {
      const list = ojsRoundAssignments(sub, r);
      const rows = list.length
        ? list.map((a) => wfAssignmentRow(sub, a, r === sub.round && inReview)).join("")
        : `<div class="wf-muted">No reviewers assigned in this round.</div>`;
      return wfSection(
        "Round " + r + (r === sub.round ? " (current)" : ""),
        rows
      );
    })
    .join("");

  const reviewers = loadReviewers();
  const abbr = getJournalAbbr(sub.journal);
  const assignedEmails = ojsRoundAssignments(sub).map((a) => a.email);
  const opts = reviewers
    .filter((rv) => !assignedEmails.includes(rv.email))
    .sort(
      (a, b) =>
        (b.journals || []).includes(abbr) - (a.journals || []).includes(abbr)
    )
    .map(
      (rv) =>
        `<option value="${rv.id}">${escHtml(rv.name)} (${escHtml(rv.email)})${
          (rv.journals || []).includes(abbr) ? " ★" : ""
        }</option>`
    )
    .join("");
  const due = new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10);

  const assignForm = inReview
    ? wfSection(
        "Assign Reviewer",
        reviewers.length
          ? `<div class="wf-form-row">
              <select class="form-select" id="wf-reviewer-select"><option value="">Select reviewer…</option>${opts}</select>
              <input type="date" class="form-input" id="wf-reviewer-due" value="${due}">
              <button class="btn-sm btn-accent" onclick="wfAssignReviewer()">Assign</button>
            </div>
            <div class="wf-muted" style="margin-top:0.5rem;">★ = reviewer is listed for this journal. Reviewers are anonymous to authors and author names are hidden from reviewers.</div>`
          : `<div class="wf-note">No reviewers registered yet. <button class="link-inline" onclick="closeWorkflow();showPage('reviewers')">Add reviewers</button></div>`
      )
    : "";

  const completed = ojsRoundAssignments(sub).filter((a) => a.status === "completed").length;
  const decisionBar = inReview
    ? wfSection(
        "Editorial Decision",
        `<div class="wf-muted" style="margin-bottom:0.75rem;">${completed} completed review(s) in this round.</div>
         <div class="wf-actions">
           <button class="btn-sm btn-read" onclick="openApproveModal('${sub.id}')">Accept Submission</button>
           <button class="btn-sm btn-accent" onclick="wfDecision('revisions_minor')">Request Revisions (Minor)</button>
           <button class="btn-sm btn-accent" onclick="wfDecision('revisions_major')">Request Revisions (Major)</button>
           ${
             sub.revisions.length >= sub.round
               ? `<button class="btn-sm btn-ghost" onclick="wfDecision('new_round')">Start New Review Round</button>`
               : ""
           }
           <button class="btn-sm btn-danger" onclick="wfDecision('decline')">Decline Submission</button>
         </div>
         ${
           sub.awaitingRevision
             ? `<div class="wf-note" style="margin-top:0.75rem;">Waiting for the author to submit revisions.</div>`
             : sub.revisions.length >= sub.round
             ? `<div class="wf-note" style="margin-top:0.75rem;">The author has submitted revisions - start a new review round or make a decision.</div>`
             : ""
         }`
      )
    : "";

  const decisions = sub.decisions.length
    ? wfSection(
        "Decision History",
        sub.decisions
          .slice()
          .reverse()
          .map(
            (d) => `<div class="wf-decision"><b>${escHtml(d.label)}</b> · round ${d.round} · ${fmtDate(
              d.at
            )} · ${escHtml(d.by)}${d.note ? `<div class="wf-quote">${escHtml(d.note)}</div>` : ""}</div>`
          )
          .join("")
      )
    : "";

  return decisionBar + assignForm + roundBlocks + decisions;
}

function wfAssignmentRow(sub, a, editable) {
  const overdue =
    (a.status === "invited" || a.status === "accepted") &&
    a.dueAt &&
    new Date(a.dueAt).getTime() < Date.now();
  const statusMap = {
    invited: ["Invited", "submitted"],
    accepted: ["Accepted", "stage"],
    declined: ["Declined", "declined"],
    completed: ["Completed", "published"],
  };
  const [label, kind] = statusMap[a.status] || ["Invited", "submitted"];
  const review =
    a.status === "completed"
      ? `<details class="wf-details"><summary>${escHtml(
          RECOMMENDATIONS[a.recommendation] || a.recommendation || "Review"
        )} · ${fmtDate(a.completedAt)}${a.onBehalf ? " · recorded by editor" : ""}</summary>
          <div class="wf-kv"><b>To author</b><span>${escHtml(a.toAuthor || "-")}</span></div>
          <div class="wf-kv"><b>To editor (confidential)</b><span>${escHtml(a.toEditor || "-")}</span></div>
        </details>`
      : "";
  const actions = editable
    ? `<div class="wf-actions" style="margin-top:0.5rem;">
        ${
          a.status !== "completed" && a.status !== "declined"
            ? `<button class="btn-sm btn-ghost" onclick="wfRecordReview('${a.id}')">Record Review</button>
               <button class="btn-sm btn-ghost" onclick="wfRemindReviewer('${a.id}')">Email Reminder</button>`
            : ""
        }
        <button class="btn-sm btn-danger" onclick="wfRemoveAssignment('${a.id}')">Remove</button>
      </div>`
    : "";
  return `<div class="wf-assign">
    <div class="wf-assign-top">
      <div><b>${escHtml(a.name)}</b> <span class="wf-muted">${escHtml(a.email)}</span></div>
      <div>${ojsBadge(label, kind)}${overdue ? " " + ojsBadge("Overdue", "declined") : ""}</div>
    </div>
    <div class="wf-muted">Assigned ${fmtDate(a.assignedAt)} · Due ${fmtDate(a.dueAt)}</div>
    ${review}${actions}</div>`;
}

function wfAssignReviewer() {
  const rid = document.getElementById("wf-reviewer-select").value;
  const due = document.getElementById("wf-reviewer-due").value;
  if (!rid) return showToast("Select a reviewer first");
  const rv = loadReviewers().find((r) => r.id === rid);
  if (!rv) return;
  let created = null;
  const sub = ojsMutate(_wf.id, (s) => {
    created = {
      id: ojsId("ra"),
      round: s.round,
      reviewerId: rv.id,
      name: rv.name,
      email: rv.email,
      assignedAt: ojsNow(),
      dueAt: due ? new Date(due).toISOString() : null,
      status: "invited",
    };
    s.reviewAssignments.push(created);
    ojsEvent(s, "Reviewer assigned: " + rv.name + " (round " + s.round + ")");
  });
  if (!sub) return;
  renderWorkflow();
  showConfirm(
    "Reviewer Assigned",
    rv.name + " now sees this invitation in their Reviewer Dashboard when signed in with " + rv.email + ". Open an email draft to notify them?",
    () =>
      ojsMailto(
        rv.email,
        "Review Invitation - " + getJournalAbbr(sub.journal) + " | Impact Compass Holdings",
        "Dear " + rv.name + ",\r\n\r\n" +
          "You are invited to review a manuscript for " + sub.journal + ".\r\n\r\n" +
          "Title: " + sub.title + "\r\n" +
          "Review due: " + (due || "-") + "\r\n\r\n" +
          "Abstract:\r\n" + (sub.abstract || "") + "\r\n\r\n" +
          "To accept or decline and submit your review, sign in at https://impactch.com with this email address, open Journals > Reviewer Dashboard.\r\n\r\n" +
          "Kind regards,\r\nThe Editorial Office\r\nImpact Compass Holdings"
      ),
    "Open Email Draft"
  );
}

function wfRemindReviewer(aid) {
  const sub = ojsGetSub(_wf.id);
  const a = sub && sub.reviewAssignments.find((x) => x.id === aid);
  if (!a) return;
  ojsMailto(
    a.email,
    "Review Reminder - " + sub.title.slice(0, 60),
    "Dear " + a.name + ",\r\n\r\nThis is a friendly reminder that your review of \"" + sub.title +
      "\" is due on " + fmtDate(a.dueAt) + ".\r\n\r\nYou can submit it from the Reviewer Dashboard at https://impactch.com.\r\n\r\nKind regards,\r\nThe Editorial Office"
  );
}

function wfRemoveAssignment(aid) {
  showConfirm(
    "Remove Reviewer",
    "Remove this reviewer assignment (and any review they submitted)?",
    () => {
      const sub = ojsMutate(_wf.id, (s) => {
        const a = s.reviewAssignments.find((x) => x.id === aid);
        s.reviewAssignments = s.reviewAssignments.filter((x) => x.id !== aid);
        if (a) ojsEvent(s, "Reviewer removed: " + a.name);
      });
      if (sub) renderWorkflow();
    },
    "Remove",
    true
  );
}

// ----- record review on behalf of reviewer -----
function wfRecordReview(aid) {
  _recordAid = aid;
  document.getElementById("rr-recommendation").value = "";
  document.getElementById("rr-author").value = "";
  document.getElementById("rr-editor").value = "";
  document.getElementById("modal-record-review").classList.add("open");
}
function wfSaveRecordedReview() {
  const rec = document.getElementById("rr-recommendation").value;
  const toAuthor = document.getElementById("rr-author").value.trim();
  const toEditor = document.getElementById("rr-editor").value.trim();
  if (!rec || !toAuthor) return showToast("Recommendation and comments to author are required");
  const sub = ojsMutate(_wf.id, (s) => {
    const a = s.reviewAssignments.find((x) => x.id === _recordAid);
    if (!a) return;
    a.status = "completed";
    a.recommendation = rec;
    a.toAuthor = toAuthor;
    a.toEditor = toEditor;
    a.completedAt = ojsNow();
    a.onBehalf = true;
    ojsEvent(s, "Review recorded on behalf of " + a.name);
  });
  closeModal("modal-record-review");
  if (sub) renderWorkflow();
}

// ===== EDITORIAL DECISIONS =====
const DECISION_CFG = {
  revisions_minor: {
    title: "Request Revisions (Minor)",
    label: "Revisions requested (minor)",
    share: true,
    hint: "The author will be asked to submit a revised manuscript.",
  },
  revisions_major: {
    title: "Request Revisions (Major)",
    label: "Revisions requested (major)",
    share: true,
    hint: "The author will be asked to submit a revised manuscript.",
  },
  new_round: {
    title: "Start New Review Round",
    label: "New review round",
    share: false,
    hint: "Opens the next round. Assign reviewers again for the revised manuscript.",
  },
  decline: {
    title: "Decline Submission",
    label: "Submission declined",
    share: true,
    hint: "The author will see this decision on their dashboard. You can reopen it later.",
  },
};

function wfDecision(type) {
  const cfg = DECISION_CFG[type];
  if (!cfg) return;
  _decisionType = type;
  document.getElementById("dec-title").textContent = cfg.title;
  document.getElementById("dec-hint").textContent = cfg.hint;
  document.getElementById("dec-note").value = "";
  document.getElementById("dec-share").checked = cfg.share;
  document.getElementById("dec-share-row").style.display = cfg.share ? "" : "none";
  document.getElementById("modal-decision").classList.add("open");
}

function confirmDecision() {
  const cfg = DECISION_CFG[_decisionType];
  if (!cfg) return;
  const note = document.getElementById("dec-note").value.trim();
  const share = cfg.share && document.getElementById("dec-share").checked;
  const type = _decisionType;
  closeModal("modal-decision");
  const sub = ojsMutate(_wf.id, (s) => {
    const shared = share
      ? ojsRoundAssignments(s)
          .filter((a) => a.status === "completed")
          .map((a) => a.id)
      : [];
    s.decisions.push({
      id: ojsId("dec"),
      type,
      label: cfg.label,
      note,
      by: ojsActor(),
      at: ojsNow(),
      round: s.round,
      sharedReviewIds: shared,
    });
    if (type === "revisions_minor" || type === "revisions_major") {
      s.awaitingRevision = true;
      s.stage = "review";
    } else if (type === "new_round") {
      s.round += 1;
      s.awaitingRevision = false;
      s.stage = "review";
    } else if (type === "decline") {
      s.status = "Declined";
      s.awaitingRevision = false;
    }
    ojsEvent(s, cfg.label + (note ? ": " + note : ""));
  });
  if (!sub) return;
  renderWorkflow();
  showToast(cfg.label);
  if (type !== "new_round" && sub.submittedByEmail && sub.submittedByEmail !== "anonymous") {
    showConfirm(
      "Decision Recorded",
      "The author can see this decision on their dashboard. Open an email draft to notify them as well?",
      () =>
        ojsMailto(
          sub.submittedByEmail,
          cfg.label + " - " + sub.title.slice(0, 60),
          "Dear " + (sub.authors || "Author") + ",\r\n\r\nRegarding your manuscript \"" + sub.title + "\" (" + sub.journal + "):\r\n\r\nDecision: " + cfg.label + "\r\n" + (note ? "\r\n" + note + "\r\n" : "") + "\r\nReviewer comments and any next steps are available on your Author Dashboard at https://impactch.com.\r\n\r\nKind regards,\r\nThe Editorial Office\r\nImpact Compass Holdings"
        ),
      "Open Email Draft"
    );
  }
}

// ===== COPYEDITING TAB =====
function wfCopyeditTab(sub) {
  if (ojsStageIndex(sub.stage) < 2) {
    return `<div class="wf-note">Copyediting starts once the submission is accepted.</div>`;
  }
  const active = sub.stage === "copyediting";
  const appr = sub.copyeditApproval;
  const apprHtml = appr
    ? appr.status === "approved"
      ? `<div class="wf-note ok">Author approved the copyedited files · ${fmtDate(appr.at)}</div>`
      : `<div class="wf-note warn">Author requested changes · ${fmtDate(appr.at)}<div class="wf-quote">${escHtml(appr.note || "")}</div></div>`
    : sub.copyeditRequestedAt
    ? `<div class="wf-note">Waiting for author approval (requested ${fmtDate(sub.copyeditRequestedAt)}).</div>`
    : "";
  return (
    wfSection(
      "Copyedited Files",
      ojsFileList(sub.copyeditFiles, "No copyedited files uploaded yet.", active ? "copyeditFiles" : "") +
        (active
          ? `<div style="margin-top:0.875rem;"><label class="form-label">Upload copyedited file(s)</label>
             <input type="file" class="form-input" multiple onchange="wfUploadFiles(this,'copyeditFiles','Copyedited file uploaded')"></div>`
          : "")
    ) +
    wfSection(
      "Author Approval",
      apprHtml +
        (active
          ? `<div class="wf-actions" style="margin-top:0.75rem;">
              <button class="btn-sm btn-ghost" onclick="wfRequestAuthorApproval()" ${
                sub.copyeditFiles.length ? "" : "disabled"
              }>Request Author Approval</button>
              <button class="btn-sm btn-accent" onclick="wfToProduction()">Send to Production</button>
            </div>`
          : "")
    )
  );
}

async function wfUploadFiles(input, field, msg) {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  const data = await Promise.all(files.map(ojsReadFile));
  const sub = ojsMutate(_wf.id, (s) => {
    s[field] = (s[field] || []).concat(data);
    if (field === "copyeditFiles") {
      s.copyeditApproval = null;
      s.copyeditRequestedAt = null;
    }
    ojsEvent(s, msg + ": " + data.map((f) => f.name).join(", "));
  });
  if (sub) {
    renderWorkflow();
    showToast(msg);
  }
}

// Remove one uploaded file from a workflow file list (copyedited / galley)
function wfRemoveFile(field, idx) {
  const cur = ojsGetSub(_wf.id);
  const f = cur && (cur[field] || [])[idx];
  if (!f) return;
  showConfirm(
    "Remove File",
    'Remove "' + (f.name || "this file") + '" from this manuscript?',
    () => {
      const sub = ojsMutate(_wf.id, (s) => {
        s[field] = (s[field] || []).filter((_, i) => i !== idx);
        if (field === "copyeditFiles") {
          // the author approved/was asked about the old set of files
          s.copyeditApproval = null;
          s.copyeditRequestedAt = null;
        }
        ojsEvent(s, "File removed: " + (f.name || "file"));
      });
      if (sub) {
        renderWorkflow();
        showToast("File removed");
      }
    },
    "Remove",
    true
  );
}

function wfRequestAuthorApproval() {
  const sub = ojsMutate(_wf.id, (s) => {
    s.copyeditRequestedAt = ojsNow();
    s.copyeditApproval = null;
    ojsEvent(s, "Author approval of copyedits requested");
  });
  if (sub) {
    renderWorkflow();
    showToast("Author will see the request on their dashboard");
  }
}

function wfToProduction() {
  const sub0 = ojsGetSub(_wf.id);
  const go = () => {
    const sub = ojsMutate(_wf.id, (s) => {
      s.stage = "production";
      ojsEvent(s, "Sent to production");
    });
    if (sub) {
      _wf.tab = "production";
      renderWorkflow();
    }
  };
  if (sub0 && !(sub0.copyeditApproval && sub0.copyeditApproval.status === "approved")) {
    showConfirm(
      "Send to Production",
      "The author has not approved the copyedited files. Send to production anyway?",
      go,
      "Send Anyway"
    );
  } else go();
}

// ===== PRODUCTION TAB =====
function wfProductionTab(sub) {
  if (ojsStageIndex(sub.stage) < 3) {
    return `<div class="wf-note">Production starts after copyediting.</div>`;
  }
  const active = sub.stage === "production";
  const abbr = getJournalAbbr(sub.journal);
  const issues = loadIssues().filter((i) => i.journal === abbr);
  const issueOpts =
    `<option value="">Online First (no issue)</option>` +
    issues
      .map(
        (i) =>
          `<option value="${i.id}" ${sub.issueId === i.id ? "selected" : ""}>${escHtml(
            ojsIssueLabel(i)
          )}${i.status === "published" ? " [published]" : ""}</option>`
      )
      .join("");
  const inv = ojsInvoiceFor(sub.id);
  const issue = loadIssues().find((i) => i.id === sub.issueId);
  const canNow = active && (!issue || issue.status === "published");
  return (
    wfSection(
      "Galley Files",
      ojsFileList(sub.galleyFiles, "No uploaded galley. A galley PDF is generated automatically from the metadata if none is uploaded.") +
        (active
          ? `<div style="margin-top:0.875rem;"><label class="form-label">Upload galley (PDF)</label>
             <input type="file" accept=".pdf" class="form-input" multiple onchange="wfUploadFiles(this,'galleyFiles','Galley uploaded')"></div>
             <div class="wf-actions" style="margin-top:0.75rem;"><button class="btn-sm btn-ghost" onclick="generateGalley('${sub.id}')">Preview Generated Galley PDF</button></div>`
          : "")
    ) +
    wfSection(
      "Publication Metadata & Scheduling",
      `<div class="wf-form-grid">
        <div><label class="form-label">Issue</label><select class="form-select" id="wf-issue" ${active ? "" : "disabled"}>${issueOpts}</select></div>
        <div><label class="form-label">Pages</label><input class="form-input" id="wf-pages" placeholder="e.g. 1-14" value="${escHtml(sub.pages || "")}" ${active ? "" : "disabled"}></div>
        <div><label class="form-label">DOI</label><input class="form-input" id="wf-doi" placeholder="10.xxxx/xxxxx" value="${escHtml(sub.doi || "")}" ${active ? "" : "disabled"}></div>
        <div><label class="form-label">Keywords (comma separated)</label><input class="form-input" id="wf-keywords" value="${escHtml(sub.keywords || "")}" ${active ? "" : "disabled"}></div>
      </div>
      ${issues.length ? "" : `<div class="wf-muted" style="margin-top:0.5rem;">No issues exist for this journal yet. <button class="link-inline" onclick="closeWorkflow();showPage('issues')">Create an issue</button></div>`}`
    ) +
    (!ojsIsSuper() ? "" : wfSection(
      "Payment",
      inv
        ? `<div class="wf-kv"><b>${escHtml(inv.invoiceNum)}</b><span>${fmtCurrency(inv.amount)} · ${
            inv.paid ? "Paid " + fmtDate(inv.paidAt) : "Awaiting payment"
          }</span></div>`
        : `<div class="wf-muted">No invoice recorded for this manuscript.</div>`
    )) +
    (active
      ? wfSection(
          "Publish",
          `<div class="wf-actions">
            <button class="btn-sm btn-ghost" onclick="wfSaveProduction()">Save Metadata</button>
            ${
              canNow
                ? `<button class="btn-sm btn-accent" onclick="wfPublishNow()">Publish Now</button>`
                : `<button class="btn-sm btn-accent" onclick="wfSaveProduction(true)">Schedule for Issue</button>`
            }
          </div>
          <div class="wf-muted" style="margin-top:0.5rem;">${
            canNow
              ? issue
                ? "This issue is already published - the article is added to it immediately."
                : "Online First articles are published immediately."
              : "Scheduled articles are published automatically when their issue is published (Issues page)."
          }</div>`
        )
      : "")
  );
}

function wfReadProductionForm() {
  const g = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };
  return {
    issueId: g("wf-issue"),
    pages: g("wf-pages"),
    doi: g("wf-doi"),
    keywords: g("wf-keywords"),
  };
}

function wfSaveProduction(schedule) {
  const f = wfReadProductionForm();
  if (schedule && !f.issueId) return showToast("Choose an issue to schedule this article");
  const sub = ojsMutate(_wf.id, (s) => {
    Object.assign(s, f);
    ojsEvent(
      s,
      schedule
        ? "Scheduled for publication in " + ojsIssueLabel(loadIssues().find((i) => i.id === f.issueId))
        : "Publication metadata saved"
    );
  });
  if (sub) {
    renderWorkflow();
    showToast(schedule ? "Scheduled for issue" : "Metadata saved");
  }
}

function wfPublishNow() {
  const f = wfReadProductionForm();
  const inv = ojsInvoiceFor(_wf.id);
  const go = () => {
    const sub = ojsPublishArticle(_wf.id, f);
    if (sub) {
      _wf.tab = "publication";
      renderWorkflow();
      showToast("Article published");
    }
  };
  if (inv && !inv.paid) {
    if (!ojsIsSuper()) {
      showToast("Publication fee not confirmed - ask a Super Admin to confirm payment first.");
      return;
    }
    showConfirm(
      "Publication Fee Unpaid",
      "Invoice " + inv.invoiceNum + " has not been marked as paid. Publish anyway?",
      go,
      "Publish Anyway"
    );
  } else go();
}

// Shared by "Publish Now" and "Publish Issue"
function ojsPublishArticle(id, meta) {
  const all = loadSubs();
  const sub = ojsMutate(id, (s) => {
    if (meta) Object.assign(s, meta);
    s.articleSlug = ojsEnsureSlug(s, all);
    s.stage = "published";
    s.status = "Published";
    s.awaitingRevision = false;
    s.publishedAt = ojsNow();
    ojsEvent(s, "Article published");
  });
  // push the landing page + sitemap entry (updates in place if it already exists)
  if (sub) syncArticleToSite(id);
  return sub;
}

// ===== PUBLICATION TAB =====
function wfPublicationTab(sub) {
  if (sub.stage !== "published") {
    return `<div class="wf-note">This article has not been published yet.</div>`;
  }
  const issue = loadIssues().find((i) => i.id === sub.issueId);
  return (
    wfSection(
      "Published Article",
      `<div class="wf-kv"><b>Published</b><span>${fmtDate(sub.publishedAt || sub.approvedAt)}</span></div>
       <div class="wf-kv"><b>Issue</b><span>${escHtml(ojsIssueLabel(issue))}</span></div>
       <div class="wf-kv"><b>Pages</b><span>${escHtml(sub.pages || "-")}</span></div>
       <div class="wf-kv"><b>DOI</b><span>${escHtml(sub.doi || "-")}</span></div>
       <div class="wf-kv"><b>ISSN</b><span>${escHtml(journalIssn(getJournalAbbr(sub.journal)) || "-")}</span></div>`
    ) +
    wfSection(
      "Galley &amp; Indexing",
      `${ojsFileList(sub.galleyFiles, "No uploaded galley - the generated PDF is used.", sub.imported ? "galleyFiles" : "")}
       ${
         sub.imported
           ? `<div style="margin-top:0.875rem;"><label class="form-label">Upload galley (PDF)</label>
              <input type="file" accept=".pdf" class="form-input" onchange="wfUploadFiles(this,'galleyFiles','Galley uploaded')">
              <div class="wf-muted" style="margin-top:0.4rem;">After changing the galley, use Sync to Site Now below to update /articles/.</div></div>`
           : ""
       }
       <div class="wf-actions" style="margin-top:0.875rem;">
         <button class="btn-sm btn-accent" onclick="generateGalley('${sub.id}')">Download Galley PDF</button>
         <button class="btn-sm btn-ghost" onclick="exportArticleLanding('${sub.id}')">Download Landing Page (HTML)</button>
       </div>
       ${wfSyncStatus(sub)}`
    ) +
    wfSection(
      "Corrections",
      `<button class="btn-sm btn-danger" onclick="wfUnpublish()">Unpublish (return to Production)</button>`
    )
  );
}

function wfSyncStatus(sub) {
  const s = sub.siteSync;
  const line = !s
    ? "Not uploaded to the site yet."
    : s.ok
    ? `Live at <code>${escHtml(s.url)}</code> · synced ${fmtDate(s.at)}`
    : `Last sync failed (${escHtml(s.error)}) · ${fmtDate(s.at)}`;
  return `<div class="wf-note ${s && s.ok ? "ok" : s ? "warn" : ""}" style="margin-top:0.75rem;">${line}</div>
    <div class="wf-actions" style="margin-top:0.75rem;"><button class="btn-sm btn-accent" onclick="syncArticleToSite('${sub.id}')">Sync to Site Now</button></div>
    <div class="wf-muted" style="margin-top:0.5rem;">Publishing uploads the landing page and PDF to <code>/articles/</code> and updates <code>sitemap.xml</code> automatically. Re-publishing updates the same files.</div>`;
}

function wfUnpublish() {
  showConfirm(
    "Unpublish Article",
    "Remove this article from the public archive and return it to production?",
    () => {
      const sub = ojsMutate(_wf.id, (s) => {
        s.stage = "production";
        s.status = "Accepted";
        s.publishedAt = null;
        ojsEvent(s, "Article unpublished");
      });
      if (sub) {
        _wf.tab = "production";
        renderWorkflow();
      }
    },
    "Unpublish",
    true
  );
}

// ===== DISCUSSION TAB =====
function wfDiscussionTab(sub) {
  const msgs = sub.discussions.length
    ? sub.discussions
        .map(
          (m) => `<div class="wf-msg ${m.role === "editor" ? "editor" : ""}">
            <div class="wf-muted"><b>${escHtml(m.by)}</b> (${escHtml(m.role)}) · ${fmtDate(m.at)}</div>
            <div>${escHtml(m.text)}</div></div>`
        )
        .join("")
    : `<div class="wf-muted">No messages yet.</div>`;
  return (
    wfSection("Messages with Author", msgs) +
    wfSection(
      "Send Message",
      `<textarea class="form-textarea" id="wf-msg" rows="3" placeholder="Message to the author (visible on their dashboard)…"></textarea>
       <div class="wf-actions" style="margin-top:0.75rem;"><button class="btn-sm btn-accent" onclick="wfPostMessage()">Send</button></div>`
    )
  );
}

function wfPostMessage() {
  const text = document.getElementById("wf-msg").value.trim();
  if (!text) return;
  const sub = ojsMutate(_wf.id, (s) => {
    s.discussions.push({
      id: ojsId("msg"),
      role: "editor",
      by: ojsActor(),
      at: ojsNow(),
      stage: s.stage,
      text,
    });
  });
  if (sub) renderWorkflow();
}

// ===== LOG TAB =====
function wfLogTab(sub) {
  if (!sub.history.length)
    return `<div class="wf-muted">No activity recorded yet.</div>`;
  return sub.history
    .slice()
    .reverse()
    .map(
      (h) => `<div class="wf-log"><span class="wf-muted">${fmtDate(h.at)}</span> <b>${escHtml(
        h.by
      )}</b> - ${escHtml(h.text)}</div>`
    )
    .join("");
}
