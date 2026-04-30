import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "MYM <noreply@monitoryourmoney.com>";

export interface ReminderEmailData {
  to: string;
  clientName: string;
  debtTitle: string;
  amount: number;
  amountPaid: number;
  currency: string;
  dueDate?: Date | null;
  senderName: string;
  mode: "FRIENDLY" | "PROFESSIONAL" | "FINAL";
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
}

function buildEmailContent(data: ReminderEmailData) {
  const outstanding = data.amount - data.amountPaid;
  const formattedAmount = formatAmount(outstanding, data.currency);
  const dueStr = data.dueDate
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(data.dueDate))
    : null;

  const subjects: Record<string, string> = {
    FRIENDLY: `Friendly reminder: ${formattedAmount} outstanding`,
    PROFESSIONAL: `Payment reminder: ${data.debtTitle} — ${formattedAmount} due`,
    FINAL: `FINAL NOTICE: ${formattedAmount} overdue — ${data.debtTitle}`,
  };

  const intros: Record<string, string> = {
    FRIENDLY: `Just a quick friendly reminder that you have an outstanding balance with us.`,
    PROFESSIONAL: `This is a formal reminder that the following payment is outstanding on your account.`,
    FINAL: `Despite previous communications, we have not received the payment detailed below. This is your final notice before further action is taken.`,
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:${data.mode === "FINAL" ? "#dc2626" : "#1d4ed8"};padding:28px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">MYM</h1>
              <p style="margin:4px 0 0;color:${data.mode === "FINAL" ? "#fecaca" : "#bfdbfe"};font-size:13px;">Monitor Your Money</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Dear ${data.clientName},</p>
              <p style="margin:0 0 28px;color:#1e293b;font-size:15px;line-height:1.6;">${intros[data.mode]}</p>

              <!-- Debt summary box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;">Payment Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;">Description</td>
                        <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;text-align:right;">${data.debtTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;">Amount Paid</td>
                        <td style="padding:6px 0;color:#16a34a;font-size:14px;font-weight:600;text-align:right;">${formatAmount(data.amountPaid, data.currency)}</td>
                      </tr>
                      ${dueStr ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Due Date</td><td style="padding:6px 0;color:#1e293b;font-size:14px;text-align:right;">${dueStr}</td></tr>` : ""}
                      <tr>
                        <td style="padding:10px 0 6px;border-top:1px solid #e2e8f0;color:#1e293b;font-size:15px;font-weight:700;">Outstanding</td>
                        <td style="padding:10px 0 6px;border-top:1px solid #e2e8f0;color:#dc2626;font-size:18px;font-weight:800;text-align:right;">${formattedAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;color:#1e293b;font-size:14px;line-height:1.6;">
                Please arrange payment at your earliest convenience. If you have already made this payment, please disregard this notice.
              </p>

              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                Kind regards,<br>
                <strong style="color:#1e293b;">${data.senderName}</strong>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                Sent via <strong>MYM – Monitor Your Money</strong> · This is an automated payment reminder.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: subjects[data.mode], html };
}

export interface InvoiceEmailData {
  to: string;
  clientName: string;
  invoiceNo: string;
  title: string;
  items: { description: string; quantity: number; unitPrice: number; amount: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  issueDate: Date;
  dueDate?: Date | null;
  senderName: string;
  notes?: string | null;
  invoiceUrl: string;
}

export async function sendInvoiceEmail(data: InvoiceEmailData) {
  const fmt = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: data.currency }).format(n);
  const fmtDate = (d: Date) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));

  const itemRows = data.items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#1e293b;font-size:14px;">${item.description}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;text-align:right;">${fmt(item.unitPrice)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#1e293b;font-size:14px;font-weight:600;text-align:right;">${fmt(item.amount)}</td>
    </tr>`).join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1d4ed8;padding:28px 40px;">
            <table width="100%"><tr>
              <td><h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">MYM</h1>
              <p style="margin:2px 0 0;color:#bfdbfe;font-size:12px;">Monitor Your Money</p></td>
              <td style="text-align:right;">
                <p style="margin:0;color:#bfdbfe;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Invoice</p>
                <p style="margin:4px 0 0;color:#fff;font-size:18px;font-weight:700;">${data.invoiceNo}</p>
              </td>
            </tr></table>
          </td>
        </tr>
        <!-- Meta -->
        <tr>
          <td style="padding:24px 40px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
            <table width="100%"><tr>
              <td>
                <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Bill To</p>
                <p style="margin:0;color:#1e293b;font-size:15px;font-weight:700;">${data.clientName}</p>
              </td>
              <td style="text-align:right;">
                <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;">Issue Date: <strong style="color:#1e293b;">${fmtDate(data.issueDate)}</strong></p>
                ${data.dueDate ? `<p style="margin:0;color:#94a3b8;font-size:11px;">Due Date: <strong style="color:#dc2626;">${fmtDate(data.dueDate)}</strong></p>` : ""}
              </td>
            </tr></table>
          </td>
        </tr>
        <!-- Items -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 4px;color:#1e293b;font-size:16px;font-weight:700;">${data.title}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
              <thead>
                <tr style="border-bottom:2px solid #e2e8f0;">
                  <th style="text-align:left;padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;font-weight:600;">Description</th>
                  <th style="text-align:center;padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;font-weight:600;">Qty</th>
                  <th style="text-align:right;padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;font-weight:600;">Unit Price</th>
                  <th style="text-align:right;padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;font-weight:600;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
              <tr><td></td>
                <td style="width:220px;">
                  <table width="100%">
                    <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Subtotal</td><td style="text-align:right;color:#1e293b;font-size:13px;font-weight:600;">${fmt(data.subtotal)}</td></tr>
                    ${data.taxRate > 0 ? `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Tax (${data.taxRate}%)</td><td style="text-align:right;color:#1e293b;font-size:13px;font-weight:600;">${fmt(data.taxAmount)}</td></tr>` : ""}
                    <tr style="border-top:2px solid #1d4ed8;">
                      <td style="padding:10px 0 0;color:#1e293b;font-size:16px;font-weight:800;">Total</td>
                      <td style="padding:10px 0 0;text-align:right;color:#1d4ed8;font-size:20px;font-weight:800;">${fmt(data.total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            ${data.notes ? `<div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;"><p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;font-weight:600;">Notes</p><p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">${data.notes}</p></div>` : ""}
            <div style="margin-top:28px;text-align:center;">
              <a href="${data.invoiceUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:700;">View Invoice Online</a>
            </div>
          </td>
        </tr>
        <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">Sent by <strong>${data.senderName}</strong> via MYM – Monitor Your Money</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Invoice ${data.invoiceNo} – ${fmt(data.total)} due`,
    html,
  });
}

export async function sendReminderEmail(data: ReminderEmailData) {
  const { subject, html } = buildEmailContent(data);

  const result = await resend.emails.send({
    from: FROM,
    to: data.to,
    subject,
    html,
  });

  return result;
}
