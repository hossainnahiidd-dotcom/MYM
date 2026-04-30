import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { ExportButtons } from "@/components/dashboard/export-buttons";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const [debts, payments] = await Promise.all([
    prisma.debt.findMany({ where: { client: { userId } } }),
    prisma.payment.findMany({ where: { userId } }),
  ]);

  const totalDebt = debts.reduce((s, d) => s + d.amount, 0);
  const totalPaid = debts.reduce((s, d) => s + d.amountPaid, 0);
  const totalOutstanding = totalDebt - totalPaid;
  const recoveryRate = totalDebt > 0 ? ((totalPaid / totalDebt) * 100).toFixed(1) : "0";

  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const d of debts) {
    byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
    byCategory[d.category] = (byCategory[d.category] ?? 0) + (d.amount - d.amountPaid);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Financial summary and analytics</p>
        </div>
        <ExportButtons />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Debt Value", value: formatCurrency(totalDebt) },
          { label: "Total Collected", value: formatCurrency(totalPaid) },
          { label: "Outstanding", value: formatCurrency(totalOutstanding) },
          { label: "Recovery Rate", value: `${recoveryRate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Debts by Status</h2>
          <ul className="space-y-3">
            {Object.entries(byStatus).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{status}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </li>
            ))}
            {Object.keys(byStatus).length === 0 && (
              <p className="text-sm text-gray-400">No data available</p>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Outstanding by Category</h2>
          <ul className="space-y-3">
            {Object.entries(byCategory).map(([category, amount]) => (
              <li key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{category}</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</span>
              </li>
            ))}
            {Object.keys(byCategory).length === 0 && (
              <p className="text-sm text-gray-400">No data available</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
