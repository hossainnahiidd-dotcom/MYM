import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { sendReminderSms } from "@/lib/sms";
import { z } from "zod";

const schema = z.object({
  debtId: z.string().min(1),
  mode: z.enum(["FRIENDLY", "PROFESSIONAL", "FINAL"]).default("PROFESSIONAL"),
  channel: z.enum(["EMAIL", "SMS", "WHATSAPP"]).default("EMAIL"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  let debtId = "unknown";

  try {
    const body = await req.json();
    const { debtId: id, mode, channel } = schema.parse(body);
    debtId = id;

    const debt = await prisma.debt.findFirst({
      where: { id: debtId, client: { userId } },
      include: { client: true },
    });

    if (!debt) return NextResponse.json({ error: "Debt not found" }, { status: 404 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const senderName = user?.name ?? "MYM User";

    if (channel === "EMAIL") {
      if (!debt.client.email) {
        return NextResponse.json({ error: "Client has no email address" }, { status: 400 });
      }
      await sendReminderEmail({
        to: debt.client.email,
        clientName: debt.client.name,
        debtTitle: debt.title,
        amount: debt.amount,
        amountPaid: debt.amountPaid,
        currency: debt.currency,
        dueDate: debt.dueDate,
        senderName,
        mode,
      });
    } else {
      if (!debt.client.phone) {
        return NextResponse.json({ error: "Client has no phone number" }, { status: 400 });
      }
      await sendReminderSms({
        to: debt.client.phone,
        clientName: debt.client.name,
        debtTitle: debt.title,
        amount: debt.amount,
        amountPaid: debt.amountPaid,
        currency: debt.currency,
        dueDate: debt.dueDate,
        senderName,
        mode,
        channel,
      });
    }

    await prisma.reminder.create({
      data: {
        debtId,
        channel,
        status: "SENT",
        sentAt: new Date(),
        scheduledAt: new Date(),
        message: `${mode} ${channel} reminder sent`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    await prisma.reminder.create({
      data: {
        debtId,
        channel: "EMAIL",
        status: "FAILED",
        scheduledAt: new Date(),
        message: err?.message ?? "Unknown error",
      },
    }).catch(() => {});

    return NextResponse.json({ error: err?.message ?? "Failed to send reminder" }, { status: 500 });
  }
}
