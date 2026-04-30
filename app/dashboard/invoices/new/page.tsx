"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, ArrowLeft, Calculator } from "lucide-react";
import Link from "next/link";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Client { id: string; name: string; }

const CURRENCIES = ["GBP", "USD", "EUR", "CAD", "AUD"];

export default function NewInvoicePage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [prefilledClientId, setPrefilledClientId] = useState("");

  useEffect(() => {
    searchParams.then((p) => {
      if (p.clientId) setPrefilledClientId(p.clientId);
    });
  }, [searchParams]);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    clientId: "",
    title: "",
    notes: "",
    terms: "Payment is due within 30 days of the invoice date.",
    issueDate: today,
    dueDate: "",
    currency: "GBP",
    taxRate: 0,
  });

  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    fetch("/api/clients/list").then((r) => r.json()).then(setClients);
  }, []);

  useEffect(() => {
    if (prefilledClientId) setForm((f) => ({ ...f, clientId: prefilledClientId }));
  }, [prefilledClientId]);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxAmount = subtotal * (form.taxRate / 100);
  const total = subtotal + taxAmount;

  const sym = form.currency === "GBP" ? "£" : form.currency === "USD" ? "$" : form.currency === "EUR" ? "€" : form.currency;

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof LineItem, value: string | number) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  async function submit() {
    if (!form.clientId) { setError("Please select a client"); return; }
    if (!form.title) { setError("Invoice title is required"); return; }
    if (items.some((i) => !i.description)) { setError("All line items need a description"); return; }

    setSaving(true);
    setError("");

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, taxRate: Number(form.taxRate), items }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Failed to create invoice"); return; }
    router.push(`/dashboard/invoices/${data.id}`);
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices" className="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
          <p className="text-gray-500 text-sm mt-0.5">Create and send a professional invoice</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client + title */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Invoice Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Client *</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select a client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Title *</label>
              <input
                type="text"
                placeholder="e.g. Web Development Services — May 2026"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Date *</label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Line Items</h2>
              <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-800 transition">
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="Description…"
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                      {sym}{(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Notes & Terms</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
              <textarea
                rows={3}
                placeholder="Any additional notes for the client…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms</label>
              <textarea
                rows={2}
                value={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-6">
            <div className="flex items-center gap-2 mb-5">
              <Calculator className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-gray-900">Summary</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-900 tabular-nums">{sym}{subtotal.toFixed(2)}</span>
              </div>
              {form.taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({form.taxRate}%)</span>
                  <span className="font-semibold text-gray-900 tabular-nums">{sym}{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-100">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-xl text-blue-600 tabular-nums">{sym}{total.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            <div className="mt-5 space-y-2">
              <button
                onClick={submit}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Invoice
              </button>
              <Link
                href="/dashboard/invoices"
                className="block text-center text-sm text-gray-400 hover:text-gray-600 transition py-1"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
