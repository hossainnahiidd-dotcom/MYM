import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const role = (session.user as any)?.role;
  if (role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shrink-0">
          <span className="text-sm text-gray-500">
            Logged in as <span className="font-medium text-gray-900">{session.user?.email}</span>
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            ADMIN
          </span>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
