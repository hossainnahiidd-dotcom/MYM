import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, getDebtStatusColor } from "@/lib/utils";
import Link from "next/link";
import { Plus, CreditCard, ArrowUpRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PENDING:     "bg-amber-50 text-amber-700 border border-amber-100",
  PARTIAL:     "bg-blue-50 text-blue-700 border border-blue-100",
  PAID:        "bg-emerald-50 text-emerald-700 border border-emerald-100",
  OVERDUE:     "bg-red-50 text-red-700 border border-red-100",
  WRITTEN_OFF: "bg-gray-50 text-gray-500 border border-gray-100",
};

export default async function DebtsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const debts = await prisma.debt.findMany({
    where: { client: { userId } },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalOutstanding = debts
    .filter((d) => d.status !== "PAID" && d.status !== "WRITTEN_OFF")
    .reduce((s, d) => s + (d.amount - d.amountPaid), 0);

  const overdueCount = debts.filter((d) => d.status === "OVERDUE").length;
  const paidCount = debts.filter((d) => d.status === "PAID").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Debts</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            <span className="text-red-500 font-semibold">{formatCurrency(totalOutstanding)}</span> outstanding ·{" "}
            {overdueCount > 0 && <span className="text-red-400 font-medium">{overdueCount} overdue · </span>}
            {paidCount} paid · {debts.length} total
          </p>
        </div>
        <Link
          href="/dashboard/debts/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Debt
        </Link>
      </div>

      {debts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CreditCard className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No debts recorded</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Start tracking what people owe you.
          </p>
          <Link
            href="/dashboard/debts/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add First Debt
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex-1">
              {debts.length} Records
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  {["Client", "Title", "Progress", "Amount", "Outstanding", "Due Date", "Status", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {debts.map((debt) => {
                  const outstanding = debt.amount - debt.amountPaid;
                  const progress = Math.min((debt.amountPaid / debt.amount) * 100, 100);
                  const isOverdue = debt.status === "OVERDUE";

                  return (
                    <tr key={debt.id} className={`hover:bg-blue-50/20 transition group ${isOverdue ? "bg-red-50/20" : ""}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {debt.client.name[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{debt.client.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-[160px]">
                        <p className="text-sm text-gray-700 font-medium truncate">{debt.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{debt.category}</p>
                      </td>
                      <td className="px-5 py-4 w-28">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${progress >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{progress.toFixed(0)}% paid</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(debt.amount, debt.currency)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold tabular-nums ${outstanding > 0 ? "text-red-500" : "text-emerald-600"}`}>
                          {formatCurrency(outstanding, debt.currency)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 font-medium whitespace-nowrap">
                        {debt.dueDate ? formatDate(debt.dueDate) : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${STATUS_COLORS[debt.status] ?? ""}`}>
                          {debt.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/debts/${debt.id}`}
                          className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-800 transition opacity-0 group-hover:opacity-100 whitespace-nowrap"
                        >
                          View <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
