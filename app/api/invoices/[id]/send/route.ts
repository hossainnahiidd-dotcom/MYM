import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/lib/email";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
    include: {
      client: true,
      items: true,
      user: { select: { name: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (!invoice.client.email) return NextResponse.json({ error: "Client has no email address" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  await sendInvoiceEmail({
    to: invoice.client.email,
    clientName: invoice.client.name,
    invoiceNo: invoice.invoiceNo,
    title: invoice.title,
    items: invoice.items,
    subtotal: invoice.subtotal,
    taxRate: invoice.taxRate,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    currency: invoice.currency,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    senderName: invoice.user.name ?? "MYM User",
    notes: invoice.notes,
    invoiceUrl: `${appUrl}/invoice/${invoice.id}/print`,
  });

  await prisma.invoice.update({
    where: { id },
    data: { status: "SENT", sentAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
