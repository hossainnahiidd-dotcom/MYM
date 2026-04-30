import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InvoiceActions } from "@/components/dashboard/invoice-actions";

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     "bg-gray-100 text-gray-600",
  SENT:      "bg-blue-100 text-blue-700",
  VIEWED:    "bg-violet-100 text-violet-700",
  PAID:      "bg-emerald-100 text-emerald-700",
  OVERDUE:   "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-400",
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
    include: {
      client: true,
      items: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!invoice) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/invoices" className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{invoice.invoiceNo}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[invoice.status] ?? ""}`}>
                {invoice.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              {invoice.title} · {invoice.client.name}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <InvoiceActions
          invoiceId={invoice.id}
          status={invoice.status}
          clientEmail={invoice.client.email}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Invoice preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Invoice header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-white font-bold text-xl">MYM</h2>
                <p className="text-blue-200 text-xs mt-0.5">Monitor Your Money</p>
                <p className="text-blue-100 text-sm mt-3">{invoice.user.name}</p>
                <p className="text-blue-200 text-xs">{invoice.user.email}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">Invoice</p>
                <p className="text-white font-bold text-2xl font-mono mt-1">{invoice.invoiceNo}</p>
              </div>
            </div>
          </div>

          {/* Dates + client */}
          <div className="px-8 py-5 border-b border-gray-100 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Bill To</p>
              <p className="text-sm font-bold text-gray-900">{invoice.client.name}</p>
              {invoice.client.email && <p className="text-xs text-gray-500">{invoice.client.email}</p>}
              {invoice.client.phone && <p className="text-xs text-gray-500">{invoice.client.phone}</p>}
              {invoice.client.address && <p className="text-xs text-gray-400 mt-0.5">{invoice.client.address}</p>}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Issue Date</p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Due Date</p>
              <p className={`text-sm font-semibold ${invoice.status === "OVERDUE" ? "text-red-600" : "text-gray-900"}`}>
                {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
              </p>
            </div>
          </div>

          {/* Line items */}
          <div className="px-8 py-6">
            <p className="text-sm font-bold text-gray-900 mb-4">{invoice.title}</p>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Description</th>
                  <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Qty</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Unit Price</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-sm text-gray-700">{item.description}</td>
                    <td className="py-3 text-sm text-gray-500 text-center">{item.quantity}</td>
                    <td className="py-3 text-sm text-gray-500 text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                    <td className="py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-5 flex justify-end">
              <div className="w-60 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax ({invoice.taxRate}%)</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t-2 border-blue-600">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-blue-600">{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes / Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
                {invoice.notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm text-gray-600">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Payment Terms</p>
                    <p className="text-sm text-gray-500">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Status timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3">
              {[
                { label: "Created", date: invoice.createdAt, done: true },
                { label: "Sent to client", date: invoice.sentAt, done: !!invoice.sentAt },
                { label: "Paid", date: invoice.paidAt, done: !!invoice.paidAt },
              ].map(({ label, date, done }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-500" : "bg-gray-100"}`}>
                    {done && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${done ? "text-gray-900" : "text-gray-300"}`}>{label}</p>
                    {date && <p className="text-xs text-gray-400 mt-0.5">{formatDate(date)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Summary</h3>
            <div className="space-y-2.5">
              {[
                { label: "Total", value: formatCurrency(invoice.total, invoice.currency), bold: true },
                { label: "Items", value: String(invoice.items.length) },
                { label: "Currency", value: invoice.currency },
              ].map(({ label, value, bold }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className={`text-sm ${bold ? "font-bold text-blue-600" : "font-medium text-gray-900"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href={`/invoice/${invoice.id}/print`}
            target="_blank"
            className="flex items-center justify-center gap-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            View / Print Invoice
          </Link>
        </div>
      </div>
    </div>
  );
}
