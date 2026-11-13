/* ============================================================
   Admin - Import already-published articles (back catalogue)
   Adds articles that were published BEFORE this platform existed,
   straight into the Published stage (no review / invoice needed).
   - Single article form (optional galley PDF upload)
   - Bulk import: select several article files (PDFs) at once, review/edit
     each one's details, then import them all
   Issues (volume/number/year) are created automatically if missing,
   so past volumes show up in the public archive.
   Loaded after tab-workflow.js / tab-issues.js / site-sync.js.
   ============================================================ */

let _impBulkItems = [];

let _impTab = "single";

// ----- modal (built on first use) -----
function ensureImportModal() {
  if (document.getElementById("modal-import")) return;
  const wrap = document.createElement("div");
  wrap.className = "modal-overlay";
  wrap.id = "modal-import";
  wrap.innerHTML = `
    <div class="modal" style="max-width:720px;">
      <div class="modal-head"><h3>Import Published Articles</h3>
        <button class="modal-close" onclick="closeModal('modal-import')" aria-label="Close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:0.5rem;margin-bottom:1.25rem;">
          <button type="button" class="btn-sm" id="imp-tab-single" onclick="impSwitchTab('single')">Single Article</button>
          <button type="button" class="btn-sm" id="imp-tab-bulk" onclick="impSwitchTab('bulk')">Bulk Import (Files)</button>
        </div>

        <div id="imp-single">
          <div class="wf-muted" style="margin-bottom:1rem;">Add an article that was already published elsewhere or before this platform. It is published immediately and appears in the public archive.</div>
          <div class="form-field"><label class="form-label">Journal</label><select class="form-select" id="imp-journal"></select></div>
          <div class="form-field"><label class="form-label">Title</label><input class="form-input" id="imp-title"></div>
          <div class="form-field"><label class="form-label">Authors <span style="text-transform:none;letter-spacing:0;font-weight:400;">(comma separated)</span></label><input class="form-input" id="imp-authors" placeholder="e.g. Jane Doe, John Smith"></div>
          <div class="form-field"><label class="form-label">Abstract</label><textarea class="form-textarea" id="imp-abstract" rows="4"></textarea></div>
          <div class="wf-form-grid" style="margin-bottom:1rem;">
            <div><label class="form-label">Keywords</label><input class="form-input" id="imp-keywords" placeholder="comma separated"></div>
            <div><label class="form-label">DOI</label><input class="form-input" id="imp-doi" placeholder="10.xxxx/xxxxx"></div>
            <div><label class="form-label">Pages</label><input class="form-input" id="imp-pages" placeholder="e.g. 1-14"></div>
            <div><label class="form-label">Publication Date</label><input type="date" class="form-input" id="imp-date"></div>
          </div>
          <div class="wf-form-grid" style="margin-bottom:1rem;">
            <div><label class="form-label">Volume</label><input type="number" min="1" class="form-input" id="imp-volume"></div>
            <div><label class="form-label">Issue No.</label><input type="number" min="1" class="form-input" id="imp-number"></div>
            <div><label class="form-label">Year</label><input type="number" min="1901" class="form-input" id="imp-year"></div>
          </div>
          <div class="wf-muted" style="margin:-0.5rem 0 1rem;">Fill volume, issue and year to file it in that issue (created automatically if it does not exist). Leave all three empty for "Online First".</div>
          <div class="form-field"><label class="form-label">Author Email <span style="text-transform:none;letter-spacing:0;font-weight:400;">(optional - lets the author see it on their dashboard)</span></label><input type="email" class="form-input" id="imp-email"></div>
          <div class="form-field"><label class="form-label">Galley PDF <span style="text-transform:none;letter-spacing:0;font-weight:400;">(optional - a PDF is generated from the metadata if omitted)</span></label><input type="file" accept=".pdf" class="form-input" id="imp-pdf"></div>
          <label class="wf-check"><input type="checkbox" id="imp-sync" checked> Upload landing page to /articles/ and update sitemap.xml</label>
        </div>

        <div id="imp-bulk" style="display:none;">
          <div class="wf-muted" style="margin-bottom:1rem;">Select several article files (PDF) at once. Each file becomes one published article and is used as its galley. Title and authors are read from the PDF where possible - check and correct them below. Articles that duplicate an existing DOI (or title in the same journal) are skipped.</div>
          <div class="form-field"><label class="form-label">Default Journal</label><select class="form-select" id="imp-bulk-journal"></select></div>
          <div class="wf-form-grid" style="margin-bottom:1rem;">
            <div><label class="form-label">Volume</label><input type="number" min="1" class="form-input" id="imp-bulk-volume"></div>
            <div><label class="form-label">Issue No.</label><input type="number" min="1" class="form-input" id="imp-bulk-number"></div>
            <div><label class="form-label">Year</label><input type="number" min="1901" class="form-input" id="imp-bulk-year"></div>
            <div><label class="form-label">Default Publication Date</label><input type="date" class="form-input" id="imp-bulk-date" onchange="impBulkRender()"></div>
          </div>
          <div class="wf-muted" style="margin:-0.5rem 0 1rem;">Volume, issue and year apply to every file below. The default date fills each file's own date, which you can change per article. Fill volume, issue and year to file them in that issue (created automatically if missing), or leave all three empty for "Online First".</div>
          <div class="form-field"><label class="form-label">Article Files <span style="text-transform:none;letter-spacing:0;font-weight:400;">(PDF - select multiple)</span></label><input type="file" accept=".pdf,application/pdf" multiple class="form-input" id="imp-files" onchange="impBulkAddFiles(this)"></div>
          <div id="imp-bulk-summary" class="wf-muted" style="margin-bottom:0.75rem;"></div>
          <div id="imp-bulk-list"></div>
          <label class="wf-check" style="margin-top:0.75rem;"><input type="checkbox" id="imp-bulk-sync"> Upload each landing page to /articles/ and update sitemap.xml (needs GitHub token; runs one at a time)</label>
        </div>

        <p id="imp-error" style="display:none;color:var(--red);font-size:0.78rem;margin-top:1rem;"></p>
        <div id="imp-result" style="margin-top:1rem;font-size:0.8rem;line-height:1.6;"></div>
      </div>
      <div class="modal-footer">
        <button class="btn-sm btn-ghost" onclick="closeModal('modal-import')">Close</button>
        <button class="btn-sm btn-accent" id="imp-submit" onclick="impSubmit()">Import Article</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
}

function openImportModal(tab) {
  ensureImportModal();
  const opts = JOURNALS.map(
    (j) => `<option value="${escHtml(j.abbr)}">${escHtml(j.name)} (${escHtml(j.abbr)})</option>`
  ).join("");
  document.getElementById("imp-journal").innerHTML = opts;
  document.getElementById("imp-bulk-journal").innerHTML = opts;
  [
    "title", "authors", "abstract", "keywords", "doi", "pages",
    "volume", "number", "year", "email",
  ].forEach((k) => (document.getElementById("imp-" + k).value = ""));
  document.getElementById("imp-date").value = new Date().toISOString().slice(0, 10);
  document.getElementById("imp-pdf").value = "";
  ["volume", "number", "year"].forEach((k) => (document.getElementById("imp-bulk-" + k).value = ""));
  document.getElementById("imp-bulk-date").value = new Date().toISOString().slice(0, 10);
  document.getElementById("imp-files").value = "";
  _impBulkItems = [];
  impBulkRender();
  document.getElementById("imp-sync").checked = true;
  document.getElementById("imp-bulk-sync").checked = false;
  document.getElementById("imp-error").style.display = "none";
  document.getElementById("imp-result").innerHTML = "";
  impSwitchTab(tab || "single");
  document.getElementById("modal-import").classList.add("open");
}

function impSwitchTab(tab) {
  _impTab = tab;
  document.getElementById("imp-single").style.display = tab === "single" ? "" : "none";
  document.getElementById("imp-bulk").style.display = tab === "bulk" ? "" : "none";
  document.getElementById("imp-tab-single").className = "btn-sm " + (tab === "single" ? "btn-accent" : "btn-ghost");
  document.getElementById("imp-tab-bulk").className = "btn-sm " + (tab === "bulk" ? "btn-accent" : "btn-ghost");
  document.getElementById("imp-submit").textContent = tab === "single" ? "Import Article" : "Import Articles";
  document.getElementById("imp-error").style.display = "none";
  document.getElementById("imp-result").innerHTML = "";
}

function impFail(msg) {
  const el = document.getElementById("imp-error");
  el.textContent = msg;
  el.style.display = "block";
}

// ----- core: create one published article -----
function impFindJournal(val) {
  const v = String(val || "").trim().toLowerCase();
  if (!v) return null;
  return (
    JOURNALS.find((j) => j.abbr.toLowerCase() === v || j.name.toLowerCase() === v) || null
  );
}

function impToIso(dateStr, year) {
  // noon UTC so the calendar day never shifts with time zones
  let ms = null;
  const str = String(dateStr || "").trim();
  const m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) ms = Date.UTC(+m[1], +m[2] - 1, +m[3], 12);
  else if (str) {
    const t = Date.parse(str);
    if (!isNaN(t)) {
      const d = new Date(t);
      ms = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12);
    }
  }
  if (ms === null && year) ms = Date.UTC(Number(year), 0, 1, 12);
  return ms === null ? null : new Date(ms).toISOString();
}

// Returns { ok:true, sub } or { ok:false, error }
function impCreateArticle(rec, subs, issues) {
  const journal = impFindJournal(rec.journal);
  if (!journal) return { ok: false, error: 'Unknown journal "' + (rec.journal || "") + '"' };
  const title = String(rec.title || "").trim();
  const authors = String(rec.authors || "").trim();
  if (!title) return { ok: false, error: "Title is required" };
  if (!authors) return { ok: false, error: "Authors are required" };

  const volume = parseInt(rec.volume, 10);
  const number = parseInt(rec.number, 10);
  const year = parseInt(rec.year, 10);
  const hasIssue = volume > 0 || number > 0 || year > 0;
  if (hasIssue && !(volume > 0 && number > 0 && year > 1900))
    return { ok: false, error: "Volume, issue number and year must all be filled in (or all left empty)" };

  const iso = impToIso(rec.date, hasIssue ? year : null);
  if (!iso) return { ok: false, error: "Publication date is required" };

  const doi = String(rec.doi || "").trim();
  const dup = subs.find(
    (s) =>
      (doi && String(s.doi || "").toLowerCase() === doi.toLowerCase()) ||
      (s.journal === journal.name && String(s.title || "").trim().toLowerCase() === title.toLowerCase())
  );
  if (dup) return { ok: false, error: "Already exists (" + (doi && String(dup.doi || "").toLowerCase() === doi.toLowerCase() ? "same DOI" : "same title") + ")", duplicate: true };

  let issueId = "";
  if (hasIssue) {
    let issue = issues.find((i) => i.journal === journal.abbr && i.volume === volume && i.number === number);
    if (!issue) {
      issue = {
        id: ojsId("iss"),
        journal: journal.abbr,
        volume,
        number,
        year,
        title: "",
        status: "published",
        publishedAt: iso,
        createdAt: ojsNow(),
      };
      issues.push(issue);
    }
    issueId = issue.id;
  }

  const sub = {
    id: Math.random().toString(36).substr(2, 9),
    title,
    abstract: String(rec.abstract || "").trim(),
    authors,
    journal: journal.name,
    // "imported" keeps it off every author's public dashboard unless an author email is given
    submittedByEmail: String(rec.email || "").trim().toLowerCase() || "imported",
    submittedByName: "",
    status: "Published",
    stage: "published",
    round: 1,
    submittedAt: iso,
    approvedAt: iso,
    publishedAt: iso,
    issueId,
    pages: String(rec.pages || "").trim(),
    doi,
    keywords: String(rec.keywords || "").trim(),
    manuscriptFiles: [],
    suppFiles: [],
    reviews: [],
    reviewAssignments: [],
    decisions: [],
    galleyFiles: rec.galley ? [rec.galley] : [],
    imported: true,
    history: [{ at: ojsNow(), by: ojsActor(), text: "Imported as a previously published article" }],
  };
  sub.articleSlug = ojsEnsureSlug(sub, subs);
  return { ok: true, sub };
}

function impCommit(newSubs, issues) {
  const subs = loadSubs();
  newSubs.slice().reverse().forEach((s) => subs.unshift(s));
  try {
    saveSubs(subs);
    saveIssues(issues);
  } catch {
    return false;
  }
  return true;
}

// ----- submit -----
async function impSubmit() {
  document.getElementById("imp-error").style.display = "none";
  document.getElementById("imp-result").innerHTML = "";
  if (_impTab === "single") return impSubmitSingle();
  return impSubmitBulk();
}

async function impSubmitSingle() {
  const g = (k) => document.getElementById("imp-" + k).value;
  const file = document.getElementById("imp-pdf").files[0];
  let galley = null;
  if (file) {
    if (!/\.pdf$/i.test(file.name)) return impFail("The galley must be a PDF file.");
    galley = await ojsReadFile(file);
  }
  const subs = loadSubs();
  const issues = loadIssues();
  const res = impCreateArticle(
    {
      journal: g("journal"), title: g("title"), authors: g("authors"), abstract: g("abstract"),
      keywords: g("keywords"), doi: g("doi"), pages: g("pages"), volume: g("volume"),
      number: g("number"), year: g("year"), date: g("date"), email: g("email"), galley,
    },
    subs,
    issues
  );
  if (!res.ok) return impFail(res.error);
  if (!impCommit([res.sub], issues))
    return impFail("Storage is full - could not save. Try without the PDF upload.");
  closeModal("modal-import");
  refreshAll();
  renderIssues();
  showToast("Article imported and published");
  if (document.getElementById("imp-sync").checked) syncArticleToSite(res.sub.id);
}

// ----- bulk: multiple article files -----
function impBytesToText(buf) {
  let out = "";
  const u8 = new Uint8Array(buf);
  const step = 0x8000;
  for (let i = 0; i < u8.length; i += step)
    out += String.fromCharCode.apply(null, u8.subarray(i, i + step));
  return out;
}

function impPdfString(raw) {
  // literal string body "(...)" -> text
  let t = raw
    .replace(/\\([nrtbf])/g, (m, c) => ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" }[c]))
    .replace(/\\([0-7]{1,3})/g, (m, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\([()\\])/g, "$1");
  if (t.charCodeAt(0) === 0xfe && t.charCodeAt(1) === 0xff) {
    let u = "";
    for (let i = 2; i + 1 < t.length; i += 2)
      u += String.fromCharCode((t.charCodeAt(i) << 8) | t.charCodeAt(i + 1));
    t = u;
  }
  return t.replace(/\s+/g, " ").trim();
}

function impPdfHex(hex) {
  hex = hex.replace(/\s+/g, "");
  if (hex.length % 2) hex += "0";
  let bytes = "";
  for (let i = 0; i < hex.length; i += 2) bytes += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return impPdfString(bytes.replace(/([()\\])/g, "\\$1"));
}

// Best-effort read of the /Title and /Author document properties
function impPdfInfo(text, key) {
  const lit = new RegExp("/" + key + "\\s*\\(((?:\\\\[\\s\\S]|[^\\\\)])*)\\)", "g");
  const hex = new RegExp("/" + key + "\\s*<([0-9A-Fa-f\\s]+)>", "g");
  let val = "", m;
  while ((m = lit.exec(text))) val = impPdfString(m[1]) || val;
  while ((m = hex.exec(text))) val = impPdfHex(m[1]) || val;
  return val;
}

function impTitleFromName(name) {
  let t = name.replace(/\.pdf$/i, "").replace(/_+/g, " ");
  if (!/\s/.test(t)) t = t.replace(/-+/g, " ");
  return t.replace(/\s+/g, " ").trim();
}

function impCleanTitle(t, fileName) {
  t = String(t || "").replace(/^microsoft word\s*-\s*/i, "").replace(/\.(docx?|pdf)$/i, "").trim();
  if (t.length < 4 || /^(untitled|document\d*|slide \d+)$/i.test(t)) return "";
  return t;
}

async function impBulkAddFiles(input) {
  const files = Array.from(input.files || []);
  input.value = "";
  if (!files.length) return;
  const bad = files.filter((f) => !/\.pdf$/i.test(f.name));
  const good = files.filter((f) => /\.pdf$/i.test(f.name));
  document.getElementById("imp-bulk-summary").textContent = "Reading " + good.length + " file(s)...";
  for (const f of good) {
    if (_impBulkItems.some((it) => it.galley.name === f.name && it.galley.size === f.size)) continue;
    const galley = await ojsReadFile(f);
    let title = "", authors = "";
    try {
      const txt = impBytesToText(await f.arrayBuffer());
      title = impCleanTitle(impPdfInfo(txt, "Title"), f.name);
      authors = impPdfInfo(txt, "Author").replace(/\s*[;&]\s*|\s+and\s+/gi, ", ");
    } catch {}
    _impBulkItems.push({
      galley,
      title: title || impTitleFromName(f.name),
      authors,
      doi: "",
      pages: "",
      date: "", // empty = use the default date
    });
  }
  impBulkRender();
  if (bad.length) impFail("Skipped " + bad.length + " file(s) that are not PDFs: " + bad.map((f) => f.name).join(", "));
}

function impBulkSet(i, k, v) {
  if (_impBulkItems[i]) _impBulkItems[i][k] = v;
}

function impBulkRemove(i) {
  _impBulkItems.splice(i, 1);
  impBulkRender();
}

function impBulkRender() {
  const list = document.getElementById("imp-bulk-list");
  const sum = document.getElementById("imp-bulk-summary");
  if (!list || !sum) return;
  if (!_impBulkItems.length) {
    list.innerHTML = "";
    sum.textContent = "No files selected yet.";
    return;
  }
  const defDate = document.getElementById("imp-bulk-date").value;
  const total = _impBulkItems.reduce((n, it) => n + (it.galley.size || 0), 0);
  const mb = (total / 1024 / 1024).toFixed(2);
  sum.innerHTML =
    "<b>" + _impBulkItems.length + "</b> file(s) selected · " + mb + " MB" +
    (total > 3.5 * 1024 * 1024
      ? ' <span style="color:var(--red);">- the browser can only store about 5 MB in total, so import these in smaller batches.</span>'
      : "");
  list.innerHTML = _impBulkItems
    .map(
      (it, i) => `
    <div class="wf-file" style="display:block;margin-bottom:0.75rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;margin-bottom:0.6rem;">
        <div class="wf-file-name" style="overflow:hidden;text-overflow:ellipsis;">${escHtml(it.galley.name)}<span>${(it.galley.size / 1024 / 1024).toFixed(2)} MB</span></div>
        <button type="button" class="btn-sm btn-ghost" onclick="impBulkRemove(${i})">Remove</button>
      </div>
      <div class="form-field"><label class="form-label">Title</label><input class="form-input" value="${escHtml(it.title)}" oninput="impBulkSet(${i},'title',this.value)"></div>
      <div class="form-field"><label class="form-label">Authors <span style="text-transform:none;letter-spacing:0;font-weight:400;">(comma separated)</span></label><input class="form-input" value="${escHtml(it.authors)}" placeholder="e.g. Jane Doe, John Smith" oninput="impBulkSet(${i},'authors',this.value)"></div>
      <div class="wf-form-grid">
        <div><label class="form-label">DOI</label><input class="form-input" value="${escHtml(it.doi)}" placeholder="optional" oninput="impBulkSet(${i},'doi',this.value)"></div>
        <div><label class="form-label">Pages</label><input class="form-input" value="${escHtml(it.pages)}" placeholder="optional" oninput="impBulkSet(${i},'pages',this.value)"></div>
        <div><label class="form-label">Publication Date</label><input type="date" class="form-input" value="${escHtml(it.date || defDate)}" oninput="impBulkSet(${i},'date',this.value)"></div>
      </div>
    </div>`
    )
    .join("");
}

async function impSubmitBulk() {
  if (!_impBulkItems.length) return impFail("Choose one or more article files first.");
  const g = (k) => document.getElementById("imp-bulk-" + k).value;
  const subs = loadSubs();
  const issues = loadIssues();
  const created = [];
  const importedIdx = [];
  const problems = [];
  let dupes = 0;

  _impBulkItems.forEach((it, idx) => {
    const res = impCreateArticle(
      {
        journal: g("journal"), title: it.title, authors: it.authors, doi: it.doi, pages: it.pages,
        volume: g("volume"), number: g("number"), year: g("year"), date: it.date || g("date"), galley: it.galley,
      },
      subs.concat(created),
      issues
    );
    if (res.ok) {
      created.push(res.sub);
      importedIdx.push(idx);
    } else if (res.duplicate) {
      dupes++;
      problems.push(it.galley.name + ": " + res.error);
    } else problems.push(it.galley.name + ": " + res.error);
  });

  if (created.length && !impCommit(created, issues))
    return impFail("Storage is full - nothing was saved. Try fewer or smaller files.");

  // keep only the files that were NOT imported so they can be fixed and retried
  _impBulkItems = _impBulkItems.filter((_, i) => !importedIdx.includes(i));
  impBulkRender();
  refreshAll();
  renderIssues();
  const sync = document.getElementById("imp-bulk-sync").checked;
  if (sync) created.forEach((s) => syncArticleToSite(s.id));

  document.getElementById("imp-result").innerHTML =
    `<div class="wf-note ok"><b>${created.length}</b> article(s) imported` +
    (dupes ? ` · ${dupes} skipped as duplicates` : "") +
    (problems.length - dupes > 0 ? ` · ${problems.length - dupes} file(s) need attention` : "") +
    (sync && created.length ? " · uploading to the site in the background" : "") +
    `</div>` +
    (problems.length
      ? `<div class="wf-note warn" style="margin-top:0.5rem;max-height:160px;overflow:auto;">${problems.map(escHtml).join("<br>")}<br><br>These files are still listed above - fix them and import again.</div>`
      : "");
  if (created.length) showToast(created.length + " article(s) imported");
}
