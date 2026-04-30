import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, Users, ArrowUpRight, Mail, Phone } from "lucide-react";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const clients = await prisma.client.findMany({
    where: { userId },
    include: {
      debts: true,
      _count: { select: { debts: true, payments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalOutstanding = clients.reduce((s, c) => {
    return s + c.debts.filter((d) => d.status !== "PAID").reduce((ds, d) => ds + (d.amount - d.amountPaid), 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {clients.length} client{clients.length !== 1 ? "s" : ""} ·{" "}
            <span className="text-red-500 font-medium">{formatCurrency(totalOutstanding)}</span> total outstanding
          </p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Users className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No clients yet</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Add your first client to start tracking what they owe you.
          </p>
          <Link
            href="/dashboard/clients/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Your First Client
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {clients.length} Clients
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">Contact</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">Outstanding</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">Debts</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">Added</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map((client) => {
                  const totalOwed = client.debts
                    .filter((d) => d.status !== "PAID")
                    .reduce((s, d) => s + (d.amount - d.amountPaid), 0);
                  const paidCount = client.debts.filter((d) => d.status === "PAID").length;

                  return (
                    <tr key={client.id} className="hover:bg-blue-50/20 transition group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {client.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                            {paidCount > 0 && (
                              <p className="text-[11px] text-emerald-500 font-medium">{paidCount} paid off</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Mail className="w-3 h-3 text-gray-300" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Phone className="w-3 h-3 text-gray-300" />
                              {client.phone}
                            </div>
                          )}
                          {!client.email && !client.phone && (
                            <span className="text-xs text-gray-300">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold tabular-nums ${totalOwed > 0 ? "text-red-500" : "text-emerald-600"}`}>
                          {formatCurrency(totalOwed)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-600">
                          {client._count.debts}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          client.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : client.status === "BLOCKED"
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-50 text-gray-500"
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-medium">{formatDate(client.createdAt)}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-800 transition opacity-0 group-hover:opacity-100"
                        >
                          View <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
