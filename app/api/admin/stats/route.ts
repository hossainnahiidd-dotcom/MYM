import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
      take: 5,
      select: { id: true, name: true, email: true, plan: true, role: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    usersByPlan: Object.fromEntries(usersByPlan.map((r) => [r.plan, r._count.plan])),
    totalClients,
    totalDebts,
    totalPaymentsAmount: totalPayments._sum.amount ?? 0,
    totalPaymentsCount: totalPayments._count,
    recentUsers,
  });
}
