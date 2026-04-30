"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteDebtButton({ debtId, clientId }: { debtId: string; clientId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this debt and all its payments? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/debts/${debtId}`, { method: "DELETE" });
    router.push(`/dashboard/clients/${clientId}`);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 border border-red-100 hover:bg-red-50 transition disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      Delete
    </button>
  );
}
