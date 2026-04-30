"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${clientName}" and all their debts? This cannot be undone.`)) return;
    setLoading(true);
    await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    router.push("/dashboard/clients");
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
