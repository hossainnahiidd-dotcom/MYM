"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown, Trash2 } from "lucide-react";

interface Props {
  userId: string;
  currentPlan: string;
  currentRole: string;
}

const PLANS = ["FREE", "PRO", "ENTERPRISE"] as const;
const ROLES = ["PERSONAL", "BUSINESS", "ADMIN", "DEBT_MANAGER"] as const;

export function AdminUserActions({ userId, currentPlan, currentRole }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState(currentPlan);
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, role }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  async function deleteUser() {
    if (!confirm("Delete this user and all their data? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.refresh();
    else alert("Failed to delete user.");
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          Edit
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl p-3 space-y-3 z-20">
            <div>
              <label className="text-xs text-gray-400 font-medium">Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        )}
      </div>

      <button
        onClick={deleteUser}
        disabled={deleting}
        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
        title="Delete user"
      >
        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
