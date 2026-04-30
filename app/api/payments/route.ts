import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  debtId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(["MANUAL", "STRIPE", "BANK_TRANSFER", "CASH", "CHEQUE"]).default("MANUAL"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const debt = await prisma.debt.findFirst({
      where: { id: data.debtId, client: { userId } },
    });
    if (!debt) return NextResponse.json({ error: "Debt not found" }, { status: 404 });

    const newAmountPaid = debt.amountPaid + data.amount;
    const newStatus =
      newAmountPaid >= debt.amount
        ? "PAID"
        : newAmountPaid > 0
        ? "PARTIAL"
        : debt.status;

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          debtId: data.debtId,
          clientId: debt.clientId,
          userId,
          amount: data.amount,
          method: data.method,
          reference: data.reference || null,
          notes: data.notes || null,
          paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
        },
      }),
      prisma.debt.update({
        where: { id: data.debtId },
        data: { amountPaid: newAmountPaid, status: newStatus },
      }),
    ]);

    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
