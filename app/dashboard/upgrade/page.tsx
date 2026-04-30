"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, TrendingUp, Zap, Building2 } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    id: "PRO" as const,
    name: "Pro",
    price: "£19",
    period: "/month",
    icon: Zap,
    color: "blue",
    desc: "For freelancers & small businesses",
    features: [
      "Unlimited clients",
      "Advanced automation",
      "Email + SMS reminders",
      "Stripe payment integration",
      "Advanced analytics",
      "Google Drive backup",
      "Priority support",
    ],
  },
  {
    id: "ENTERPRISE" as const,
    name: "Enterprise",
    price: "£79",
    period: "/month",
    icon: Building2,
    color: "purple",
    desc: "For agencies & businesses",
    features: [
      "Everything in Pro",
      "Team management",
      "API access",
      "White-label options",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
];

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleUpgrade(plan: "PRO" | "ENTERPRISE") {
    setLoading(plan);
    setError("");

    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();
    setLoading(null);

    if (!res.ok || !data.url) {
      setError(data.error || "Failed to start checkout. Make sure Stripe keys are configured.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm px-4 py-1.5 rounded-full mb-4 font-medium">
          <TrendingUp className="w-4 h-4" />
          Upgrade Your Plan
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Unlock the Full Power of MYM</h1>
        <p className="text-gray-500 mt-2 text-lg">
          Automate reminders, integrate payments, and scale your debt tracking.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-5 py-4 text-center">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map(({ id, name, price, period, icon: Icon, desc, features }) => (
          <div
            key={id}
            className={`bg-white rounded-2xl border-2 p-8 shadow-sm transition ${
              id === "PRO" ? "border-blue-200 shadow-blue-50" : "border-purple-200 shadow-purple-50"
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
              id === "PRO" ? "bg-blue-50" : "bg-purple-50"
            }`}>
              <Icon className={`w-6 h-6 ${id === "PRO" ? "text-blue-600" : "text-purple-600"}`} />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">{name}</h2>
            <p className="text-gray-400 text-sm mb-4">{desc}</p>

            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-bold text-gray-900">{price}</span>
              <span className="text-gray-400 text-sm mb-1">{period}</span>
            </div>

            <ul className="space-y-3 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${
                    id === "PRO" ? "text-blue-500" : "text-purple-500"
                  }`} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(id)}
              disabled={loading !== null}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-60 ${
                id === "PRO"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              {loading === id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Upgrade to {name}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gray-400">
        Payments secured by Stripe · Cancel anytime ·{" "}
        <Link href="/dashboard/settings" className="text-blue-600 hover:underline">
          Back to settings
        </Link>
      </p>
    </div>
  );
}
