/* ============================================================
   Impact Compass Holdings — Submissions, Dashboard & Contact
   ============================================================ */

// ===== FILE UPLOADS =====
let _stagedManuscript = [];
let _stagedSupp = [];

function handleFileChange(inputId, listId) {
    const input = document.getElementById(inputId);
    const listEl = document.getElementById(listId);
    const files = Array.from(input.files);
    if (inputId === 'manuscript-file') _stagedManuscript = files;
    if (inputId === 'supp-files') _stagedSupp = files;
    listEl.innerHTML = files.map(f => `
        <div class="file-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>${escapeHtml(f.name)}</span>
            <span style="margin-left:auto;color:var(--text-muted);font-size:0.7rem;">${(f.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>`).join('');
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, size: file.size, type: file.type, data: reader.result });
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// ===== SUBMISSIONS =====
function loadSubmissions() {
    try {
        const subs = JSON.parse(localStorage.getItem(LS_KEY)) || [];
        const legacyToNew = { 'Review': 'Submitted', 'Copyediting': 'Submitted', 'Production': 'Published' };
        return subs.map(s => legacyToNew[s.status] ? { ...s, status: legacyToNew[s.status] } : s);
    } catch { return []; }
}
function saveSubmissions(subs) { localStorage.setItem(LS_KEY, JSON.stringify(subs)); }

document.getElementById('submission-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!getCurrentUser()) { _pendingJournalView = 'submit'; openUserAuthModal(); return; }
    const fd = new FormData(this);
    const title = fd.get('title');
    if (!title || !title.trim()) return;
    showConfirm(
        'Submit Manuscript',
        `Your manuscript "${title.trim()}" will be submitted. Once reviewed and approved, an invoice will be sent to your email.`,
        async () => {
            let manuscriptFilesData = [], suppFilesData = [];
            try {
                manuscriptFilesData = await Promise.all(_stagedManuscript.map(readFileAsBase64));
                suppFilesData = await Promise.all(_stagedSupp.map(readFileAsBase64));
            } catch {
                manuscriptFilesData = _stagedManuscript.map(f => ({ name: f.name, size: f.size, type: f.type, data: null }));
                suppFilesData = _stagedSupp.map(f => ({ name: f.name, size: f.size, type: f.type, data: null }));
            }
            const user = getCurrentUser();
            const newSub = {
                id: Math.random().toString(36).substr(2, 9),
                title: fd.get('title').trim(),
                abstract: fd.get('abstract'),
                authors: fd.get('authors'),
                journal: fd.get('journal'),
                submittedByEmail: user ? user.email : 'anonymous',
                submittedByName: user ? user.firstName + ' ' + user.lastName : '',
                status: 'Submitted',
                submittedAt: new Date().toISOString(),
                manuscriptFiles: manuscriptFilesData,
                suppFiles: suppFilesData,
                reviews: []
            };
            try {
                const subs = loadSubmissions(); subs.unshift(newSub); saveSubmissions(subs);
            } catch {
                newSub.manuscriptFiles = _stagedManuscript.map(f => ({ name: f.name, size: f.size, type: f.type, data: null }));
                newSub.suppFiles = _stagedSupp.map(f => ({ name: f.name, size: f.size, type: f.type, data: null }));
                const subs = loadSubmissions(); subs.unshift(newSub); saveSubmissions(subs);
            }
            _stagedManuscript = []; _stagedSupp = [];
            document.getElementById('submission-form').reset();
            document.getElementById('manuscript-file-list').innerHTML = '';
            document.getElementById('supp-file-list').innerHTML = '';
            showSuccess('Manuscript Submitted', `Your manuscript "${newSub.title}" has been received. You will receive an invoice via email upon editorial approval.`);
            switchJournalView('dashboard');
        },
        'Submit'
    );
});

// ===== DASHBOARD =====
function renderDashboard() {
    const user = getCurrentUser();
    const allSubs = loadSubmissions();
    const subs = user ? allSubs.filter(s => !s.submittedByEmail || s.submittedByEmail === user.email) : allSubs;
    const el = document.getElementById('dashboard-content');
    if (subs.length === 0) {
        el.innerHTML = `<div class="empty-state">
            <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>No active submissions found.</p>
            <button class="link-btn" onclick="switchJournalView('submit')">Submit your first manuscript</button>
        </div>`;
        return;
    }
    el.innerHTML = `<div class="submissions-list">${subs.map((sub, idx) => buildSubmissionCard(sub, idx)).join('')}</div>`;
}

function buildSubmissionCard(sub, idx) {
    const canDownload = sub.status === 'Published';
    const fileInfo = sub.manuscriptFiles && sub.manuscriptFiles.length > 0
        ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.4rem;">📎 ${sub.manuscriptFiles.map(f => f.name || f).join(', ')}</div>` : '';

    const invoiceNotice = (() => {
        try {
            const invs = JSON.parse(localStorage.getItem('ich_invoices') || '[]');
            const inv = invs.find(i => i.subId === sub.id);
            if (!inv) return '';
            const dueDate = new Date(new Date(inv.issuedAt).getTime() + 14 * 86400000);
            const dueDateStr = dueDate.toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
            const isOverdue = Date.now() > dueDate.getTime();
            const amtStr = 'R\u202f' + Number(inv.amount || 0).toFixed(2);
            return `
            <div style="margin-top:0.875rem;border:1px solid ${isOverdue ? 'rgba(239,68,68,0.35)' : 'rgba(193,154,107,0.3)'};background:${isOverdue ? 'rgba(239,68,68,0.06)' : 'rgba(193,154,107,0.07)'};padding:1rem;">
                <div style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;color:${isOverdue ? '#f87171' : 'var(--accent)'};margin-bottom:0.5rem;">Invoice Issued — ${escapeHtml(inv.invoiceNum)}</div>
                <div style="font-size:0.82rem;color:#fff;font-weight:600;margin-bottom:0.3rem;">Amount Due: <span style="color:var(--accent);">${amtStr}</span></div>
                <div style="font-size:0.78rem;color:var(--text-dim);margin-bottom:0.75rem;">Payment reference: <strong style="color:#fff;">${escapeHtml(inv.authorEmail || sub.submittedByEmail || '')}</strong></div>
                <div style="font-size:0.78rem;padding:0.6rem 0.875rem;background:${isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.08)'};border-left:3px solid ${isOverdue ? '#ef4444' : '#f59e0b'};color:${isOverdue ? '#fca5a5' : '#fbbf24'};line-height:1.6;">
                    ${isOverdue
                        ? '<strong>⚠ OVERDUE:</strong> The 14-day payment window has passed. This manuscript is now <strong>disregarded and invalid</strong>.'
                        : `<strong>⚠ Payment due by ${escapeHtml(dueDateStr)}.</strong> If payment is not received within 14 days, this manuscript will be <strong>disregarded and invalid</strong>.`
                    }
                </div>
            </div>`;
        } catch { return ''; }
    })();

    return `<div class="glass-card submission-card">
        <div class="submission-head">
            <div>
                <div class="submission-journal">${escapeHtml(sub.journal)}</div>
                <div class="submission-title">${escapeHtml(sub.title)}</div>
                <div class="submission-authors">Authors: ${escapeHtml(sub.authors)}</div>
                ${fileInfo}
            </div>
            <div class="submission-id">ID: ${sub.id}</div>
        </div>
        ${invoiceNotice}
        <div class="submission-actions">
            <div class="action-links">
                <button class="action-btn" onclick="openContactEditor(${idx})">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Contact Editor
                </button>
            </div>
            ${canDownload
                ? `<button class="btn-primary" onclick="generateGalley(${idx})" style="font-size:10px;padding:0.75rem 1.5rem;gap:0.5rem;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download Galley PDF</button>`
                : `<div class="galley-pending">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Awaiting Editorial Approval</div>`}
        </div>
    </div>`;
}

// ===== CONTACT EDITOR =====
function openContactEditor(idx) {
    const subs = loadSubmissions();
    const sub = subs[idx];
    if (!sub) return;
    document.getElementById('ce-title').textContent = sub.title;
    document.getElementById('ce-subject').value = '';
    document.getElementById('ce-message').value = '';
    document.getElementById('modal-contact-editor').dataset.subId = sub.id;
    openModal('modal-contact-editor');
}

function sendEditorMessage() {
    const subject = document.getElementById('ce-subject').value.trim();
    const message = document.getElementById('ce-message').value.trim();
    if (!subject || !message) { showSuccess('Missing Information', 'Please provide both a subject and message.'); return; }
    const modal = document.getElementById('modal-contact-editor');
    const subId = modal.dataset.subId || '';
    const user = getCurrentUser();
    const subs = loadSubmissions();
    const sub = subs.find(s => s.id === subId);
    const inquiry = {
        name: user ? (user.firstName + ' ' + user.lastName) : 'Unknown User',
        email: user ? user.email : '',
        subject: 'Editor Inquiry — ' + subject + (sub ? ' [' + (sub.title || '').slice(0, 50) + ']' : ''),
        message: message + (sub ? '\n\n[Regarding manuscript: ' + sub.title + ']' : ''),
        date: new Date().toISOString(),
        read: false,
        type: 'editor_inquiry'
    };
    try {
        const existing = JSON.parse(localStorage.getItem('ich_contacts') || '[]');
        existing.unshift(inquiry);
        localStorage.setItem('ich_contacts', JSON.stringify(existing));
    } catch { }
    closeModal('modal-contact-editor');
    showSuccess('Message Sent', 'Your message has been sent to the editor. You can expect a response within 2–5 business days.');
}

// ===== GALLEY PDF =====
function generateGalley(idx) {
    const subs = loadSubmissions();
    const sub = subs[idx];
    if (!sub) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFillColor(193, 154, 107); doc.rect(0, 0, 210, 12, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(5, 5, 6);
    doc.text('IMPACT COMPASS JOURNALS — GALLEY PROOF', 10, 8);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(193, 154, 107);
    doc.text(sub.journal, 10, 28);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(20); doc.setTextColor(20, 20, 20);
    const titleLines = doc.splitTextToSize(sub.title, 180);
    doc.text(titleLines, 10, 40);
    const titleEnd = 40 + titleLines.length * 10;
    doc.setFontSize(12); doc.setTextColor(80, 80, 80);
    doc.text(`Authors: ${sub.authors}`, 10, titleEnd + 8);
    doc.setFontSize(10);
    const d = new Date();
    doc.text(`Published On: ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 10, titleEnd + 18);
    doc.setDrawColor(193, 154, 107); doc.setLineWidth(0.5); doc.line(10, titleEnd + 26, 200, titleEnd + 26);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(20, 20, 20);
    doc.text('Abstract', 10, titleEnd + 38);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(90, 90, 90);
    const absLines = doc.splitTextToSize(sub.abstract || '', 180);
    doc.text(absLines, 10, titleEnd + 50);
    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text('© 2026 Impact Compass Holdings. All articles indexed in Google Scholar.', 10, 280);
    const safeTitle = sub.title.replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').slice(0, 60);
    doc.save(`${safeTitle}.pdf`);
}

// ===== CONTACT FORM =====
function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const contact = {
        name: fd.get('name') || '', email: fd.get('email') || '',
        subject: fd.get('subject') || 'General Inquiry', message: fd.get('message') || '',
        date: new Date().toISOString(), read: false
    };
    try {
        const existing = JSON.parse(localStorage.getItem('ich_contacts') || '[]');
        existing.unshift(contact);
        localStorage.setItem('ich_contacts', JSON.stringify(existing));
    } catch { }
    form.reset();
    showSuccess('Message Sent', "Thank you for reaching out. We'll be in touch soon.");
}
