import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, AlertCircle, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { GrowthChart } from "@/components/dashboard/growth-chart";
import { DebtStatusChart } from "@/components/dashboard/debt-status-chart";
import Link from "next/link";

function getLast6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleDateString("en-GB", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return months;
}

async function getDashboardData(userId: string) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [clients, debts, recentPayments, allPayments] = await Promise.all([
    prisma.client.count({ where: { userId } }),
    prisma.debt.findMany({
      where: { client: { userId } },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { paidAt: "desc" },
      take: 6,
      include: { client: { select: { name: true } }, debt: { select: { title: true } } },
    }),
    prisma.payment.findMany({
      where: { userId, paidAt: { gte: sixMonthsAgo } },
      select: { amount: true, paidAt: true },
    }),
  ]);

  const totalOwed = debts
    .filter((d) => d.status !== "PAID" && d.status !== "WRITTEN_OFF")
    .reduce((s, d) => s + (d.amount - d.amountPaid), 0);

  const totalPaid = debts.reduce((s, d) => s + d.amountPaid, 0);

  const overdue = debts.filter(
    (d) => d.status === "OVERDUE" || (d.dueDate && new Date(d.dueDate) < new Date() && d.status !== "PAID")
  );

  const upcoming = debts.filter(
    (d) =>
      d.dueDate &&
      new Date(d.dueDate) > new Date() &&
      new Date(d.dueDate) < new Date(Date.now() + 7 * 86400000) &&
      d.status !== "PAID"
  );

  // Build monthly chart data
  const months = getLast6Months();
  const chartData = months.map(({ label, year, month }) => {
    const collected = allPayments
      .filter((p) => {
        const d = new Date(p.paidAt);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((s, p) => s + p.amount, 0);

    const outstanding = debts
      .filter((d) => {
        const created = new Date(d.createdAt);
        return created.getFullYear() <= year && created.getMonth() <= month && d.status !== "PAID";
      })
      .reduce((s, d) => s + (d.amount - d.amountPaid), 0);

    return { month: label, collected, outstanding };
  });

  // Debt status distribution
  const statusCount: Record<string, number> = {};
  for (const d of debts) {
    statusCount[d.status] = (statusCount[d.status] ?? 0) + 1;
  }

  const statusColors: Record<string, string> = {
    PENDING: "#f59e0b",
    PARTIAL: "#3b82f6",
    PAID: "#22c55e",
    OVERDUE: "#ef4444",
    WRITTEN_OFF: "#94a3b8",
  };

  const debtStatusData = Object.entries(statusCount).map(([name, value]) => ({
    name,
    value,
    color: statusColors[name] ?? "#cbd5e1",
  }));

  return { clients, debts, recentPayments, totalOwed, totalPaid, overdue, upcoming, chartData, debtStatusData };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userName = session?.user?.name?.split(" ")[0] ?? "there";

  const { clients, debts, recentPayments, totalOwed, totalPaid, overdue, upcoming, chartData, debtStatusData } =
    await getDashboardData(userId);

  const recoveryRate = (totalOwed + totalPaid) > 0
    ? ((totalPaid / (totalOwed + totalPaid)) * 100).toFixed(0)
    : "0";

  const stats = [
    {
      label: "Total Outstanding",
      value: formatCurrency(totalOwed),
      sub: `${debts.filter((d) => d.status !== "PAID" && d.status !== "WRITTEN_OFF").length} active debts`,
      icon: TrendingDown,
      trend: "down",
      accent: "from-red-500 to-rose-600",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      label: "Total Collected",
      value: formatCurrency(totalPaid),
      sub: `${recentPayments.length} recent payments`,
      icon: TrendingUp,
      trend: "up",
      accent: "from-emerald-500 to-green-600",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Recovery Rate",
      value: `${recoveryRate}%`,
      sub: "Paid vs total debt",
      icon: ArrowUpRight,
      trend: "up",
      accent: "from-blue-500 to-indigo-600",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Active Clients",
      value: String(clients),
      sub: `${overdue.length} overdue · ${upcoming.length} due soon`,
      icon: Users,
      trend: "neutral",
      accent: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good morning, {userName} 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's what's happening with your finances today.</p>
        </div>
        <Link
          href="/dashboard/debts/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-600/20"
        >
          <TrendingUp className="w-4 h-4" />
          New Debt
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recovery Trend</h2>
              <p className="text-xs text-gray-400 mt-0.5">Collections vs outstanding over 6 months</p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl font-medium">
              Last 6 months
            </span>
          </div>
          <GrowthChart data={chartData} />
        </div>

        {/* Debt Status Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="mb-1">
            <h2 className="text-base font-bold text-gray-900">Debt Status</h2>
            <p className="text-xs text-gray-400 mt-0.5">Breakdown by current status</p>
          </div>
          <DebtStatusChart data={debtStatusData} />
          <div className="mt-2 pt-3 border-t border-gray-50 flex justify-between text-xs text-gray-500">
            <span>{debts.length} total debts</span>
            <span className="text-emerald-600 font-semibold">
              {debts.filter((d) => d.status === "PAID").length} paid
            </span>
          </div>
        </div>
      </div>

      {/* Recent payments + Overdue */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent Payments */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Recent Payments</h2>
            <Link href="/dashboard/reports" className="text-xs text-blue-600 font-medium hover:underline">
              View all →
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-gray-400">No payments recorded yet.</p>
              <Link href="/dashboard/debts/new" className="text-sm text-blue-600 font-medium mt-2 block hover:underline">
                Add your first debt
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs">
                      {p.client.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.client.name}</p>
                      <p className="text-xs text-gray-400">{p.debt.title} · {formatDate(p.paidAt)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 tabular-nums">
                    +{formatCurrency(p.amount, p.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Alert / Due Soon */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">
              {overdue.length > 0 ? "Overdue Debts" : "Due This Week"}
            </h2>
            {overdue.length > 0 && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                {overdue.length} overdue
              </span>
            )}
          </div>

          {overdue.length === 0 && upcoming.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm text-gray-500 font-medium">All up to date!</p>
              <p className="text-xs text-gray-400 mt-1">No overdue or upcoming debts.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(overdue.length > 0 ? overdue : upcoming).slice(0, 4).map((d) => (
                <Link
                  key={d.id}
                  href={`/dashboard/debts/${d.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-red-100 hover:bg-red-50/30 transition group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{d.client.name}</p>
                    <p className="text-xs text-gray-400 truncate">{d.title}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-bold text-red-600 tabular-nums">
                      {formatCurrency(d.amount - d.amountPaid, d.currency)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {d.dueDate ? formatDate(d.dueDate) : "No due date"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
