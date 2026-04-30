import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().nullable().optional(),
  interestRate: z.number().min(0).optional(),
  lateFeeAmount: z.number().min(0).optional(),
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "WRITTEN_OFF"]).optional(),
  category: z.enum(["GENERAL", "RENT", "INVOICE", "LOAN", "SUBSCRIPTION", "SERVICE"]).optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;

  const existing = await prisma.debt.findFirst({ where: { id, client: { userId } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const updated = await prisma.debt.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;

  const existing = await prisma.debt.findFirst({ where: { id, client: { userId } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.debt.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
