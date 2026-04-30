"use client";

import { Download } from "lucide-react";

export function ExportButtons() {
  return (
    <div className="flex items-center gap-2">
      <a
        href="/api/export/csv?type=debts"
        download
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        <Download className="w-4 h-4" />
        Export Debts
      </a>
      <a
        href="/api/export/csv?type=payments"
        download
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        <Download className="w-4 h-4" />
        Export Payments
      </a>
    </div>
  );
}
