import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$99",
    period: "/month",
    description: "For small teams exploring AI-powered reporting.",
    cta: "Start Free Trial",
    highlight: false,
    features: [
      "1 ERP connection",
      "Up to 5 users",
      "500 AI queries/month",
      "Basic chart types",
      "1 shared dashboard",
      "Email support",
      "7-day query history",
    ],
  },
  {
    name: "Pro",
    price: "$299",
    period: "/month",
    yearlyPrice: "$249",
    description: "For growing teams that need full reporting power.",
    cta: "Start Free Trial",
    highlight: true,
    features: [
      "3 ERP connections",
      "Up to 25 users",
      "5,000 AI queries/month",
      "All chart types + export",
      "Unlimited dashboards",
      "Priority support",
      "90-day query history",
      "Share links & embeds",
      "Column drag & drop",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with advanced security needs.",
    cta: "Contact Sales",
    highlight: false,
    features: [
      "Unlimited ERP connections",
      "Unlimited users",
      "Unlimited AI queries",
      "Anomaly detection",
      "Task automation",
      "SSO / SAML integration",
      "Dedicated support manager",
      "Custom SLA & audit logs",
      "On-premise option",
    ],
  },
];

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);

  const scrollTo = (id) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="pricing" data-testid="pricing-section" className="py-28 md:py-36 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/80" />
      <div className="absolute inset-0 dot-grid opacity-[0.2]" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 font-['Outfit'] bg-blue-50 px-3 py-1 rounded-full">
            Pricing
          </span>
          <h2 className="text-4xl sm:text-5xl tracking-tight font-bold text-slate-900 font-['Outfit'] mt-5">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-slate-500 mt-4 max-w-md mx-auto">
            Save thousands compared to hiring report writers.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-slate-100 rounded-full p-1" data-testid="pricing-toggle">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !yearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                yearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Yearly
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-bold">-17%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              data-testid={`pricing-card-${plan.name.toLowerCase()}`}
              className="relative"
            >
              {/* Pro card animated border */}
              {plan.highlight && (
                <div className="absolute -inset-[2px] rounded-[18px] bg-gradient-to-r from-[#0055FF] via-[#6366F1] to-[#0055FF] bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite] opacity-80" style={{backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite'}} />
              )}

              <div className={`relative rounded-2xl p-7 transition-all duration-500 h-full ${
                plan.highlight
                  ? "bg-white shadow-2xl shadow-blue-500/10 z-10"
                  : "bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1"
              }`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#0055FF] to-[#6366F1] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-blue-500/30">
                    <Sparkles size={10} />
                    Most Popular
                  </div>
                )}

                <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{plan.description}</p>

                <div className="mt-6 mb-7">
                  <motion.span
                    key={yearly ? "yearly" : "monthly"}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-bold text-slate-900 font-['Outfit'] tracking-tight"
                  >
                    {yearly && plan.yearlyPrice ? plan.yearlyPrice : plan.price}
                  </motion.span>
                  <span className="text-sm text-slate-400 ml-1">
                    {plan.period}{yearly && plan.yearlyPrice ? " (billed yearly)" : ""}
                  </span>
                </div>

                <motion.button
                  data-testid={`pricing-cta-${plan.name.toLowerCase()}`}
                  onClick={() => scrollTo("#waitlist")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "bg-gradient-to-r from-[#0055FF] to-[#3B82F6] text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
                      : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  {plan.cta}
                </motion.button>

                <div className="mt-7 pt-6 border-t border-slate-100 space-y-3">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.highlight ? 'bg-blue-100 text-[#0055FF]' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Check size={10} strokeWidth={3} />
                      </div>
                      <span className="text-sm text-slate-600">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
