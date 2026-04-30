"use client";

import { useState } from "react";
import { Bell, Loader2, CheckCircle2, ChevronDown, Mail, MessageSquare } from "lucide-react";

interface Props {
  debtId: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
}

const MODES = [
  { value: "FRIENDLY", label: "Friendly Reminder", desc: "Gentle, casual tone" },
  { value: "PROFESSIONAL", label: "Professional Reminder", desc: "Formal invoice tone" },
  { value: "FINAL", label: "Final Notice", desc: "Urgent legal warning tone" },
] as const;

const CHANNELS = [
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "SMS", label: "SMS", icon: MessageSquare },
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
] as const;

type Mode = (typeof MODES)[number]["value"];
type Channel = (typeof CHANNELS)[number]["value"];

export function SendReminderButton({ debtId, clientEmail, clientPhone }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("PROFESSIONAL");
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const hasEmail = !!clientEmail;
  const hasPhone = !!clientPhone;
  const canSend =
    (channel === "EMAIL" && hasEmail) ||
    ((channel === "SMS" || channel === "WHATSAPP") && hasPhone);

  async function send() {
    if (!canSend) {
      setError(channel === "EMAIL" ? "Client has no email address" : "Client has no phone number");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/reminders/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ debtId, mode, channel }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to send");
      return;
    }

    setSent(true);
    setOpen(false);
    setTimeout(() => setSent(false), 3000);
  }

  if (!hasEmail && !hasPhone) {
    return (
      <p className="text-xs text-gray-400 mt-2">
        Add client email or phone to enable reminders.
      </p>
    );
  }

  return (
    <div className="relative">
      {sent ? (
        <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium py-2">
          <CheckCircle2 className="w-4 h-4" />
          Reminder sent!
        </div>
      ) : (
        <>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <Bell className="w-4 h-4 text-blue-500" />
            Send Reminder
            <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="mt-2 bg-white border border-gray-100 rounded-2xl shadow-lg p-4 space-y-4">
              {/* Channel selector */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Send via:</p>
                <div className="flex gap-2">
                  {CHANNELS.map(({ value, label, icon: Icon }) => {
                    const available = value === "EMAIL" ? hasEmail : hasPhone;
                    return (
                      <button
                        key={value}
                        onClick={() => available && setChannel(value)}
                        disabled={!available}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          channel === value
                            ? "bg-blue-600 text-white border-blue-600"
                            : available
                            ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                            : "border-gray-100 text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {channel === "EMAIL"
                    ? `To: ${clientEmail}`
                    : `To: ${clientPhone}`}
                </p>
              </div>

              {/* Mode selector */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Tone:</p>
                <div className="space-y-2">
                  {MODES.map((m) => (
                    <label key={m.value} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="mode"
                        value={m.value}
                        checked={mode === m.value}
                        onChange={() => setMode(m.value)}
                        className="mt-0.5 accent-blue-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition">
                          {m.label}
                        </p>
                        <p className="text-xs text-gray-400">{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                onClick={send}
                disabled={loading || !canSend}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                Send {channel === "EMAIL" ? "Email" : channel === "SMS" ? "SMS" : "WhatsApp"} Now
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
