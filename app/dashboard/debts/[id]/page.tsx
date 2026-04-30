import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, getDebtStatusColor, calculateLateFee } from "@/lib/utils";
import { ArrowLeft, FileText } from "lucide-react";
import { RecordPaymentForm } from "@/components/dashboard/record-payment-form";
import { DeleteDebtButton } from "@/components/dashboard/delete-debt-button";
import { SendReminderButton } from "@/components/dashboard/send-reminder-button";

export default async function DebtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const { id } = await params;

  const debt = await prisma.debt.findFirst({
    where: { id, client: { userId } },
    include: {
      client: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (!debt) notFound();

  const outstanding = debt.amount - debt.amountPaid;
  const progress = Math.min((debt.amountPaid / debt.amount) * 100, 100);
  const lateFee = debt.dueDate && debt.interestRate
    ? calculateLateFee(debt.amount, new Date(debt.dueDate), debt.interestRate)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/clients/${debt.clientId}`}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{debt.title}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDebtStatusColor(debt.status)}`}>
                {debt.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              Client:{" "}
              <Link href={`/dashboard/clients/${debt.clientId}`} className="text-blue-600 hover:underline">
                {debt.client.name}
              </Link>
              {" · "}{debt.category}
            </p>
          </div>
        </div>
        <DeleteDebtButton debtId={debt.id} clientId={debt.clientId} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Amount card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="grid sm:grid-cols-3 gap-4 mb-5">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(debt.amount, debt.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Amount Paid</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(debt.amountPaid, debt.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Outstanding</p>
                <p className={`text-xl font-bold ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(outstanding, debt.currency)}
                </p>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{progress.toFixed(0)}% paid</p>

            {lateFee > 0 && (
              <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                <p className="text-sm text-orange-700 font-medium">
                  Late fee accrued: {formatCurrency(lateFee, debt.currency)}
                </p>
              </div>
            )}
          </div>

          {/* Debt details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Details</h2>
            <dl className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Due Date", value: debt.dueDate ? formatDate(debt.dueDate) : "No due date" },
                { label: "Created", value: formatDate(debt.createdAt) },
                { label: "Category", value: debt.category },
                { label: "Currency", value: debt.currency },
                { label: "Interest Rate", value: debt.interestRate ? `${debt.interestRate}% / day` : "None" },
                { label: "Late Fee", value: debt.lateFeeAmount ? formatCurrency(debt.lateFeeAmount, debt.currency) : "None" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-gray-400">{label}</dt>
                  <dd className="text-sm font-medium text-gray-900 mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
            {debt.description && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700">{debt.description}</p>
              </div>
            )}
          </div>

          {/* Payment history */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Payment History ({debt.payments.length})
            </h2>
            {debt.payments.length === 0 ? (
              <p className="text-sm text-gray-400">No payments recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {debt.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(p.amount, p.currency)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(p.paidAt)} · {p.method.replace("_", " ")}
                        {p.reference && ` · Ref: ${p.reference}`}
                      </p>
                      {p.notes && <p className="text-xs text-gray-400">{p.notes}</p>}
                    </div>
                    <span className="text-green-600 font-semibold text-sm">
                      +{formatCurrency(p.amount, p.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Record Payment + Reminder */}
        <div className="space-y-4">
          {debt.status !== "PAID" && debt.status !== "WRITTEN_OFF" && (
            <RecordPaymentForm
              debtId={debt.id}
              outstanding={outstanding}
              currency={debt.currency}
            />
          )}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Reminder</h3>
            <SendReminderButton
              debtId={debt.id}
              clientEmail={debt.client.email}
              clientPhone={debt.client.phone}
            />
          </div>

          <Link
            href={`/dashboard/invoices/new?clientId=${debt.clientId}`}
            className="flex items-center gap-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition"
          >
            <FileText className="w-4 h-4" />
            Create Invoice for this Client
          </Link>
        </div>
      </div>
    </div>
  );
}
