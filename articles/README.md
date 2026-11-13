# /articles — Published Article Landing Pages

For each Published manuscript the admin downloads two files
(Galley PDF and Landing Page):

  <SafeTitle>.pdf   — the galley proof PDF (with embedded document properties)
  <SafeTitle>.html  — the Scholar landing page (with all citation <meta> tags)

## OJS workflow (admin portal)

Manuscripts move through Submission -> Review -> Copyediting -> Production -> Published
inside Admin > Manuscripts > Workflow.

### Automatic upload (Google Scholar)
When an article is published (or its issue is published), the admin portal commits to the
GitHub repo: `articles/<slug>.html` (landing page with all `citation_*` tags), `articles/<slug>.pdf`,
and a `<url>` entry in `sitemap.xml`. The GitHub Pages workflow then deploys it.

* One-time setup (Super Admin): **Settings > Site Publishing** - paste a fine-grained GitHub token
  (repository access: this repo only, permission "Contents: Read and write"), confirm repo/branch/site URL,
  then **Test Connection**.
* Re-publishing (e.g. after unpublishing to fix something) **updates the existing files and sitemap
  entry** - the slug is fixed the first time the article is published, so nothing is duplicated.
* Editing contributors on a published article re-syncs it automatically. **Sync to Site Now** on the
  Publication tab retries a failed sync.
* The manual **Download Landing Page / Galley PDF** buttons remain as a fallback.
* Unpublishing hides the article from the in-app archive but leaves the already-uploaded files in
  `/articles/` (delete them in the repo if you need them removed from search).

## Deploy workflow

1. Upload BOTH files to this `/articles/` directory on the web server.
2. Add a `<url>` entry for the `.html` file to `/sitemap.xml`.
3. Submit the updated sitemap in Google Search Console.

Google Scholar will then:
  • Crawl the `.html` page and read the Highwire Press `citation_*` meta tags.
  • Follow the `citation_pdf_url` link and index the PDF.
  • Display the article in Scholar search results within a few weeks.

## Required meta tags present in every generated .html file

  citation_title
  citation_author          (one tag per author)
  citation_journal_title
  citation_journal_abbrev
  citation_publisher
  citation_publication_date
  citation_year
  citation_abstract
  citation_language
  citation_pdf_url
  citation_fulltext_html_url
  citation_issn            (per-journal ISSNs listed below)

## Journal ISSNs

  AJIESS   — 3009-0792
  IJHRGJS  — 3009-0806
  IJPAHS   — 3009-0814
  AJTLGGS  — 3009-0822   (merged from IJTMLS + AJGGPS; edit in Admin > Journals)
  AJISAR   — 3009-0849
