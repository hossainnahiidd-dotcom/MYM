import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({ where: { id, userId } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "SENT", paidAt: null },
  });

  return NextResponse.json(updated);
}
