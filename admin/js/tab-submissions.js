/* ============================================================
   Admin Tab - Manuscripts / Submissions
   ============================================================ */

function renderSubTable(subs) {
  let filtered = subs.filter((s) => {
    const q = currentFilter.query.toLowerCase();
    const matchQ =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.authors.toLowerCase().includes(q) ||
      (s.submittedByEmail || "").toLowerCase().includes(q);
    const matchS = !currentFilter.status || s.status === currentFilter.status;
    return matchQ && matchS;
  });
  const tbody = document.getElementById("submissions-tbody");
  if (!filtered.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem;">No manuscripts found</td></tr>';
    return;
  }
  tbody.innerHTML = filtered
    .map((s) => {
      const hasFiles =
        (s.manuscriptFiles && s.manuscriptFiles.length > 0) ||
        (s.suppFiles && s.suppFiles.length > 0);
      const filesBtnHtml = hasFiles
        ? `<button class="btn-sm btn-ghost" style="padding:0.35rem 0.75rem;font-size:8px;border-color:rgba(193,154,107,0.4);color:var(--accent);" onclick="viewDocs('${s.id}')">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:3px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Docs</button>`
        : `<span style="font-size:8px;color:var(--text-muted);padding:0.35rem 0.75rem;">No files</span>`;
      const hasInvoice = loadInvoices().some((i) => i.subId === s.id);
      return `<tr>
            <td><input type="checkbox" class="sub-checkbox" value="${s.id}" ${
        selectedIds.has(s.id) ? "checked" : ""
      } onchange="toggleSelect('${s.id}',this.checked)"></td>
            <td style="font-size:0.72rem;color:var(--text-muted);font-family:monospace;">${
              s.id
            }</td>
            <td><div class="td-title">${escHtml(
              s.title.length > 42 ? s.title.slice(0, 42) + "…" : s.title
            )}</div><div class="td-journal">${escHtml(
        getJournalAbbr(s.journal)
      )}</div></td>
            <td style="color:var(--text-muted);font-size:0.78rem;">${escHtml(
              s.authors
            )}</td>
            <td style="color:var(--text-muted);font-size:0.72rem;">${escHtml(
              s.submittedByEmail || "-"
            )}</td>
            <td style="color:var(--text-muted);font-size:0.75rem;">${fmtDate(
              s.submittedAt
            )}</td>
            <td style="display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap;">
                ${filesBtnHtml}
                ${
                  !hasInvoice
                    ? `<button class="btn-sm btn-read" style="padding:0.35rem 0.75rem;font-size:8px;" onclick="openApproveModal('${s.id}')">✓ Approve</button>`
                    : `<button class="btn-sm btn-ghost" style="padding:0.35rem 0.75rem;font-size:8px;border-color:rgba(193,154,107,0.3);color:var(--accent);" onclick="viewInvoice('${s.id}')">Invoice</button>`
                }
                <button class="btn-sm btn-danger" style="padding:0.35rem 0.75rem;font-size:8px;" onclick="confirmDeleteSub('${
                  s.id
                }')">Delete</button>
            </td>
        </tr>`;
    })
    .join("");
}

function filterSubmissions(q) {
  currentFilter.query = q;
  renderSubTable(loadSubs());
}
function toggleSelect(id, checked) {
  checked ? selectedIds.add(id) : selectedIds.delete(id);
}
function toggleSelectAll(cb) {
  document.querySelectorAll(".sub-checkbox").forEach((c) => {
    c.checked = cb.checked;
    toggleSelect(c.value, cb.checked);
  });
}

function confirmDeleteSub(id) {
  showConfirm(
    "Delete Manuscript",
    "Permanently delete this manuscript? This action cannot be undone.",
    () => {
      saveSubs(loadSubs().filter((s) => s.id !== id));
      selectedIds.delete(id);
      refreshAll();
      showToast("Manuscript deleted");
    },
    "Delete",
    true
  );
}

function exportCSV() {
  const subs = loadSubs();
  const rows = [
    ["ID", "Title", "Authors", "Journal", "Status", "Submitted"],
    ...subs.map((s) => [
      s.id,
      '"' + s.title.replace(/"/g, '""') + '"',
      s.authors,
      getJournalAbbr(s.journal),
      s.status,
      fmtDate(s.submittedAt),
    ]),
  ];
  const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
    type: "text/csv",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "submissions.csv";
  a.click();
  showToast("CSV exported");
}

function viewDocs(id) {
  const subs = loadSubs();
  const sub = subs.find((s) => s.id === id);
  if (!sub) return;
  const bodyEl = document.getElementById("docs-modal-body");
  const mFiles = sub.manuscriptFiles || [];
  const sFiles = sub.suppFiles || [];
  if (!mFiles.length && !sFiles.length) {
    bodyEl.innerHTML =
      '<div class="empty-state"><p>No files were uploaded with this submission.</p></div>';
  } else {
    const renderFiles = (files, label) => {
      if (!files.length) return "";
      return `<div style="padding:1rem 1.5rem;border-bottom:1px solid var(--border);">
                <div style="font-size:9px;letter-spacing:0.25em;text-transform:uppercase;font-weight:700;color:var(--text-muted);margin-bottom:0.875rem;">${label}</div>
                ${files
                  .map((f) => {
                    const hasData = f.data && f.data.startsWith("data:");
                    const sizeStr = f.size
                      ? (f.size / 1024 / 1024).toFixed(2) + " MB"
                      : "";
                    const isPdf =
                      (f.type || "").includes("pdf") ||
                      (f.name || "").toLowerCase().endsWith(".pdf");
                    const isDocx = (f.name || "")
                      .toLowerCase()
                      .match(/\.docx?$/);
                    const fileIcon = isPdf
                      ? "#ef4444"
                      : isDocx
                      ? "#3b82f6"
                      : "var(--accent)";
                    return `<div style="display:flex;align-items:center;gap:1rem;padding:0.75rem;background:rgba(255,255,255,0.02);border:1px solid var(--border);margin-bottom:0.5rem;">
                        <div style="width:36px;height:36px;background:${fileIcon}22;border:1px solid ${fileIcon}44;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${fileIcon}" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:0.82rem;color:#fff;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(
                              f.name || "Unknown file"
                            )}</div>
                            <div style="font-size:0.72rem;color:var(--text-muted);">${escHtml(
                              f.type || ""
                            )} ${sizeStr ? "· " + sizeStr : ""}</div>
                        </div>
                        ${
                          hasData
                            ? `<a href="${f.data}" download="${escHtml(
                                f.name || "file"
                              )}" class="btn-sm btn-accent" style="padding:0.4rem 1rem;font-size:8px;flex-shrink:0;text-decoration:none;display:inline-flex;align-items:center;gap:0.4rem;">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download</a>`
                            : `<span style="font-size:8px;color:var(--text-muted);padding:0.4rem 1rem;border:1px solid var(--border);">Metadata only</span>`
                        }
                    </div>`;
                  })
                  .join("")}
            </div>`;
    };
    bodyEl.innerHTML = `
            <div style="padding:1rem 1.5rem;background:var(--accent-light);border-bottom:1px solid var(--border);">
                <div style="font-size:0.82rem;color:#fff;font-weight:600;margin-bottom:0.25rem;">${escHtml(
                  sub.title
                )}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">${escHtml(
                  sub.authors
                )} · Submitted by ${escHtml(
      sub.submittedByEmail || "Unknown"
    )}</div>
            </div>
            ${renderFiles(mFiles, "Manuscript")}
            ${renderFiles(sFiles, "Supplementary Files")}`;
  }
  document.getElementById("modal-docs").classList.add("open");
}
