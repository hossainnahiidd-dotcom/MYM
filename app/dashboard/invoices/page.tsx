import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Plus, FileText, ArrowUpRight, Send, CheckCircle2,
  Clock, AlertCircle, XCircle, TrendingUp, TrendingDown,
} from "lucide-react";
import { InvoicePaidToggle } from "@/components/dashboard/invoice-paid-toggle";

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     "bg-gray-50 text-gray-500 border border-gray-200",
  SENT:      "bg-blue-50 text-blue-700 border border-blue-100",
  VIEWED:    "bg-violet-50 text-violet-700 border border-violet-100",
  PAID:      "bg-emerald-50 text-emerald-700 border border-emerald-100",
  OVERDUE:   "bg-red-50 text-red-700 border border-red-100",
  CANCELLED: "bg-gray-50 text-gray-400 border border-gray-100",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  DRAFT: Clock, SENT: Send, VIEWED: ArrowUpRight,
  PAID: CheckCircle2, OVERDUE: AlertCircle, CANCELLED: XCircle,
};

type Tab = "all" | "unpaid" | "paid" | "overdue";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const { tab: rawTab } = await searchParams;
  const tab = (rawTab ?? "all") as Tab;

  const allInvoices = await prisma.invoice.findMany({
    where: { userId },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Counts for tab badges
  const unpaidInvoices  = allInvoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED");
  const paidInvoices    = allInvoices.filter((i) => i.status === "PAID");
  const overdueInvoices = allInvoices.filter((i) => i.status === "OVERDUE");

  const filtered =
    tab === "unpaid"  ? unpaidInvoices  :
    tab === "paid"    ? paidInvoices    :
    tab === "overdue" ? overdueInvoices :
    allInvoices;

  // Summary stats (always based on all invoices)
  const totalInvoiced    = allInvoices.reduce((s, i) => s + i.total, 0);
  const totalPaid        = paidInvoices.reduce((s, i) => s + i.total, 0);
  const totalOutstanding = unpaidInvoices.reduce((s, i) => s + i.total, 0);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all",     label: "All",     count: allInvoices.length },
    { key: "unpaid",  label: "Unpaid",  count: unpaidInvoices.length },
    { key: "paid",    label: "Paid",    count: paidInvoices.length },
    { key: "overdue", label: "Overdue", count: overdueInvoices.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage and track all your client invoices
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      {/* Summary cards */}
      {allInvoices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Invoiced",
              value: formatCurrency(totalInvoiced),
              sub: `${allInvoices.length} invoices`,
              icon: FileText,
              color: "text-gray-900",
              iconBg: "bg-gray-100",
              iconColor: "text-gray-500",
            },
            {
              label: "Collected",
              value: formatCurrency(totalPaid),
              sub: `${paidInvoices.length} paid`,
              icon: TrendingUp,
              color: "text-emerald-700",
              iconBg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
            {
              label: "Outstanding",
              value: formatCurrency(totalOutstanding),
              sub: `${unpaidInvoices.length} unpaid`,
              icon: TrendingDown,
              color: "text-red-600",
              iconBg: "bg-red-50",
              iconColor: "text-red-500",
            },
            {
              label: "Overdue",
              value: String(overdueInvoices.length),
              sub: overdueInvoices.length > 0 ? "Needs attention" : "All on time",
              icon: AlertCircle,
              color: overdueInvoices.length > 0 ? "text-red-600" : "text-gray-400",
              iconBg: overdueInvoices.length > 0 ? "bg-red-50" : "bg-gray-50",
              iconColor: overdueInvoices.length > 0 ? "text-red-500" : "text-gray-300",
            },
          ].map(({ label, value, sub, icon: Icon, color, iconBg, iconColor }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {allInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No invoices yet</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Create professional invoices and send them directly to your clients.
          </p>
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Create First Invoice
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-5 pt-4 border-b border-gray-100">
            {tabs.map(({ key, label, count }) => {
              const active = tab === key;
              return (
                <Link
                  key={key}
                  href={`/dashboard/invoices?tab=${key}`}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition whitespace-nowrap ${
                    active
                      ? "border-blue-600 text-blue-700 bg-blue-50/50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${
                    active
                      ? "bg-blue-600 text-white"
                      : key === "overdue" && count > 0
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-600">
                {tab === "unpaid" ? "No unpaid invoices — all collected!" :
                 tab === "overdue" ? "No overdue invoices." :
                 "No invoices in this category."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">Invoice #</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Client</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Title</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Total</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">Due Date</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">Payment</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((inv) => {
                    const Icon = STATUS_ICON[inv.status] ?? Clock;
                    const isOverdue = inv.status === "OVERDUE";
                    const isPaid = inv.status === "PAID";
                    return (
                      <tr
                        key={inv.id}
                        className={`transition group ${
                          isOverdue ? "bg-red-50/20 hover:bg-red-50/40" :
                          isPaid    ? "bg-emerald-50/10 hover:bg-emerald-50/30" :
                          "hover:bg-blue-50/20"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-blue-600 font-mono">{inv.invoiceNo}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {inv.client.name[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{inv.client.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 max-w-[160px]">
                          <p className="text-sm text-gray-600 truncate">{inv.title}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-bold tabular-nums ${isPaid ? "text-emerald-600" : "text-gray-900"}`}>
                            {formatCurrency(inv.total, inv.currency)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs whitespace-nowrap">
                          {inv.dueDate ? (
                            <span className={isOverdue ? "text-red-500 font-semibold" : "text-gray-400"}>
                              {formatDate(inv.dueDate)}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${STATUS_STYLE[inv.status] ?? ""}`}>
                            <Icon className="w-3 h-3" />
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <InvoicePaidToggle
                            invoiceId={inv.id}
                            isPaid={isPaid}
                            paidAt={inv.paidAt}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/dashboard/invoices/${inv.id}`}
                            className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-800 transition opacity-0 group-hover:opacity-100 whitespace-nowrap"
                          >
                            Open <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
