import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
}

function fmtDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));
}

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      items: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!invoice) notFound();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{invoice.invoiceNo} – MYM Invoice</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { max-width: 800px; margin: 40px auto; background: #fff; box-shadow: 0 4px 32px rgba(0,0,0,.08); border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1d4ed8, #4338ca); padding: 40px 48px; display: flex; justify-content: space-between; align-items: flex-start; }
          .header-left h1 { color: #fff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
          .header-left p { color: #bfdbfe; font-size: 12px; margin-top: 3px; }
          .header-left .from { color: #e0e7ff; font-size: 13px; margin-top: 20px; line-height: 1.6; }
          .header-right { text-align: right; }
          .header-right .label { color: #93c5fd; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
          .header-right .inv-no { color: #fff; font-size: 26px; font-weight: 800; font-family: monospace; margin-top: 4px; }
          .status-badge { display: inline-block; padding: 4px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; margin-top: 10px; }
          .status-PAID { background: #d1fae5; color: #065f46; }
          .status-SENT { background: #dbeafe; color: #1e40af; }
          .status-DRAFT { background: #f1f5f9; color: #475569; }
          .status-OVERDUE { background: #fee2e2; color: #991b1b; }
          .status-CANCELLED { background: #f1f5f9; color: #94a3b8; }
          .meta { padding: 28px 48px; border-bottom: 1px solid #f1f5f9; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; background: #f8fafc; }
          .meta-block label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; display: block; margin-bottom: 6px; }
          .meta-block p { font-size: 14px; font-weight: 600; color: #1e293b; line-height: 1.5; }
          .meta-block .sub { font-size: 12px; color: #64748b; font-weight: 400; }
          .body { padding: 36px 48px; }
          .title { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; }
          thead tr { border-bottom: 2px solid #e2e8f0; }
          thead th { text-align: left; padding: 10px 0; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; }
          thead th.r { text-align: right; }
          thead th.c { text-align: center; }
          tbody tr { border-bottom: 1px solid #f8fafc; }
          tbody td { padding: 12px 0; font-size: 14px; color: #1e293b; }
          tbody td.r { text-align: right; font-weight: 600; }
          tbody td.c { text-align: center; color: #64748b; }
          tbody td.sub { color: #64748b; font-size: 13px; }
          .totals { margin-top: 20px; display: flex; justify-content: flex-end; }
          .totals-box { width: 260px; }
          .totals-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 14px; }
          .totals-row span:first-child { color: #64748b; }
          .totals-row span:last-child { font-weight: 600; color: #1e293b; }
          .totals-total { display: flex; justify-content: space-between; padding: 12px 0 0; margin-top: 6px; border-top: 2px solid #1d4ed8; }
          .totals-total span:first-child { font-size: 16px; font-weight: 800; color: #1e293b; }
          .totals-total span:last-child { font-size: 22px; font-weight: 800; color: #1d4ed8; }
          .notes { margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .note-block label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; display: block; margin-bottom: 6px; }
          .note-block p { font-size: 13px; color: #64748b; line-height: 1.6; }
          .footer { background: #f8fafc; padding: 20px 48px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
          .print-btn { position: fixed; bottom: 32px; right: 32px; background: #1d4ed8; color: #fff; border: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 20px rgba(29,78,216,.4); transition: background .15s; }
          .print-btn:hover { background: #1e40af; }
          @media print {
            body { background: #fff; }
            .page { box-shadow: none; margin: 0; border-radius: 0; max-width: 100%; }
            .print-btn { display: none; }
          }
        `}</style>
      </head>
      <body>
        <div className="page">
          {/* Header */}
          <div className="header">
            <div className="header-left">
              <h1>MYM</h1>
              <p>Monitor Your Money</p>
              <div className="from">
                <strong>{invoice.user.name}</strong><br />
                {invoice.user.email}
              </div>
            </div>
            <div className="header-right">
              <div className="label">Invoice</div>
              <div className="inv-no">{invoice.invoiceNo}</div>
              <div className={`status-badge status-${invoice.status}`}>{invoice.status}</div>
            </div>
          </div>

          {/* Meta */}
          <div className="meta">
            <div className="meta-block">
              <label>Bill To</label>
              <p>{invoice.client.name}</p>
              {invoice.client.email && <p className="sub">{invoice.client.email}</p>}
              {invoice.client.phone && <p className="sub">{invoice.client.phone}</p>}
              {invoice.client.address && <p className="sub">{invoice.client.address}</p>}
            </div>
            <div className="meta-block">
              <label>Issue Date</label>
              <p>{fmtDate(invoice.issueDate)}</p>
            </div>
            <div className="meta-block">
              <label>Due Date</label>
              <p style={{ color: invoice.status === "OVERDUE" ? "#dc2626" : undefined }}>
                {invoice.dueDate ? fmtDate(invoice.dueDate) : "—"}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="body">
            <div className="title">{invoice.title}</div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="c">Qty</th>
                  <th className="r">Unit Price</th>
                  <th className="r">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td className="c sub">{item.quantity}</td>
                    <td className="r sub">{fmt(item.unitPrice, invoice.currency)}</td>
                    <td className="r">{fmt(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="totals">
              <div className="totals-box">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span>{fmt(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.taxRate > 0 && (
                  <div className="totals-row">
                    <span>Tax ({invoice.taxRate}%)</span>
                    <span>{fmt(invoice.taxAmount, invoice.currency)}</span>
                  </div>
                )}
                <div className="totals-total">
                  <span>Total</span>
                  <span>{fmt(invoice.total, invoice.currency)}</span>
                </div>
                {invoice.paidAt && (
                  <div className="totals-row" style={{ color: "#16a34a", fontWeight: 700, marginTop: 8 }}>
                    <span>✓ Paid on {fmtDate(invoice.paidAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="notes">
                {invoice.notes && (
                  <div className="note-block">
                    <label>Notes</label>
                    <p>{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div className="note-block">
                    <label>Payment Terms</label>
                    <p>{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="footer">
            Generated by <strong>MYM – Monitor Your Money</strong> · {invoice.invoiceNo}
          </div>
        </div>

        <button className="print-btn" onClick={() => window.print()}>
          🖨 Print / Save PDF
        </button>
        <script dangerouslySetInnerHTML={{ __html: `
          document.querySelector('.print-btn').addEventListener('click', () => window.print());
        ` }} />
      </body>
    </html>
  );
}
