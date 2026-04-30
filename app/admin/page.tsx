import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Users, CreditCard, TrendingUp, Activity } from "lucide-react";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  const [
    totalUsers,
    usersByPlan,
    totalClients,
    totalDebts,
    totalPayments,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["plan"], _count: { plan: true } }),
    prisma.client.count(),
    prisma.debt.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, plan: true, role: true, createdAt: true },
    }),
  ]);

  const planMap = Object.fromEntries(usersByPlan.map((r) => [r.plan, r._count.plan]));
  const totalRevenue = totalPayments._sum.amount ?? 0;

  const stats = [
    {
      label: "Total Users",
      value: totalUsers.toLocaleString(),
      sub: `${planMap.PRO ?? 0} Pro · ${planMap.ENTERPRISE ?? 0} Enterprise`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Clients",
      value: totalClients.toLocaleString(),
      sub: "Across all accounts",
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Total Debts",
      value: totalDebts.toLocaleString(),
      sub: "Tracked across platform",
      icon: CreditCard,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Total Collected",
      value: formatCurrency(totalRevenue),
      sub: `${totalPayments._count} payments`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  const planColors: Record<string, string> = {
    FREE: "bg-gray-100 text-gray-600",
    PRO: "bg-blue-100 text-blue-700",
    ENTERPRISE: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Platform-wide statistics and recent activity</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Plan breakdown + Recent signups */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Users by Plan</h2>
          <ul className="space-y-3">
            {(["FREE", "PRO", "ENTERPRISE"] as const).map((plan) => {
              const count = planMap[plan] ?? 0;
              const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
              return (
                <li key={plan} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planColors[plan]}`}>
                      {plan}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {count} <span className="text-gray-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Sign-ups</h2>
            <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-3">
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name ?? "—"}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${planColors[u.plan]}`}>
                    {u.plan}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(u.createdAt)}</span>
                </div>
              </li>
            ))}
            {recentUsers.length === 0 && (
              <p className="text-sm text-gray-400">No users yet.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
