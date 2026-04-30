import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
});

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const body = await req.json();
  const { name } = schema.parse(body);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name },
    select: { name: true, email: true, plan: true, role: true },
  });

  return NextResponse.json(user);
}
