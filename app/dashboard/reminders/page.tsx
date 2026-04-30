import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Bell, CheckCircle2, XCircle, Clock, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";

const CHANNEL_STYLE: Record<string, string> = {
  EMAIL:    "bg-blue-50 text-blue-700 border border-blue-100",
  SMS:      "bg-violet-50 text-violet-700 border border-violet-100",
  WHATSAPP: "bg-emerald-50 text-emerald-700 border border-emerald-100",
};

const CHANNEL_ICON: Record<string, React.ElementType> = {
  EMAIL: Mail,
  SMS: MessageSquare,
  WHATSAPP: MessageSquare,
};

export default async function RemindersPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const reminders = await prisma.reminder.findMany({
    where: { debt: { client: { userId } } },
    include: {
      debt: { include: { client: { select: { name: true } } } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  const sentCount = reminders.filter((r) => r.status === "SENT").length;
  const failedCount = reminders.filter((r) => r.status === "FAILED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {reminders.length} total ·{" "}
            <span className="text-emerald-600 font-medium">{sentCount} sent</span>
            {failedCount > 0 && (
              <> · <span className="text-red-500 font-medium">{failedCount} failed</span></>
            )}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      {reminders.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Sent", value: sentCount, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Failed", value: failedCount, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
            { label: "Pending", value: reminders.filter((r) => r.status === "PENDING").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {reminders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Bell className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No reminders yet</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Send reminders from a debt page. They'll appear here once scheduled.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  {["Client", "Debt", "Channel", "Date", "Status", "Message"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reminders.map((r) => {
                  const ChannelIcon = CHANNEL_ICON[r.channel] ?? Bell;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {r.debt.client.name[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{r.debt.client.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/debts/${r.debtId}`}
                          className="text-sm text-gray-700 hover:text-blue-600 font-medium transition"
                        >
                          {r.debt.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${CHANNEL_STYLE[r.channel] ?? ""}`}>
                          <ChannelIcon className="w-3 h-3" />
                          {r.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-medium whitespace-nowrap">
                        {formatDate(r.scheduledAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {r.status === "SENT" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {r.status === "FAILED" && <XCircle className="w-4 h-4 text-red-500" />}
                          {r.status === "PENDING" && <Clock className="w-4 h-4 text-amber-500" />}
                          <span className={`text-xs font-semibold ${
                            r.status === "SENT" ? "text-emerald-600" : r.status === "FAILED" ? "text-red-500" : "text-amber-600"
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-xs text-gray-400 truncate">{r.message ?? "—"}</p>
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
