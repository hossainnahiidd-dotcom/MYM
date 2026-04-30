"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, Printer, Trash2, Loader2 } from "lucide-react";

interface Props {
  invoiceId: string;
  status: string;
  clientEmail?: string | null;
}

export function InvoiceActions({ invoiceId, status, clientEmail }: Props) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendInvoice() {
    if (!clientEmail) { setError("Client has no email address"); return; }
    setSending(true); setError("");
    const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: "POST" });
    setSending(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to send"); return; }
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    router.refresh();
  }

  async function markPaid() {
    setMarking(true);
    await fetch(`/api/invoices/${invoiceId}/mark-paid`, { method: "POST" });
    setMarking(false);
    router.refresh();
  }

  async function deleteInvoice() {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
    router.push("/dashboard/invoices");
  }

  const isPaid = status === "PAID" || status === "CANCELLED";

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {error && <p className="text-xs text-red-600 mr-2">{error}</p>}

      {sent && (
        <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> Sent!
        </span>
      )}

      {!isPaid && (
        <button
          onClick={sendInvoice}
          disabled={sending}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {status === "SENT" ? "Resend" : "Send Invoice"}
        </button>
      )}

      {!isPaid && (
        <button
          onClick={markPaid}
          disabled={marking}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
        >
          {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Mark Paid
        </button>
      )}

      <a
        href={`/invoice/${invoiceId}/print`}
        target="_blank"
        className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
      >
        <Printer className="w-4 h-4" />
        Print
      </a>

      <button
        onClick={deleteInvoice}
        disabled={deleting}
        className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition disabled:opacity-50"
      >
        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
