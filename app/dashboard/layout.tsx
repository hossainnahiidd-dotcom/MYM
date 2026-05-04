import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const isAdmin = (session.user as any)?.role === "ADMIN";

  return (
    <DashboardShell isAdmin={isAdmin} user={session.user ?? undefined}>
      {children}
    </DashboardShell>
  );
}
