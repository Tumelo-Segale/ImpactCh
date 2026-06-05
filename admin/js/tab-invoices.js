/* ============================================================
   Admin Tab — Invoices
   ============================================================ */

// Embedded logo for PDF (base64 PNG — reuse same constant from admin)
// This is set in admin-core as LOGO_DATA_URI when the page loads.
// We declare a fallback here so invoice PDF still works standalone.
if (typeof LOGO_DATA_URI === 'undefined') {
    window.LOGO_DATA_URI = '';
}

// ===== APPROVE MODAL =====
let _approvalSubId = null;

function openApproveModal(subId) {
    const subs = loadSubs();
    const sub  = subs.find(s => s.id === subId);
    if (!sub) return;
    const existing = loadInvoices().find(i => i.subId === subId);
    if (existing) {
        showConfirm('Invoice Already Exists', `Invoice ${existing.invoiceNum} was already issued. View it in the Invoices tab.`, () => showPage('invoices'), 'Go to Invoices');
        return;
    }
    _approvalSubId = subId;
    document.getElementById('approve-sub-title').textContent  = sub.title.length > 60 ? sub.title.slice(0,60)+'…' : sub.title;
    document.getElementById('approve-sub-author').textContent = sub.submittedByEmail || sub.authors || '';
    document.getElementById('approve-amount').value           = '';
    document.getElementById('approve-amount-error').style.display = 'none';
    document.getElementById('modal-approve').classList.add('open');
}

function confirmApproveModal() {
    const amtRaw = document.getElementById('approve-amount').value.trim();
    const amt    = parseFloat(amtRaw);
    const errEl  = document.getElementById('approve-amount-error');
    if (!amtRaw || isNaN(amt) || amt <= 0) {
        errEl.textContent = 'Please enter a valid amount greater than 0.';
        errEl.style.display = 'block';
        return;
    }
    errEl.style.display = 'none';
    closeModal('modal-approve');
    doApproveAndInvoice(_approvalSubId, amt);
    _approvalSubId = null;
}

function doApproveAndInvoice(subId, amount) {
    const subs = loadSubs();
    const sub  = subs.find(s => s.id === subId);
    if (!sub) return;
    const updated = subs.map(s => s.id === subId
        ? {...s, status:'Published', approvedAt: new Date().toISOString(), approvedBy: _currentAdmin ? _currentAdmin.name : 'Admin'}
        : s);
    saveSubs(updated);
    const invs       = loadInvoices();
    const invoiceNum = 'ICH-INV-' + String(invs.length+1).padStart(4,'0');
    const ps         = loadPaySettings();
    const ref        = sub.submittedByEmail || sub.authors || sub.id;
    const inv = {
        id: 'inv_'+Date.now(), invoiceNum, subId,
        title: sub.title, authors: sub.authors, journal: sub.journal,
        authorEmail: sub.submittedByEmail || '',
        issuedAt: new Date().toISOString(),
        amount, currency: 'ZAR', ref,
        payLink: ps.payLink||'', payLabel: ps.payLabel||'Pay Online',
        bankName: ps.bankName||'', accName: ps.accName||'',
        accNum: ps.accNum||'', branch: ps.branch||'', accType: ps.accType||''
    };
    invs.push(inv);
    saveInvoices(invs);
    refreshAll();
    renderInvoicesTable();
    showToast('Approved — Invoice '+invoiceNum+' generated');
    setTimeout(() => {
        const toEmail   = inv.authorEmail || '';
        const issueDate = new Date(inv.issuedAt).toLocaleDateString('en-ZA',{day:'2-digit',month:'long',year:'numeric'});
        const dueDate   = new Date(new Date(inv.issuedAt).getTime()+14*86400000).toLocaleDateString('en-ZA',{day:'2-digit',month:'long',year:'numeric'});
        const emailSubject = encodeURIComponent('Invoice '+invoiceNum+' — Publication Fee | Impact Compass Holdings');
        const emailBody = encodeURIComponent(
            'Dear '+(inv.authors||'Author')+',\r\n\r\n'+
            'Congratulations! Your manuscript has been approved for publication in '+(getJournalAbbr(inv.journal)||inv.journal)+'.\r\n\r\n'+
            'Please find your invoice details below:\r\n\r\n'+
            'Invoice Number: '+invoiceNum+'\r\n'+
            'Amount Due: R '+Number(amount).toFixed(2)+' (ZAR)\r\n'+
            'Issue Date: '+issueDate+'\r\n'+
            'Payment Due By: '+dueDate+'\r\n'+
            'Payment Reference: '+(inv.ref||toEmail)+'\r\n\r\n'+
            (ps.bankName ? 'Bank: '+ps.bankName+'\r\n'+(ps.accName?'Account Name: '+ps.accName+'\r\n':'')+(ps.accNum?'Account No: '+ps.accNum+'\r\n':'')+(ps.branch?'Branch Code: '+ps.branch+'\r\n':'')+(ps.accType?'Account Type: '+ps.accType+'\r\n':'')+'\r\n' : '')+
            (ps.payLink ? 'Pay Online: '+ps.payLink+'\r\n\r\n' : '')+
            '\u26a0 IMPORTANT: Payment must be received within 14 days ('+dueDate+'). '+
            'Failure to pay will result in the manuscript being automatically disregarded and deemed invalid.\r\n\r\n'+
            'Please attach the PDF invoice to this email before sending.\r\n\r\n'+
            'Kind regards,\r\nImpact Compass Holdings\r\nimpact@impactcompass.co.za | www.impactcompass.co.za'
        );
        if (toEmail) window.open('mailto:'+toEmail+'?subject='+emailSubject+'&body='+emailBody);
        showConfirm(
            'Invoice Generated'+(toEmail?' — Email Draft Opened':''),
            toEmail
                ? 'Invoice '+invoiceNum+' created. An email draft has been opened in your mail client. Download the PDF invoice to attach before sending.'
                : 'Invoice '+invoiceNum+' for R '+amount.toFixed(2)+' created. No author email on file — download the PDF to send manually.',
            () => downloadInvoicePDF(inv.id),
            'Download PDF'
        );
    }, 500);
}

function viewInvoice(subId) {
    const inv = loadInvoices().find(i => i.subId === subId);
    if (inv) viewInvoiceModal(inv.id);
    else showToast('No invoice found for this manuscript');
}

function renderInvoicesTable() {
    const tbody = document.getElementById('invoices-tbody');
    if (!tbody) return;
    const invs  = loadInvoices();
    const badge = document.getElementById('badge-invoices');
    if (badge) badge.textContent = invs.length;
    if (!invs.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem;">No invoices yet. Approve a manuscript to generate the first invoice.</td></tr>';
        return;
    }
    tbody.innerHTML = invs.slice().reverse().map(inv => `<tr>
        <td style="font-family:monospace;font-size:0.75rem;color:var(--accent);">${escHtml(inv.invoiceNum)}</td>
        <td><div class="td-title" style="max-width:180px;">${escHtml(inv.title.length>40?inv.title.slice(0,40)+'…':inv.title)}</div></td>
        <td style="font-size:0.78rem;color:var(--text-muted);">${escHtml(inv.authorEmail||'—')}</td>
        <td style="font-weight:700;color:#fff;">R ${Number(inv.amount||0).toFixed(2)}</td>
        <td style="font-size:0.75rem;color:var(--text-muted);">${fmtDate(inv.issuedAt)}</td>
        <td style="display:flex;gap:0.4rem;flex-wrap:wrap;">
            <button class="btn-sm btn-accent" style="padding:0.35rem 0.875rem;" onclick="downloadInvoicePDF('${inv.id}')">PDF</button>
            <button class="btn-sm btn-ghost"  style="padding:0.35rem 0.75rem;font-size:8px;" onclick="viewInvoiceModal('${inv.id}')">View</button>
        </td>
    </tr>`).join('');
}

function viewInvoiceModal(invId) {
    const inv = loadInvoices().find(i => i.id === invId);
    if (!inv) return;
    const body = document.getElementById('invoice-modal-body');
    if (!body) return;
    body.innerHTML = buildInvoiceHTML(inv, true);
    document.getElementById('modal-invoice').classList.add('open');
    document.getElementById('modal-invoice-dl-btn').onclick = () => downloadInvoicePDF(invId);
}

// ===== INVOICE HTML BUILDER =====
function buildInvoiceHTML(inv, forModal) {
    const fmtAmt    = fmtCurrency(inv.amount);
    const issueDate = new Date(inv.issuedAt).toLocaleDateString('en-ZA',{day:'2-digit',month:'long',year:'numeric'});
    const dueDate   = new Date(new Date(inv.issuedAt).getTime()+14*86400000).toLocaleDateString('en-ZA',{day:'2-digit',month:'long',year:'numeric'});
    const ps        = loadPaySettings();
    const bankName  = inv.bankName||ps.bankName||'';
    const accName   = inv.accName ||ps.accName ||'';
    const accNum    = inv.accNum  ||ps.accNum  ||'';
    const branch    = inv.branch  ||ps.branch  ||'';
    const accType   = inv.accType ||ps.accType ||'';
    const payLink   = inv.payLink ||ps.payLink ||'';
    const payLabel  = inv.payLabel||ps.payLabel||'Pay Online';
    const ref       = inv.authorEmail||inv.ref||'';
    const logo      = (typeof LOGO_DATA_URI !== 'undefined' && LOGO_DATA_URI) ? `<img src="${LOGO_DATA_URI}" alt="Impact Compass Holdings" style="height:52px;width:auto;display:block;background:transparent;" />` : '<strong style="font-size:1.1rem;color:#c19a6b;">IMPACT COMPASS HOLDINGS</strong>';
    return `
<div style="font-family:'Raleway',sans-serif;color:#1a1a1a;max-width:700px;margin:0 auto;padding:${forModal?'0':'2rem'}">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:1.5rem;border-bottom:3px solid #c19a6b;margin-bottom:1.25rem;">
    <div>${logo}<div style="font-size:0.7rem;color:#666;margin-top:0.5rem;line-height:1.6;">impact@impactcompass.co.za | www.impactcompass.co.za<br>R556 Lekgalong, Rustenburg, 0299, South Africa</div></div>
    <div style="text-align:right;">
      <div style="font-size:1.8rem;font-weight:800;letter-spacing:0.1em;color:#c19a6b;">INVOICE</div>
      <div style="font-size:0.85rem;font-weight:700;color:#333;margin-top:4px;">${escHtml(inv.invoiceNum)}</div>
      <div style="font-size:0.75rem;color:#777;margin-top:4px;">Issued: ${issueDate}</div>
      <div style="font-size:0.75rem;color:#b91c1c;font-weight:600;">Due: ${dueDate}</div>
    </div>
  </div>
  <div style="background:#fef9c3;border:1px solid #f59e0b;border-left:4px solid #b45309;padding:0.75rem 1rem;margin-bottom:1.25rem;font-size:0.78rem;color:#78350f;line-height:1.65;">
    <strong>\u26a0 IMPORTANT NOTICE:</strong> Payment must be received within <strong>14 days</strong>. Failure to pay will result in the manuscript being <strong style="color:#991b1b;">automatically disregarded and deemed invalid</strong>.
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem;">
    <div>
      <div style="font-size:8px;letter-spacing:0.25em;text-transform:uppercase;font-weight:700;color:#c19a6b;margin-bottom:0.4rem;">Bill To</div>
      <div style="font-size:0.88rem;font-weight:700;color:#111;">${escHtml(inv.authors||'Author')}</div>
      <div style="font-size:0.78rem;color:#555;">${escHtml(inv.authorEmail||'')}</div>
    </div>
    <div>
      <div style="font-size:8px;letter-spacing:0.25em;text-transform:uppercase;font-weight:700;color:#c19a6b;margin-bottom:0.4rem;">Manuscript</div>
      <div style="font-size:0.78rem;color:#333;line-height:1.5;">${escHtml(inv.title.length>70?inv.title.slice(0,70)+'\u2026':inv.title)}</div>
      <div style="font-size:0.72rem;color:#888;margin-top:2px;">Journal: ${escHtml(getJournalAbbr(inv.journal))}</div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">
    <thead><tr style="background:#f7f4f0;">
      <th style="text-align:left;padding:0.625rem 0.875rem;font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:#888;font-weight:700;">Description</th>
      <th style="text-align:right;padding:0.625rem 0.875rem;font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:#888;font-weight:700;">Amount (ZAR)</th>
    </tr></thead>
    <tbody><tr>
      <td style="padding:0.875rem;font-size:0.85rem;color:#222;border-bottom:1px solid #eee;">
        Article Processing / Publication Fee<br>
        <span style="font-size:0.72rem;color:#888;">Payment Reference: </span><strong style="color:#c19a6b;">${escHtml(ref)}</strong>
      </td>
      <td style="padding:0.875rem;font-size:0.85rem;font-weight:700;text-align:right;border-bottom:1px solid #eee;">${fmtAmt}</td>
    </tr></tbody>
    <tfoot><tr style="background:#f7f4f0;">
      <td style="padding:0.875rem;font-size:0.82rem;font-weight:700;text-align:right;color:#333;">Total Due (ZAR):</td>
      <td style="padding:0.875rem;font-size:1.1rem;font-weight:800;text-align:right;color:#c19a6b;">${fmtAmt}</td>
    </tr></tfoot>
  </table>
  <div style="border:1px solid #e8e0d4;padding:1.25rem;margin-bottom:1rem;">
    <div style="font-size:9px;letter-spacing:0.25em;text-transform:uppercase;font-weight:700;color:#c19a6b;margin-bottom:0.875rem;">Payment Options</div>
    ${payLink ? `<div style="margin-bottom:1rem;"><div style="font-size:0.78rem;font-weight:700;color:#333;margin-bottom:4px;">Online Payment</div><a href="${escHtml(payLink)}" style="display:inline-block;background:#c19a6b;color:#fff;padding:0.5rem 1.25rem;font-size:0.8rem;font-weight:700;text-decoration:none;">${escHtml(payLabel)}</a><div style="font-size:0.72rem;color:#888;margin-top:4px;">${escHtml(payLink)}</div></div>` : ''}
    ${bankName ? `<div><div style="font-size:0.78rem;font-weight:700;color:#333;margin-bottom:6px;">EFT / Bank Transfer</div><table style="font-size:0.78rem;color:#444;border-collapse:collapse;width:100%;"><tr><td style="padding:3px 1.25rem 3px 0;color:#888;width:130px;">Bank:</td><td style="font-weight:600;">${escHtml(bankName)}</td></tr>${accName?`<tr><td style="padding:3px 1.25rem 3px 0;color:#888;">Account Name:</td><td style="font-weight:600;">${escHtml(accName)}</td></tr>`:''} ${accNum?`<tr><td style="padding:3px 1.25rem 3px 0;color:#888;">Account No:</td><td style="font-weight:600;">${escHtml(accNum)}</td></tr>`:''} ${branch?`<tr><td style="padding:3px 1.25rem 3px 0;color:#888;">Branch Code:</td><td style="font-weight:600;">${escHtml(branch)}</td></tr>`:''} ${accType?`<tr><td style="padding:3px 1.25rem 3px 0;color:#888;">Account Type:</td><td style="font-weight:600;">${escHtml(accType)}</td></tr>`:''}<tr><td style="padding:3px 1.25rem 3px 0;color:#888;">Reference:</td><td style="font-weight:800;color:#c19a6b;">${escHtml(ref)}</td></tr></table></div>` : `<div style="font-size:0.78rem;color:#999;">Banking details not configured. Contact: impact@impactcompass.co.za</div>`}
  </div>
  <div style="background:#fef2f2;border:1px solid #fca5a5;padding:0.75rem 1rem;margin-bottom:0.75rem;font-size:0.76rem;color:#991b1b;line-height:1.6;text-align:center;font-weight:600;">
    \u26a0 Manuscripts with unpaid invoices after 14 days will be automatically disregarded and deemed invalid.
  </div>
  <div style="font-size:0.7rem;color:#aaa;border-top:1px solid #eee;padding-top:0.75rem;text-align:center;line-height:1.6;">
    Use your <strong style="color:#888;">email address</strong> as the payment reference. | Thank you for publishing with Impact Compass Holdings.
  </div>
</div>`;
}

// ===== PDF DOWNLOAD =====
function downloadInvoicePDF(invId) {
    const inv = loadInvoices().find(i => i.id === invId);
    if (!inv) { showToast('Invoice not found'); return; }
    const { jsPDF } = window.jspdf;
    if (!jsPDF) { showToast('PDF library not loaded'); return; }
    const doc  = new jsPDF({unit:'mm',format:'a4'});
    const W    = 210, M = 18;
    const gold = [193,154,107], dark=[20,20,23], mid=[100,100,100], light=[180,180,180], red=[185,28,28], warn=[120,53,15];
    const ps        = loadPaySettings();
    const bankName  = inv.bankName||ps.bankName||'';
    const accName   = inv.accName ||ps.accName ||'';
    const accNum    = inv.accNum  ||ps.accNum  ||'';
    const branch    = inv.branch  ||ps.branch  ||'';
    const accType   = inv.accType ||ps.accType ||'';
    const payLink   = inv.payLink ||ps.payLink ||'';
    const payLabel  = inv.payLabel||ps.payLabel||'Pay Online';
    const ref       = inv.authorEmail||inv.ref||'';
    const amtStr    = 'R '+Number(inv.amount||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');
    const issueDate = new Date(inv.issuedAt).toLocaleDateString('en-ZA',{day:'2-digit',month:'long',year:'numeric'});
    const dueDate   = new Date(new Date(inv.issuedAt).getTime()+14*86400000).toLocaleDateString('en-ZA',{day:'2-digit',month:'long',year:'numeric'});
    let y = M;
    doc.setFillColor(...gold); doc.rect(0,0,W,2.5,'F');
    try { doc.addImage(LOGO_DATA_URI,'PNG',M,y+1,55,16,undefined,'FAST'); }
    catch {
        doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...dark);
        doc.text('IMPACT COMPASS HOLDINGS',M,y+10);
    }
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...mid);
    doc.text('impact@impactcompass.co.za  |  www.impactcompass.co.za',M,y+20);
    doc.text('R556 Lekgalong, Rustenburg, 0299, South Africa',M,y+25);
    doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(...gold);
    doc.text('INVOICE',W-M,y+9,{align:'right'});
    doc.setFontSize(9); doc.setTextColor(...dark);
    doc.text(inv.invoiceNum,W-M,y+16,{align:'right'});
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...mid);
    doc.text('Issued: '+issueDate,W-M,y+22,{align:'right'});
    doc.setTextColor(...red);
    doc.text('Due: '+dueDate,W-M,y+28,{align:'right'});
    y += 35;
    doc.setDrawColor(...gold); doc.setLineWidth(0.5); doc.line(M,y,W-M,y); y+=5;
    doc.setFillColor(254,249,195); doc.rect(M,y,W-M*2,14,'F');
    doc.setDrawColor(245,158,11); doc.setLineWidth(0.4); doc.rect(M,y,W-M*2,14,'S');
    doc.setFillColor(180,83,9); doc.rect(M,y,2,14,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...warn);
    doc.text('\u26a0 IMPORTANT NOTICE:',M+4,y+5);
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...warn);
    const warnLines = doc.splitTextToSize('Payment must be received within 14 days of this invoice date ('+dueDate+'). Failure to pay will result in the manuscript being automatically disregarded and deemed invalid.',W-M*2-6);
    doc.text(warnLines,M+4,y+10); y+=18;
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...gold);
    doc.text('BILL TO',M,y); doc.text('MANUSCRIPT',W/2+2,y); y+=4;
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...dark);
    doc.text(inv.authors||'Author',M,y);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...mid);
    if (inv.authorEmail) doc.text(inv.authorEmail,M,y+5);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...dark);
    const titleLines = doc.splitTextToSize(inv.title||'',80);
    doc.text(titleLines.slice(0,3),W/2+2,y);
    doc.setTextColor(...mid);
    doc.text('Journal: '+getJournalAbbr(inv.journal),W/2+2,y+titleLines.slice(0,3).length*4+1); y+=22;
    doc.setFillColor(247,244,240); doc.rect(M,y,W-M*2,8,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...mid);
    doc.text('DESCRIPTION',M+3,y+5); doc.text('AMOUNT (ZAR)',W-M-3,y+5,{align:'right'}); y+=8;
    doc.setDrawColor(220,220,220); doc.setLineWidth(0.2); doc.line(M,y,W-M,y);
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...dark);
    doc.text('Article Processing / Publication Fee',M+3,y+6);
    doc.setFontSize(7); doc.setTextColor(...mid);
    doc.text('Payment Reference: ',M+3,y+11);
    doc.setFont('helvetica','bold'); doc.setTextColor(...gold);
    doc.text(ref,M+3+doc.getTextWidth('Payment Reference: '),y+11);
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...dark);
    doc.text(amtStr,W-M-3,y+6,{align:'right'}); y+=16;
    doc.line(M,y,W-M,y); y+=2;
    doc.setFillColor(247,244,240); doc.rect(M,y,W-M*2,10,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(80,80,80);
    doc.text('TOTAL DUE (ZAR):',W-M-38,y+6.5);
    doc.setFontSize(13); doc.setTextColor(...gold);
    doc.text(amtStr,W-M-3,y+7,{align:'right'}); y+=16;
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...gold);
    doc.text('PAYMENT OPTIONS',M,y); y+=4;
    doc.setDrawColor(...gold); doc.setLineWidth(0.3); doc.line(M,y,W-M,y); y+=4;
    if (payLink) {
        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...dark);
        doc.text('Online Payment:',M,y);
        doc.setFont('helvetica','normal'); doc.setTextColor(30,100,200);
        doc.text(payLink,M+32,y); y+=7;
    }
    if (bankName) {
        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...dark);
        doc.text('EFT / Bank Transfer:',M,y); y+=5;
        const rows = [
            ['Bank:',bankName],
            accName?['Account Name:',accName]:null,
            accNum?['Account No:',accNum]:null,
            branch?['Branch Code:',branch]:null,
            accType?['Account Type:',accType]:null,
            ['Reference:',ref]
        ].filter(Boolean);
        rows.forEach(([lbl,val]) => {
            doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...mid);
            doc.text(lbl,M+3,y);
            const isRef = lbl==='Reference:';
            doc.setFont('helvetica',isRef?'bold':'normal');
            doc.setTextColor(isRef?gold[0]:dark[0],isRef?gold[1]:dark[1],isRef?gold[2]:dark[2]);
            doc.text(val,M+42,y); y+=5;
        });
    }
    y+=2;
    const boxY = Math.min(y,255);
    doc.setFillColor(254,242,242); doc.rect(M,boxY,W-M*2,10,'F');
    doc.setDrawColor(252,165,165); doc.setLineWidth(0.3); doc.rect(M,boxY,W-M*2,10,'S');
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...red);
    doc.text('\u26a0 Manuscripts with unpaid invoices after 14 days will be automatically disregarded and deemed invalid.',W/2,boxY+6,{align:'center',maxWidth:W-M*2-4});
    doc.setFillColor(...gold); doc.rect(0,287,W,2,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...light);
    doc.text('Use your email address as the payment reference. | Thank you for publishing with Impact Compass Holdings.',W/2,284,{align:'center',maxWidth:W-M*2});
    doc.save('Invoice_'+inv.invoiceNum+'.pdf');
}
