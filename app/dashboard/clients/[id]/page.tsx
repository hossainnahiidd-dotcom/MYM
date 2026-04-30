import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, getDebtStatusColor } from "@/lib/utils";
import { ArrowLeft, Plus, Mail, Phone, MapPin, FileText } from "lucide-react";
import { DeleteClientButton } from "@/components/dashboard/delete-client-button";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, userId },
    include: {
      debts: {
        include: { payments: true },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { paidAt: "desc" },
        take: 10,
        include: { debt: { select: { title: true } } },
      },
    },
  });

  if (!client) notFound();

  const totalOwed = client.debts
    .filter((d) => d.status !== "PAID" && d.status !== "WRITTEN_OFF")
    .reduce((sum, d) => sum + (d.amount - d.amountPaid), 0);

  const totalPaid = client.debts.reduce((sum, d) => sum + d.amountPaid, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/clients" className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-700 font-bold text-lg">
              {client.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                client.status === "ACTIVE" ? "bg-green-50 text-green-700" :
                client.status === "BLOCKED" ? "bg-red-50 text-red-700" :
                "bg-gray-50 text-gray-600"
              }`}>
                {client.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/debts/new?clientId=${client.id}`}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Debt
          </Link>
          <DeleteClientButton clientId={client.id} clientName={client.name} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Outstanding</p>
          <p className={`text-2xl font-bold ${totalOwed > 0 ? "text-red-600" : "text-green-600"}`}>
            {formatCurrency(totalOwed)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Debts</p>
          <p className="text-2xl font-bold text-gray-900">{client.debts.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Debts List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Debts</h2>
            <Link
              href={`/dashboard/debts/new?clientId=${client.id}`}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              + Add debt
            </Link>
          </div>

          {client.debts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-gray-400 text-sm">No debts yet for this client.</p>
              <Link
                href={`/dashboard/debts/new?clientId=${client.id}`}
                className="inline-flex items-center gap-1.5 mt-3 text-blue-600 text-sm font-medium hover:underline"
              >
                <Plus className="w-4 h-4" /> Add first debt
              </Link>
            </div>
          ) : (
            client.debts.map((debt) => {
              const outstanding = debt.amount - debt.amountPaid;
              const progress = Math.min((debt.amountPaid / debt.amount) * 100, 100);
              return (
                <Link
                  key={debt.id}
                  href={`/dashboard/debts/${debt.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{debt.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {debt.category} · {debt.dueDate ? `Due ${formatDate(debt.dueDate)}` : "No due date"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {formatCurrency(outstanding, debt.currency)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getDebtStatusColor(debt.status)}`}>
                        {debt.status}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Paid {formatCurrency(debt.amountPaid, debt.currency)}</span>
                    <span>of {formatCurrency(debt.amount, debt.currency)}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Client Info + Recent Payments */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Details</h3>
            <ul className="space-y-3">
              {client.email && (
                <li className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {client.email}
                </li>
              )}
              {client.phone && (
                <li className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {client.phone}
                </li>
              )}
              {client.address && (
                <li className="flex items-center gap-2.5 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {client.address}
                </li>
              )}
              {client.notes && (
                <li className="flex items-start gap-2.5 text-sm text-gray-600">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  {client.notes}
                </li>
              )}
              {!client.email && !client.phone && !client.address && !client.notes && (
                <p className="text-sm text-gray-400">No contact details added.</p>
              )}
            </ul>
            <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-50">
              Added {formatDate(client.createdAt)}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Payments</h3>
            {client.payments.length === 0 ? (
              <p className="text-sm text-gray-400">No payments recorded.</p>
            ) : (
              <ul className="space-y-2.5">
                {client.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-gray-700 font-medium">{p.debt.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(p.paidAt)}</p>
                    </div>
                    <span className="text-green-600 font-semibold">
                      +{formatCurrency(p.amount, p.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
