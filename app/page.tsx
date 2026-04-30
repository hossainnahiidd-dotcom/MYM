import Link from "next/link";
import {
  TrendingUp,
  Shield,
  Bell,
  CreditCard,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Zap,
  Star,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">MYM</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-medium">
              <Link href="#features" className="hover:text-gray-900 transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
              <Link href="#about" className="hover:text-gray-900 transition-colors">About</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 py-28 px-6">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs px-4 py-1.5 rounded-full mb-8 font-medium tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5" />
            Trusted Financial Monitoring Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Track Every Penny.{" "}
            <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Recover Every Payment.
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            MYM automates debt monitoring, tracks what you're owed, sends
            smart payment reminders, and gives you a real-time view of your
            finances — all in one secure platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/auth/register"
              className="flex items-center gap-2 bg-blue-600 text-white px-7 py-3.5 rounded-xl text-base font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/40"
            >
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="flex items-center gap-2 border border-slate-600 text-slate-300 px-7 py-3.5 rounded-xl text-base font-medium hover:bg-slate-800/50 hover:border-slate-500 transition-colors"
            >
              Sign In to Dashboard
            </Link>
          </div>

          <p className="text-sm text-slate-500 mt-5">
            Free plan available · No credit card required
          </p>
        </div>

        {/* Mini stat pills */}
        <div className="relative max-w-3xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { value: "£2.4M+", label: "Debt Tracked" },
            { value: "98%", label: "Recovery Rate" },
            { value: "5,000+", label: "Active Users" },
            { value: "99.9%", label: "Uptime" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4"
            >
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Everything You Need to Get Paid
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              A complete toolkit for monitoring debts, chasing payments, and
              protecting your financial records.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: BarChart3,
                title: "Live Dashboard",
                desc: "Real-time view of total owed, paid, overdue, and upcoming payments with visual charts.",
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
              },
              {
                icon: Bell,
                title: "Automated Reminders",
                desc: "Smart email, SMS, and WhatsApp reminders that escalate automatically as due dates pass.",
                iconBg: "bg-purple-50",
                iconColor: "text-purple-600",
              },
              {
                icon: CreditCard,
                title: "Payment Tracking",
                desc: "Record partial payments, full payments, and auto-calculate outstanding balances instantly.",
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
              },
              {
                icon: Users,
                title: "Client Management",
                desc: "Organise all your debtors with full history, notes, contact details, and payment records.",
                iconBg: "bg-orange-50",
                iconColor: "text-orange-600",
              },
              {
                icon: Shield,
                title: "Secure & Encrypted",
                desc: "End-to-end encryption, GDPR-compliant storage, and automatic cloud backup.",
                iconBg: "bg-red-50",
                iconColor: "text-red-500",
              },
              {
                icon: TrendingUp,
                title: "Growth Analytics",
                desc: "Visualise your collection trends, predict late payments, and get smart follow-up suggestions.",
                iconBg: "bg-indigo-50",
                iconColor: "text-indigo-600",
              },
            ].map(({ icon: Icon, title, desc, iconBg, iconColor }) => (
              <div
                key={title}
                className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-blue-100 transition-all"
              >
                <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-gray-50/70">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-500">Start free. Scale as you grow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {[
              {
                name: "Free",
                price: "£0",
                period: "/month",
                desc: "Perfect for individuals",
                features: [
                  "Up to 10 clients",
                  "Basic debt tracking",
                  "Email reminders",
                  "Manual payment recording",
                  "Basic dashboard",
                ],
                cta: "Get Started Free",
                href: "/auth/register",
                highlight: false,
              },
              {
                name: "Pro",
                price: "£19",
                period: "/month",
                desc: "For freelancers & small businesses",
                features: [
                  "Unlimited clients",
                  "Advanced automation",
                  "Email + SMS reminders",
                  "Invoice system",
                  "Advanced analytics",
                  "Google Drive backup",
                  "Priority support",
                ],
                cta: "Start Pro Trial",
                href: "/auth/register?plan=pro",
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "£79",
                period: "/month",
                desc: "For agencies & businesses",
                features: [
                  "Everything in Pro",
                  "Team management",
                  "API access",
                  "White-label options",
                  "Dedicated support",
                  "Custom integrations",
                  "SLA guarantee",
                ],
                cta: "Contact Sales",
                href: "/auth/register?plan=enterprise",
                highlight: false,
              },
            ].map(({ name, price, period, desc, features, cta, href, highlight }) => (
              <div
                key={name}
                className={`relative rounded-2xl p-7 ${
                  highlight
                    ? "bg-blue-600 shadow-2xl shadow-blue-200"
                    : "bg-white border border-gray-100 shadow-sm"
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      <Star className="w-3 h-3" /> Most Popular
                    </span>
                  </div>
                )}
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${highlight ? "text-blue-200" : "text-gray-400"}`}>
                  {name}
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-extrabold tracking-tight ${highlight ? "text-white" : "text-gray-900"}`}>{price}</span>
                  <span className={`text-sm pb-1 ${highlight ? "text-blue-200" : "text-gray-400"}`}>{period}</span>
                </div>
                <p className={`text-sm mb-6 ${highlight ? "text-blue-100" : "text-gray-400"}`}>{desc}</p>
                <ul className="space-y-2.5 mb-7">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${highlight ? "text-blue-200" : "text-emerald-500"}`} />
                      <span className={highlight ? "text-blue-50" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition ${
                    highlight
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-slate-950 to-blue-950">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to Take Control?
          </h2>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            Join thousands of landlords, freelancers, and businesses who trust
            MYM to track and recover what they're owed.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/40"
          >
            Create Your Free Account <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-slate-500 mt-4">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">MYM</span>
            <span className="text-gray-400 text-sm">— Monitor Your Money</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 MYM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
