import { motion } from "framer-motion";
import { Clock, DollarSign, Users, Shield, TrendingUp, Zap } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    stat: "95%",
    label: "Time Saved",
    desc: "Reports that took hours or days now take seconds to generate.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: DollarSign,
    stat: "$2K+",
    label: "Saved Per Report",
    desc: "Eliminate the need to hire report writers at $500-$2,000 each.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: Users,
    stat: "Any User",
    label: "No SQL Required",
    desc: "Finance, operations, sales — anyone can generate reports instantly.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    icon: Shield,
    stat: "100%",
    label: "Data Stays Yours",
    desc: "Read-only connections. AES-256 encryption. Your data never leaves your servers.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: TrendingUp,
    stat: "24/7",
    label: "Anomaly Monitoring",
    desc: "AI watches your metrics around the clock and alerts you when something's off.",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    icon: Zap,
    stat: "4+ ERPs",
    label: "Universal Support",
    desc: "Works with SYSPRO, Acumatica, Sage, Epicor — and more coming soon.",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
  },
];

export default function WhyRepNetSection() {
  return (
    <section id="why-repnet" data-testid="timeline-section" className="py-28 md:py-36 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/50 to-white" />
      <div className="absolute inset-0 dot-grid opacity-[0.2]" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20 max-w-2xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 font-['Outfit'] bg-blue-50 px-3 py-1 rounded-full">
            Why RepNet
          </span>
          <h2 className="text-4xl sm:text-5xl tracking-tight font-bold text-slate-900 font-['Outfit'] mt-5 leading-[1.1]">
            Built for teams who are{" "}
            <span className="bg-gradient-to-r from-[#0055FF] to-[#6366F1] bg-clip-text text-transparent">
              tired of waiting
            </span>{" "}
            for reports
          </h2>
          <p className="text-lg text-slate-500 mt-4">
            Real results from day one. No training needed. No consultants required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              data-testid={`timeline-phase-${i}`}
              className="group"
            >
              <div className={`bg-white rounded-2xl border ${b.border} p-7 h-full transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/[0.05]`}>
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl ${b.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <b.icon size={22} className={b.color} />
                  </div>
                  <span className={`text-3xl font-black font-['Outfit'] ${b.color} tracking-tight opacity-90`}>
                    {b.stat}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 font-['Outfit'] mb-1.5">{b.label}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
