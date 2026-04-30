"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  debtId: string;
  outstanding: number;
  currency: string;
}

export function RecordPaymentForm({ debtId, outstanding, currency }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    amount: "",
    method: "MANUAL",
    reference: "",
    notes: "",
    paidAt: new Date().toISOString().split("T")[0],
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setFullAmount() {
    setForm((f) => ({ ...f, amount: outstanding.toFixed(2) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        debtId,
        amount: parseFloat(form.amount),
        method: form.method,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
        paidAt: form.paidAt,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to record payment");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setForm({ amount: "", method: "MANUAL", reference: "", notes: "", paidAt: new Date().toISOString().split("T")[0] });
      router.refresh();
    }, 1500);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Record Payment</h2>
      <p className="text-xs text-gray-400 mb-5">
        Outstanding: <span className="font-semibold text-red-600">{formatCurrency(outstanding, currency)}</span>
      </p>

      {success ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-green-600">
          <CheckCircle2 className="w-10 h-10" />
          <p className="font-semibold">Payment recorded!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Amount</label>
              <button
                type="button"
                onClick={setFullAmount}
                className="text-xs text-blue-600 hover:underline"
              >
                Full amount
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                {currency === "GBP" ? "£" : currency === "USD" ? "$" : "€"}
              </span>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                required
                min="0.01"
                max={outstanding}
                step="0.01"
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Payment Method
            </label>
            <select
              value={form.method}
              onChange={(e) => set("method", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
            >
              <option value="MANUAL">Manual / Other</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="STRIPE">Stripe</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Paid</label>
            <input
              type="date"
              value={form.paidAt}
              onChange={(e) => set("paidAt", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reference <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => set("reference", e.target.value)}
              placeholder="e.g. TRN-00123"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Record Payment
          </button>
        </form>
      )}
    </div>
  );
}
