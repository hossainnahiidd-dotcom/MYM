import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { AdminUserActions } from "@/components/admin/admin-user-actions";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      role: true,
      createdAt: true,
      _count: { select: { clients: true } },
    },
  });

  const planColors: Record<string, string> = {
    FREE: "bg-gray-100 text-gray-600",
    PRO: "bg-blue-100 text-blue-700",
    ENTERPRISE: "bg-purple-100 text-purple-700",
  };

  const roleColors: Record<string, string> = {
    PERSONAL: "bg-gray-50 text-gray-500",
    BUSINESS: "bg-cyan-50 text-cyan-700",
    ADMIN: "bg-red-100 text-red-700",
    DEBT_MANAGER: "bg-yellow-50 text-yellow-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm mt-1">{users.length} registered accounts</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs">User</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs">Plan</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs">Role</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs">Clients</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs">Joined</th>
                <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{user.name ?? "—"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planColors[user.plan]}`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{user._count.clients}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-4">
                    <AdminUserActions userId={user.id} currentPlan={user.plan} currentRole={user.role} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
