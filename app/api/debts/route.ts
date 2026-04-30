import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default("GBP"),
  dueDate: z.string().optional(),
  interestRate: z.number().min(0).default(0),
  lateFeeAmount: z.number().min(0).default(0),
  category: z.enum(["GENERAL", "RENT", "INVOICE", "LOAN", "SUBSCRIPTION", "SERVICE"]).default("GENERAL"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const client = await prisma.client.findFirst({ where: { id: data.clientId, userId } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const debt = await prisma.debt.create({
      data: {
        clientId: data.clientId,
        title: data.title,
        description: data.description || null,
        amount: data.amount,
        currency: data.currency,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        interestRate: data.interestRate,
        lateFeeAmount: data.lateFeeAmount,
        category: data.category,
      },
    });

    return NextResponse.json(debt, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
