"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";

interface Props {
  invoiceId: string;
  isPaid: boolean;
  paidAt?: Date | string | null;
}

export function InvoicePaidToggle({ invoiceId, isPaid, paidAt }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const endpoint = isPaid
      ? `/api/invoices/${invoiceId}/mark-unpaid`
      : `/api/invoices/${invoiceId}/mark-paid`;

    await fetch(endpoint, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  if (isPaid) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white" />
          <div>
            <p className="text-xs font-bold text-emerald-700">Paid</p>
            {paidAt && (
              <p className="text-[10px] text-emerald-500 whitespace-nowrap">
                {new Date(paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          title="Mark as unpaid"
          className="ml-1 p-1 rounded-lg text-gray-300 hover:text-amber-500 hover:bg-amber-50 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 text-xs font-semibold hover:bg-emerald-100 hover:border-emerald-300 transition disabled:opacity-60 whitespace-nowrap"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <CheckCircle2 className="w-3 h-3" />
      )}
      Mark Paid
    </button>
  );
}
