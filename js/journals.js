/* ============================================================
   Journal registry - shared by the public site and the admin portal.
   Journals live in localStorage ("ich_journals") so a Super Admin can
   add / edit / delete them; defaults are used until the list is saved.
   ============================================================ */

const LS_JOURNALS = "ich_journals";
const MERGED_JOURNAL = {
  abbr: "AJTLGGS",
  name: "African Journal of Technology, Leadership, Governance and Geopolitical Studies",
  desc: "Technological innovation, effective leadership, governance models and geopolitical strategies.",
  issn: "3009-0822",
};
const DEFAULT_JOURNALS = [
  {
    abbr: "AJIESS",
    name: "African Journal on Impact Economic and Social Studies",
    desc: "Focusing on transformative economic policies and social development across the continent.",
    issn: "3009-0792",
  },
  {
    abbr: "IJHRGJS",
    name: "Int. Journal on Human Rights and Gender Justice Studies",
    desc: "A platform for critical research in justice, equity, and human rights frameworks globally.",
    issn: "3009-0806",
  },
  {
    abbr: "IJPAHS",
    name: "Int. Journal of Public and Allied Health Sciences",
    desc: "Advancing public health research and innovative healthcare practices.",
    issn: "3009-0814",
  },
  MERGED_JOURNAL,
  {
    abbr: "AJISAR",
    name: "African Journal of Implementation Science and Applied Research",
    desc: "Dedicated to the methodology of bridging theory and practice in various fields.",
    issn: "3009-0849",
  },
];

function loadJournals() {
  try {
    const j = JSON.parse(localStorage.getItem(LS_JOURNALS));
    if (Array.isArray(j) && j.length) return j;
  } catch {}
  return DEFAULT_JOURNALS.map((j) => ({ ...j }));
}
function saveJournals(list) {
  localStorage.setItem(LS_JOURNALS, JSON.stringify(list));
  JOURNALS = list;
}
function journalIssn(abbr) {
  const j = JOURNALS.find((x) => x.abbr === abbr);
  return (j && j.issn) || "";
}

// One-time merge: "Technology & Managerial Leadership" (IJTMLS) and
// "Good Governance & Geopolitical Science" (AJGGPS) -> AJTLGGS.
function migrateJournalsV2() {
  if (localStorage.getItem("ich_journals_v2")) return;
  const OLD_NAMES = [
    "Int. Journal of Technology and Managerial Leadership Studies",
    "African Journal on Good Governance and Geopolitical Science",
  ];
  const OLD_ABBRS = ["IJTMLS", "AJGGPS"];
  try {
    const stored = JSON.parse(localStorage.getItem(LS_JOURNALS));
    if (Array.isArray(stored) && stored.length) {
      const rest = stored.filter((j) => !OLD_ABBRS.includes(j.abbr));
      if (!rest.some((j) => j.abbr === MERGED_JOURNAL.abbr))
        rest.splice(Math.min(3, rest.length), 0, { ...MERGED_JOURNAL });
      localStorage.setItem(LS_JOURNALS, JSON.stringify(rest));
    }
    const subs = JSON.parse(localStorage.getItem("ich_submissions") || "[]");
    if (subs.some((s) => OLD_NAMES.includes(s.journal))) {
      subs.forEach((s) => {
        if (OLD_NAMES.includes(s.journal)) s.journal = MERGED_JOURNAL.name;
      });
      localStorage.setItem("ich_submissions", JSON.stringify(subs));
    }
    const issues = JSON.parse(localStorage.getItem("ich_issues") || "[]");
    if (issues.some((i) => OLD_ABBRS.includes(i.journal))) {
      issues.forEach((i) => {
        if (OLD_ABBRS.includes(i.journal)) i.journal = MERGED_JOURNAL.abbr;
      });
      localStorage.setItem("ich_issues", JSON.stringify(issues));
    }
    const revs = JSON.parse(localStorage.getItem("ich_reviewers") || "[]");
    if (revs.some((r) => (r.journals || []).some((a) => OLD_ABBRS.includes(a)))) {
      revs.forEach((r) => {
        if (!r.journals) return;
        const had = r.journals.some((a) => OLD_ABBRS.includes(a));
        r.journals = r.journals.filter((a) => !OLD_ABBRS.includes(a));
        if (had && !r.journals.includes(MERGED_JOURNAL.abbr))
          r.journals.push(MERGED_JOURNAL.abbr);
      });
      localStorage.setItem("ich_reviewers", JSON.stringify(revs));
    }
  } catch {}
  localStorage.setItem("ich_journals_v2", "1");
}

migrateJournalsV2();
let JOURNALS = loadJournals();
