# /articles — Published Article Landing Pages

Each time an admin clicks "Download Galley PDF" for a Published manuscript,
two files are generated and downloaded to the admin's machine:

  <SafeTitle>.pdf   — the galley proof PDF (with embedded document properties)
  <SafeTitle>.html  — the Scholar landing page (with all citation <meta> tags)

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
  IJTMLS   — 3009-0822
  AJGGPS   — 3009-0830
  AJISAR   — 3009-0849
