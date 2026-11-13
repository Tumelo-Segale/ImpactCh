/* ============================================================
   Admin - Automatic site publishing
   Publishing an article commits its landing page + PDF to /articles/ and
   its URL to sitemap.xml in the site's GitHub repo (the Pages workflow then
   deploys it). Re-publishing the same article UPDATES the existing files
   and sitemap entry; it never creates duplicates.
   Needs a GitHub token (Settings > Site Publishing, Super Admin only).
   ============================================================ */

const LS_SITE = "ich_site_settings";
const SITE_DEFAULTS = {
  token: "",
  repo: "Tumelo-Segale/ImpactCh",
  branch: "main",
  baseUrl: "https://impactch.com",
};

function loadSiteSettings() {
  try {
    return { ...SITE_DEFAULTS, ...(JSON.parse(localStorage.getItem(LS_SITE)) || {}) };
  } catch {
    return { ...SITE_DEFAULTS };
  }
}

// ----- settings UI (Super Admin) -----
function initSiteSettingsForm() {
  const c = loadSiteSettings();
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v;
  };
  set("site-token", c.token);
  set("site-repo", c.repo);
  set("site-branch", c.branch);
  set("site-base", c.baseUrl);
}
function readSiteForm() {
  const g = (id) => (document.getElementById(id).value || "").trim();
  return {
    token: g("site-token"),
    repo: g("site-repo").replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, ""),
    branch: g("site-branch") || "main",
    baseUrl: g("site-base").replace(/\/+$/, "") || SITE_DEFAULTS.baseUrl,
  };
}
function saveSiteSettings() {
  if (!ojsIsSuper()) return;
  localStorage.setItem(LS_SITE, JSON.stringify(readSiteForm()));
  showToast("Site publishing settings saved");
}
async function testSiteConnection() {
  if (!ojsIsSuper()) return;
  const cfg = readSiteForm();
  if (!cfg.token) return showToast("Enter a GitHub token first");
  try {
    const r = await fetch(`https://api.github.com/repos/${cfg.repo}`, {
      headers: { Authorization: "Bearer " + cfg.token, Accept: "application/vnd.github+json" },
    });
    if (!r.ok) throw new Error("GitHub responded " + r.status);
    const j = await r.json();
    const canPush = j.permissions && j.permissions.push;
    showToast(canPush ? "Connected - write access confirmed" : "Connected, but this token cannot write to the repo");
  } catch (e) {
    showToast("Connection failed: " + e.message);
  }
}

// ----- GitHub contents API -----
function utf8ToB64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64ToUtf8(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\s/g, ""))));
}
function ghHeaders(cfg) {
  return {
    Authorization: "Bearer " + cfg.token,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}
async function ghGetFile(cfg, path) {
  const r = await fetch(
    `https://api.github.com/repos/${cfg.repo}/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`,
    { headers: ghHeaders(cfg) }
  );
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("GitHub " + r.status + " reading " + path);
  return r.json();
}
async function ghPutFile(cfg, path, b64, message, sha) {
  const r = await fetch(`https://api.github.com/repos/${cfg.repo}/contents/${path}`, {
    method: "PUT",
    headers: ghHeaders(cfg),
    body: JSON.stringify({ message, content: b64, branch: cfg.branch, ...(sha ? { sha } : {}) }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error("GitHub " + r.status + " writing " + path + " " + t.slice(0, 100));
  }
}
// create or update; skips the commit when the content is unchanged
async function ghUpsert(cfg, path, b64, message) {
  const existing = await ghGetFile(cfg, path);
  if (existing && String(existing.content || "").replace(/\s/g, "") === b64) return "unchanged";
  await ghPutFile(cfg, path, b64, message, existing && existing.sha);
  return existing ? "updated" : "created";
}

// ----- sitemap.xml -----
function upsertSitemapEntry(xml, loc, lastmod) {
  const esc = loc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("(<url>\\s*<loc>" + esc + "</loc>)([\\s\\S]*?)(</url>)");
  if (re.test(xml)) {
    return xml.replace(re, (m, a, mid, c) => {
      mid = /<lastmod>[\s\S]*?<\/lastmod>/.test(mid)
        ? mid.replace(/<lastmod>[\s\S]*?<\/lastmod>/, "<lastmod>" + lastmod + "</lastmod>")
        : "\n    <lastmod>" + lastmod + "</lastmod>" + mid;
      return a + mid + c;
    });
  }
  const entry =
    "  <url>\n    <loc>" + loc + "</loc>\n    <lastmod>" + lastmod +
    "</lastmod>\n    <changefreq>never</changefreq>\n    <priority>0.8</priority>\n  </url>\n\n";
  return xml.replace("</urlset>", () => entry + "</urlset>");
}

// ----- PDF for the article -----
function galleyPdfBase64(sub) {
  const f = (sub.galleyFiles || [])[0];
  if (f && f.data) {
    const m = String(f.data).match(/^data:application\/pdf[^,]*;base64,(.*)$/);
    if (m) return m[1];
  }
  const uri = _buildGalleyDoc(sub).output("datauristring");
  return uri.split("base64,").pop();
}

// ----- sync (serialised so commits never race) -----
let _syncChain = Promise.resolve();
function syncArticleToSite(id) {
  _syncChain = _syncChain.then(() => doSiteSync(id)).catch(() => {});
  return _syncChain;
}

async function doSiteSync(id) {
  const sub = ojsGetSub(id);
  if (!sub || sub.stage !== "published") return;
  const cfg = loadSiteSettings();
  const mark = (state) => ojsMutate(id, (s) => (s.siteSync = { at: ojsNow(), ...state }));
  if (!cfg.token || !cfg.repo) {
    mark({ ok: false, error: "GitHub token not configured" });
    showToast("Published. Add a GitHub token in Settings > Site Publishing to auto-upload to /articles/.");
    refreshWorkflowIfOpen(id);
    return;
  }
  try {
    const slug = sub.articleSlug || ojsSafeName(sub.title);
    const verb = sub.siteSync && sub.siteSync.ok ? "Update" : "Publish";
    const html = ojsLandingHtml(sub, cfg);
    const results = [];
    results.push(await ghUpsert(cfg, `articles/${slug}.html`, utf8ToB64(html), `${verb} article landing page: ${sub.title.slice(0, 60)}`));
    results.push(await ghUpsert(cfg, `articles/${slug}.pdf`, galleyPdfBase64(sub), `${verb} article PDF: ${sub.title.slice(0, 60)}`));

    const loc = `${cfg.baseUrl}/articles/${slug}.html`;
    const sm = await ghGetFile(cfg, "sitemap.xml");
    if (sm) {
      const today = new Date().toISOString().slice(0, 10);
      const next = upsertSitemapEntry(b64ToUtf8(sm.content), loc, today);
      await ghPutFile(cfg, "sitemap.xml", utf8ToB64(next), `Sitemap: ${verb.toLowerCase()} ${slug}`, sm.sha);
    }
    mark({ ok: true, url: loc, error: "" });
    showToast(results.every((r) => r === "unchanged") ? "Site already up to date" : "Landing page uploaded to /articles/ and sitemap updated");
  } catch (e) {
    mark({ ok: false, error: String(e.message || e) });
    showToast("Site sync failed: " + (e.message || e));
  }
  refreshWorkflowIfOpen(id);
}

function refreshWorkflowIfOpen(id) {
  if (_wf && _wf.id === id) renderWorkflow();
}
