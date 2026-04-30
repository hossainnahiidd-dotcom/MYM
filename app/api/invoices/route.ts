import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const createSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(1),
  notes: z.string().optional(),
  terms: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string().optional(),
  currency: z.string().default("GBP"),
  taxRate: z.number().min(0).max(100).default(0),
  items: z.array(itemSchema).min(1),
});

async function generateInvoiceNo(userId: string) {
  const count = await prisma.invoice.count({ where: { userId } });
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    include: { client: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const body = await req.json();
  const data = createSchema.parse(body);

  const client = await prisma.client.findFirst({ where: { id: data.clientId, userId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const subtotal = data.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount;
  const invoiceNo = await generateInvoiceNo(userId);

  const invoice = await prisma.invoice.create({
    data: {
      userId,
      clientId: data.clientId,
      invoiceNo,
      title: data.title,
      notes: data.notes,
      terms: data.terms,
      issueDate: new Date(data.issueDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      currency: data.currency,
      taxRate: data.taxRate,
      taxAmount,
      subtotal,
      total,
      items: {
        create: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(invoice, { status: 201 });
}
