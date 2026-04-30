import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "debts";

  if (type === "payments") {
    const payments = await prisma.payment.findMany({
      where: { userId },
      include: {
        client: { select: { name: true } },
        debt: { select: { title: true } },
      },
      orderBy: { paidAt: "desc" },
    });

    const rows = [
      ["Date", "Client", "Debt", "Amount", "Currency", "Method", "Reference", "Notes"],
      ...payments.map((p) => [
        new Date(p.paidAt).toISOString().split("T")[0],
        p.client.name,
        p.debt.title,
        p.amount.toFixed(2),
        p.currency,
        p.method,
        p.reference ?? "",
        p.notes ?? "",
      ]),
    ];

    const csv = rows.map((r) => r.map(escapeCSV).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="mym-payments-${Date.now()}.csv"`,
      },
    });
  }

  const debts = await prisma.debt.findMany({
    where: { client: { userId } },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    ["Client", "Title", "Category", "Amount", "Paid", "Outstanding", "Currency", "Status", "Due Date", "Created"],
    ...debts.map((d) => [
      d.client.name,
      d.title,
      d.category,
      d.amount.toFixed(2),
      d.amountPaid.toFixed(2),
      (d.amount - d.amountPaid).toFixed(2),
      d.currency,
      d.status,
      d.dueDate ? new Date(d.dueDate).toISOString().split("T")[0] : "",
      new Date(d.createdAt).toISOString().split("T")[0],
    ]),
  ];

  const csv = rows.map((r) => r.map(escapeCSV).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="mym-debts-${Date.now()}.csv"`,
    },
  });
}
