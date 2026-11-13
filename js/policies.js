/* ============================================================
   Impact Compass Journals - Policies & Indexing popups
   Text is supplied by the journal. Light markup:
     "## Heading"   -> section heading
     "- item"       -> bullet
     "**Label:**"   -> bold label
     anything else  -> paragraph
   ============================================================ */

const POLICY_DOCS = {
  "peer-review": {
    title: "Peer Review Policy",
    text: String.raw`Peer Review Policy for Impact Compass Journals

## Purpose
The peer review process at Impact Compass Journals is designed to ensure the publication of high-quality original research by providing rigorous, fair, and constructive evaluation of the submitted manuscripts. This policy outlines the principles, procedures, and ethical standards guiding the review process.

## Type of Peer Review
Impact Compass Journals operates a single-anonymous (single-blind) peer review process: reviewers know the identity of the authors, but they do not know the identity of the reviewers.
All submissions are subject to peer review, except invited articles, editorials, and letters, which may be reviewed at the editor-in-chief’s discretion.

## Initial Screening
Upon submission, manuscripts undergo an internal quality control check by the editorial office to ensure compliance with journal policies, completeness of submission, and adherence to ethical standards (e.g. conflicts of interest, authorship, and financial disclosures).
Manuscripts failing to meet the basic requirements may be returned to the authors for correction prior to review.

## Reviewer Selection and Assignment
Manuscripts that passed the initial screening were assigned to at least two to four independent expert reviewers with relevant scientific expertise.
Reviewers were selected based on their knowledge of the subject area of the manuscript to ensure a competent and thorough evaluation.

## Reviewer Responsibilities
- **Impartiality and Confidentiality:** Reviewers must disclose any conflicts of interest (financial, professional, or personal), and recuse themselves if such conflicts exist.
- **Confidentiality:** Manuscripts and associated data must be treated as privileged information and not shared or used for personal advantage.
- **Constructive Feedback:** Reviews should provide clear, respectful, and actionable feedback, highlight both strengths and areas for improvement, and offer specific recommendations.
- **Timeliness:** Reviewers are expected to submit their reports within an agreed timeframe. Delays must be communicated promptly to the editorial office.

## Review Criteria
Reviewers were asked to assess manuscripts based on the following:
- Originality and significance of the research
- Methodological rigor and validity of data
- Clarity and coherence of presentation
- Appropriateness of conclusions drawn from the data
- Ethical standards and transparency

## Editorial Decision Process
The Editor-in-Chief, informed by the reviewer’s reports, will decide to:
- Accept the manuscript
- Request minor or major revisions
- Reject the manuscript
The authors have provided anonymous reviewer comments and editorial recommendations.
Revised manuscripts and author rebuttals were typically returned to the original reviewers for further assessment. No more than three rounds of revision were permitted.
In cases of conflicting reviews, the editor-in-chief may seek additional opinions or arbitrate the final decision.

## Appeals
The authors may appeal editorial decisions in writing to the Editor-in-Chief, providing a detailed justification. Appeals will be considered by the editorial board and, if necessary, by additional reviewers.

## Ethical Standards
Impact Compass Journals adhere to the Committee on Publication Ethics (COPE) Code of Conduct and Best Practice Guidelines.
All parties involved in the peer-review process are expected to uphold the highest standards of integrity, transparency, and respect.

## Post-Publication
If concerns arise after publication, the journal will investigate according to the COPE guidelines and may issue corrections, retractions, or other appropriate actions as necessary.

## Communication
All editorial correspondence regarding decisions, revisions, and appeals will be conducted via the journal’s submission system to ensure transparency and record keeping.
This policy is reviewed regularly to reflect best practices and evolving standards in scholarly publishing.`,
  },

  ethics: {
    title: "Ethics Policy",
    text: String.raw`## Purpose
Impact Compass Journals are dedicated to upholding the highest standards of publication ethics and integrity. This policy outlines the ethical responsibilities of authors, editors, reviewers, and the publisher in line with internationally recognised guidelines, such as those from the Committee on Publication Ethics (COPE).

## Editorial Responsibilities
- **Editorial Independence:** Editors make decisions based solely on the manuscript’s scholarly merit, originality, clarity, and relevance, without discrimination based on the authors’ personal characteristics or affiliations.
- **Confidentiality:** All submitted manuscripts and related correspondence are treated as confidential and are not shared beyond those directly involved in the review and publication process.
- **Conflicts of Interest:** The authors declare no conflicts of interest and recuse themselves from handling manuscripts where such conflicts exist.
- **Corrections and Retractions:** The journal issues corrections, retractions, or expressions of concern when necessary, following COPE guidelines, to maintain the integrity of the scholarly record.

## Author Responsibilities
- **Originality and Plagiarism:** Authors must submit only original works that have not been published or submitted elsewhere. All sources must be cited appropriately. Plagiarism, data fabrication, falsification, and redundant publications were strictly prohibited.
- **Authorship:** Only those who have made significant contributions to the research and writing are listed as authors. All contributors must be appropriately acknowledged.
- **Disclosure and Conflicts of Interest:** Authors must disclose all sources of funding, relevant financial or non-financial interests, and any potential conflicts of interest that could influence this research.
- **Ethical Research Standards:** Research involving human or animal subjects must comply with the relevant ethical standards and obtain the necessary approval. Ethical approval must be provided upon request.
- **Inclusive Language:** Authors must use culturally sensitive and inclusive language, avoiding terminology that could be interpreted as hostile or offensive based on group differences, such as ethnicity, gender, sexuality, age, or health.

## Reviewer Responsibilities
- **Confidentiality:** Reviewers must treat manuscripts and related data as confidential and not use them for personal advantage.
- **Objectivity:** Reviews should be objective, constructive, and free of personal biases.
- **Conflicts of Interest:** The authors declare no conflicts of interest and recuse themselves from reviewing where such conflicts exist.
- **Timeliness:** Reviewers are expected to complete reviews within the agreed timeframe and notify the editorial office of any delays.

## Publisher Responsibilities
- **Integrity of the Record:** The publisher supports the editorial team in investigating and addressing allegations of misconduct, ensuring that corrections and retractions are made as needed.
- **Archiving and Data Retention:** All manuscripts and substantive correspondence are securely stored and accessible for editorial and audit purposes.
- **Transparency:** Journal policies, including those on copyright, licencing, and advertising, are published on the journal website.

## Misconduct and Investigations
- **Allegations of Misconduct:** The journal investigates all allegations of ethical misconduct (e.g. plagiarism, data manipulation, redundant publication) following COPE procedures. Proven cases may result in rejection, retraction, institutional notification, or other corrective actions.
- **Appeals:** The authors have the right to appeal to editorial decisions by providing detailed justification, which will be reviewed by the editorial board.

## Governance
- **Editorial Board:** The journal maintains a diverse and qualified editorial board, with publicly listed members’ names and affiliations. The board composition is reviewed regularly, and members are given clear guidelines on their roles and responsibilities.
- **Annual Review:** The journal compiles annual reports with recommendations for improvement, which are considered by the editorial board and publisher.

## Commitment to Best Practice
Impact Compass Journals adhere to the COPE Code of Conduct and Best Practice Guidelines as well as relevant national and international standards to ensure ethical, transparent, and trustworthy scholarly publishing. This policy is reviewed regularly to reflect evolving best practices in academic publishing.`,
  },

  coi: {
    title: "Conflict of Interest Policy",
    text: String.raw`## Purpose
This policy ensures the integrity, transparency, and trustworthiness of the editorial and publication processes at Impact Compass Journals by identifying, disclosing, and managing conflicts of interest (COIs) among authors, reviewers, editors, and staff.

## Definition of Conflict of Interest
A conflict of interest exists when an individual’s personal, financial, or professional interests unduly influence or appear to influence their responsibilities in the publication process. COIs may be direct or indirect, financial or non-financial, and may involve relationships, affiliations or competing interests.

## Scope
This policy applies to all participants in the publication process, including:
- Authors and co-authors
- Reviewers
- Editors, editorial board members, and editorial staff
- The publisher

## Disclosure Requirements
**Authors:**
- All authors must disclose any financial, personal, or professional relationships that could be perceived to influence their work. This includes, but is not limited to, employment, consultancy, stock ownership, honoraria, paid expert testimony, grants, patents, or affiliations with organizations with an interest in the submitted work.
- If no conflict exists, authors must state: “The author(s) confirm(s) that there is no conflict of interest related to the manuscript.”
- Disclosures must be included in the manuscript and during the submission.

**Reviewers:**
- Reviewers must declare any potential COI before accepting the review assignment. This includes recent collaborations, institutional affiliations, personal relationships or academic competition with the authors.
- Reviewers should decline to review if any COI could compromise the objectivity.
- Any COI discovered during the review must be promptly disclosed to the editorial office.

**Editors and Editorial Board Members:**
- Editors and board members must recuse themselves from handling manuscripts in which they have a COI, such as being a co-author, collaborator, or having a personal or financial relationship with the authors within the past three years.
- Editors and staff must disclose any potential COIs related to submitted manuscripts and request reassignment, as necessary.

## Management of Conflicts
- All declared COIs will be reviewed by the editorial office for appropriate action, which may include the reassignment of editors or reviewers, additional oversight, or disclosure in the published article.
- If a COI is identified after publication, the journal will investigate and, if necessary, issue a correction or retraction of the article.
- Failure to disclose a COI may result in sanctions, including removal from editorial or reviewer roles and notification to relevant institutions.

## Record Keeping and Transparency
- All disclosures and actions taken regarding COIs will be documented and retained by our journal.
- Published articles include a COI statement, either disclosing relevant interests or confirming their absence.

## Annual Review and Training
- This policy will be reviewed annually and updated as needed to reflect the best practices and evolving standards.
- Editorial staff, board members, and reviewers will receive periodic training on COI identification and management.

## Contact and Queries
Questions or concerns regarding this policy should be directed to the editorial office of the Impact Compass Journals. This policy is aligned with international standards and recommendations from COPE, ICMJE, and other leading organizations to ensure ethical and unbiased scholarly publishing`,
  },

  retraction: {
    title: "Retraction Policy",
    text: String.raw`## Purpose
The retraction policy of Impact Compass Journals is designed to uphold the integrity of the scholarly record by correcting the literature and alerting readers to articles that contain seriously flawed or erroneous data, findings or ethical breaches. The primary goal is to ensure accuracy and trust in published research, not to punish authors.

## Grounds for Retraction
Articles may be retracted for reasons including but not limited to the following:
- Clear evidence that the findings are unreliable due to misconduct (e.g., data fabrication or falsification) or honest error (e.g., miscalculation or experimental error).
- Plagiarism or unauthorized use of materials or data.
- Redundant publication (i.e., publishing the same data or article in more than one journal without appropriate cross-referencing or justification).
- Unethical research, including a lack of required ethics approval.
- Major authorship issues, such as proven ghostwriting or gift authorship, are also discussed.
- Failure to disclose a major competing interest that could have influenced this work.
- Legal issues, such as copyright infringement, libel, and privacy violations.

## Retraction Process
- **Initiation:** Retractions can be initiated by the journal’s editors, authors, or third parties (e.g., readers, institutions) when concerns arise.
- **Investigation:** All concerns will be investigated thoroughly by the editorial board, which may consult external experts or relevant institutions, if necessary.
- **Decision:** The Editor-in-Chief, in consultation with the editorial board, has the final authority to retract an article, regardless of author consent.
- **Timing:** Retractions should be issued promptly once sufficient evidence is available to minimize the impact of unreliable work.

## Retraction Notice
Retraction notices will be:
- It should be clearly identified as a retraction and distinguishable from other corrections or comments.
- Be linked to the original article in all online versions and bibliographic databases.
- Clearly state the title and authors of the retracted article, the reason(s) for the retraction, and who is retracting the article.
- Be factual, objective, and free from inflammatory language.
- It should be freely accessible to all readers and not behind paywalls.
- Indicate if the retraction is due to author error, misconduct, or other reasons, and specify whether all or some authors are responsible.
The original article will remain accessible but will be clearly marked as retracted (e.g., watermarked PDF, retraction note on the HTML version) to maintain the scholarly record.

## Expressions of Concern and Corrections
- If the evidence is inconclusive or an investigation is ongoing, the journal may issue an Expression of Concern to alert readers until a final decision is made.
- Minor errors that do not invalidate the findings may be addressed through corrections rather than retractions.

## Exceptional Circumstances
In rare cases where an article must be removed (e.g., for legal reasons or risk to public health), the journal will retain the article’s metadata and publish a notice explaining the removal.

## Transparency and Record-Keeping
- All retraction decisions and notices will be documented and retained by our journal.
- Retraction notices will be indexed and linked to all versions and databases to ensure transparency and traceability.

## Policy Review
This policy will be reviewed regularly to ensure alignment with best practices and evolving standards, including guidance from the COPE and other international bodies. Impact Compass Journals is committed to maintaining the highest standards of publication ethics and integrity through clear, fair, and transparent retraction procedures.`,
  },

  "open-access": {
    title: "Open Access Policy",
    text: String.raw`## Purpose
Impact Compass Journals is committed to the free and universal dissemination of scholarly research. This Open Access Policy ensures that all published articles are immediately and permanently available online, without subscription or access barriers, to maximise the visibility, accessibility, and impact of the research.

## Open Access Model
- All research articles published in Impact Compass Journals are fully open access and are made freely available to read, download, and share immediately upon publication.
- The journal follows the “Gold” Open Access model, meaning the final published version of all articles is accessible without restrictions on the journal’s website.

## Licensing and Copyright
- Articles are published under an open license, typically the Creative Commons Attribution License (CC BY), which permits unrestricted use, distribution and reproduction in any medium, provided the original work is properly cited.
- Authors retain the copyright of their work, granting Impact Compass Journals a license to publish and distribute the article.
- Licensing terms are clearly indicated in each published article and on the journal website.

## Author Responsibilities and Rights
- Authors are encouraged to deposit their published articles in institutional or subject repositories (self-archiving, “Green” Open Access) in addition to publication on the journal website.
- Authors must ensure that their submissions do not infringe on copyright and that all co-authors have agreed to the publication and open-access terms.

## Article Processing Charges (APCs)
- To support open access, an Article Processing Charge (APC) may be required. APC that will be charged will be 60USD for African Authors and 150USD for Non African Authors.
- Authors are encouraged to include publication costs in funding applications, and Impact Compass Journals may offer support or waivers in cases of financial need.

## Data Sharing and Research Transparency
- Authors are encouraged to make the underlying data, materials, and protocols openly available in recognized repositories to enhance the transparency and reproducibility of research findings.
- Any restrictions on data availability must be disclosed at the time of submission and noted in the published article.

## Compliance and Advocacy
- Impact Compass Journals supports compliance with funder and institutional open-access mandates, including requirements for repository deposit and embargo periods, as applicable.
- The journal advocates open access and provides guidance to authors on meeting open-access requirements.

## Policy Review
This policy is regularly reviewed to ensure alignment with evolving best practices, funder requirements, and international standards in open access publishing.
Impact Compass Journals is dedicated to advancing open science and ensuring that research outputs are freely accessible to the global scholarly community, fostering innovation and collaboration, and the widest possible dissemination of knowledge.`,
  },

  indexing: {
    title: "Indexing",
    text: String.raw`To ensure that Impact Compass Journals achieves their goal of disseminating impactful research, we prioritize effective indexing practices. Indexing is essential because it makes academic papers discoverable; even the most groundbreaking research can be difficult to find if not correctly indexed. Online discovery is the primary way readers find articles, and this relies greatly on content discovery in various indexing and abstracting platforms.

## Why Indexing Matters
- **Increased Visibility:** Indexing helps a journal achieve its main purpose of being accessible to a wide audience.
- **Improved Reputation:** Accessibility, in turn, improves the journal’s reputation as a reliable source of high-quality information in its field. Journals that are indexed are believed to be of higher quality than those that are not.
- **Broader Readership:** Being indexed in well-known databases helps increase a journal’s readership because database research is the first activity researchers undertake as part of their study.

## Basic Indexing Standards
Impact Compass adheres to key publication requirements to ensure inclusion in academic indexes. These include:
- **ISSN:** Registering for an International Standard Serial Number (ISSN) is one of the first steps for journals. An ISSN is a persistent identifier for each title and offers a reliable way to distinguish one journal from another, as well as identifying the publishing organization.
- **DOIs:** Using Digital Object Identifiers (DOIs).
- **Publication Schedule:** Maintaining a defined publication schedule.
- **Copyright Policy:** Having a clear copyright policy.
- **Metadata:** Providing metadata at the article level. Ideally, all articles should include key fields in HTML meta tags and XML metadata

## Enhancing SEO for Greater Discoverability
To further improve the chances of Impact Compass Journals articles being found online, the journal employs Search Engine Optimisation (SEO) strategies. SEO helps improve the quantity of organic traffic to a website from search engines and helps content rank higher in search engine results pages (SERPs). When articles rank highly in search results, they’re more likely to be found, read, and cited. Key SEO practices include:
- **Rich Metadata:** Adding rich, machine-readable metadata to all articles. For content to appear in online search results, it must be accessible to human and machine readers.
- **Linked Citations:** Linking article citations to their sources, ideally using DOIs to ensure the links persist. The more links there are to related content, the better.
- **Sitemaps:** Adding published articles to a sitemap, which is a machine-readable list of a website’s most important pages. Sitemaps help search engines find new pages on websites and identify updates to old pages more quickly.

## The Indexing Process
To be indexed, Impact Compass Journals applies to selected databases, providing relevant documents and evidence. Each index has different criteria, but they generally check that the journal meets basic scholarly publishing standards. These may include checking that the journal has a clear scope, provides information on peer review, copyright, and ethics, has a clear editorial board page with names and titles, issues Digital Object Identifiers (DOIs), and publishes article-level metadata.

## Maintaining High Standards
Impact Compass Journals is committed to maintaining smooth and efficient journal processes to ensure eligibility for indexing. The process of getting indexed is similar to manuscript submission and peer review: journals submit their documents and wait for their application to be reviewed by the database.

## Archiving of Old Meta Data Policy
Many journals use archiving systems like LOCKSS and CLOCKSS to create distributed archives among participating libraries. These systems facilitate the creation of permanent archives of the journal for preservation and restoration purposes. Impact Compass Journals employ similar strategies for digital archiving to ensure long-term preservation. This involves archiving all published articles by following a policy of 'Long-term Preservation' in PKP/PN, as well as preserving articles in other Journal Repository. The journal also allows authors to deposit versions of their work in an institutional or other repository of their choice such as Academia and Research Gate.

## Repository Policy
Impact Compass Journals are committed to ensuring the long-term availability and accessibility of its published content. To achieve this, Impact Compass Journals implements a comprehensive repository policy.
- **Digital Archiving and Preservation:** Impact Compass Journals digitally preserves all published scholarly content. The journal submits metadata to LOCKSS and other repositories to ensure content remains available, even in case of data loss.
- **Authors Self Archiving:** Impact Compass Journals supports authors' rights to share their work. Authors can deposit pre-prints in any repository without embargo. Authors can deposit the accepted manuscript version (post-print) in their institution's repository or central repositories such as PubMed Central without any embargo period. Authors may also share the final published version or accepted version on personal websites or blogs immediately after publication. Proper attribution to the original publication on the Impact Compass Journals website is encouraged.

This policy aligns with open access principles, promoting broad sharing and adaptation of research while ensuring authors receive proper credit. All articles published in Impact Compass Journals are licensed under a Creative Commons Attribution (CC BY) license`,
  },
};

// ----- renderer -----
function policyEsc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function policyInline(str) {
  return policyEsc(str).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
function renderPolicyText(text) {
  const out = [];
  let list = null;
  const flush = () => {
    if (list) {
      out.push("<ul>" + list.join("") + "</ul>");
      list = null;
    }
  };
  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return flush();
    if (line.startsWith("## ")) {
      flush();
      out.push("<h4>" + policyInline(line.slice(3)) + "</h4>");
    } else if (line.startsWith("- ")) {
      (list = list || []).push("<li>" + policyInline(line.slice(2)) + "</li>");
    } else {
      flush();
      out.push("<p>" + policyInline(line) + "</p>");
    }
  });
  flush();
  return out.join("");
}

function ensurePolicyModal() {
  let ov = document.getElementById("policy-modal-overlay");
  if (ov) return ov;
  ov = document.createElement("div");
  ov.id = "policy-modal-overlay";
  ov.className = "modal-overlay policy-overlay";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-labelledby", "policy-modal-title");
  ov.innerHTML =
    '<div class="modal-box policy-modal">' +
    '<div class="modal-head"><h3 id="policy-modal-title"></h3>' +
    '<button type="button" class="modal-close-btn" aria-label="Close" onclick="closePolicy()">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
    "</button></div>" +
    '<div class="policy-body" id="policy-modal-body"></div>' +
    '<div class="modal-footer"><button type="button" class="btn-cancel" onclick="closePolicy()">Close</button></div>' +
    "</div>";
  ov.addEventListener("click", (e) => {
    if (e.target === ov) closePolicy();
  });
  document.body.appendChild(ov);
  return ov;
}

function openPolicy(id) {
  const doc = POLICY_DOCS[id];
  if (!doc) return;
  const ov = ensurePolicyModal();
  document.getElementById("policy-modal-title").textContent = doc.title;
  const body = document.getElementById("policy-modal-body");
  body.innerHTML = renderPolicyText(doc.text);
  body.scrollTop = 0;
  ov.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closePolicy() {
  const ov = document.getElementById("policy-modal-overlay");
  if (ov) ov.classList.remove("open");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePolicy();
});
