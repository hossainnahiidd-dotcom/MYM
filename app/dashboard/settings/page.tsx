import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { formatDate } from "@/lib/utils";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, plan: true, role: true, createdAt: true },
  });

  const planColors: Record<string, string> = {
    FREE: "bg-gray-100 text-gray-600",
    PRO: "bg-blue-100 text-blue-700",
    ENTERPRISE: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Editable profile */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Profile</h2>
        <ProfileForm
          initialName={user?.name ?? ""}
          email={user?.email ?? ""}
        />
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Account Details</h2>
        <div className="space-y-0 divide-y divide-gray-50">
          {[
            { label: "Current Plan", value: user?.plan ?? "FREE" },
            { label: "Role", value: user?.role ?? "PERSONAL" },
            { label: "Member Since", value: user?.createdAt ? formatDate(user.createdAt) : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-500">{label}</span>
              {label === "Current Plan" ? (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planColors[value] ?? planColors.FREE}`}>
                  {value}
                </span>
              ) : (
                <span className="text-sm font-medium text-gray-900">{value}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-red-700 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-4">
          Permanently delete your account and all data. This action cannot be undone.
        </p>
        <button
          disabled
          className="px-5 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-40 cursor-not-allowed"
          title="Contact support to delete your account"
        >
          Delete Account
        </button>
        <p className="text-xs text-gray-400 mt-2">Contact support to delete your account.</p>
      </div>
    </div>
  );
}
