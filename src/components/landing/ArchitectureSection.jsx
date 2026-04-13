import { motion } from "framer-motion";
import { MessageSquare, Database, BarChart3, Share2, CheckCircle2 } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Database,
    title: "Connect Your ERP",
    desc: "Securely link your SYSPRO, Acumatica, Sage, or Epicor database. We support SQL Server and Oracle. Your data never leaves your infrastructure.",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
  },
  {
    num: "02",
    icon: MessageSquare,
    title: "Ask in Plain English",
    desc: "Type questions like you'd ask a colleague: \"What were our top 10 products by revenue last quarter?\" No SQL knowledge needed.",
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
  },
  {
    num: "03",
    icon: BarChart3,
    title: "Get Instant Results",
    desc: "See tables, charts, and summaries in seconds. AI recommends the best visualization for your data. Export or drill down further.",
    color: "from-violet-500 to-violet-600",
    borderColor: "border-violet-100",
    bgColor: "bg-violet-50",
  },
  {
    num: "04",
    icon: Share2,
    title: "Share & Collaborate",
    desc: "Pin reports to dashboards. Share with your team via secure links. Set up automated alerts for metric changes.",
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-100",
  },
];

export default function ArchitectureSection() {
  return (
    <section id="architecture" data-testid="architecture-section" className="py-28 md:py-36 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/80" />
      <div className="absolute inset-0 dot-grid opacity-[0.25]" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20 max-w-2xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 font-['Outfit'] bg-blue-50 px-3 py-1 rounded-full">
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl tracking-tight font-bold text-slate-900 font-['Outfit'] mt-5 leading-[1.1]">
            From question to insight<br />
            <span className="bg-gradient-to-r from-[#0055FF] to-[#6366F1] bg-clip-text text-transparent">in four simple steps</span>
          </h2>
          <p className="text-lg text-slate-500 mt-4">
            No technical expertise required. If you can type a question, you can generate a report.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              data-testid={`arch-step-${i}`}
              className="group relative"
            >
              <div className={`relative bg-white rounded-2xl border ${step.borderColor} p-7 h-full transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/[0.06]`}>
                {/* Step number background */}
                <div className="absolute top-5 right-5 text-6xl font-black text-slate-100/70 font-['Outfit'] leading-none select-none group-hover:text-blue-50 transition-colors duration-500">
                  {step.num}
                </div>

                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl ${step.bgColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon size={22} className="text-[#0055FF]" />
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 font-['Outfit'] mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>

                  {/* Checkmarks for trust */}
                  {i === 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {["Read-only access", "AES-256 encrypted", "SOC2 ready"].map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <CheckCircle2 size={10} /> {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Connector line (desktop) */}
                {i < 3 && (
                  <div className="hidden md:block absolute -bottom-3 left-1/2 w-px h-6 bg-gradient-to-b from-slate-200 to-transparent" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <motion.button
            onClick={() => document.querySelector("#waitlist")?.scrollIntoView({ behavior: "smooth" })}
            whileHover={{ scale: 1.03, boxShadow: "0 12px 40px rgba(0,85,255,0.25)" }}
            whileTap={{ scale: 0.97 }}
            className="bg-gradient-to-r from-[#0055FF] to-[#3B82F6] text-white px-8 py-4 rounded-xl font-semibold text-sm shadow-xl shadow-blue-500/20 inline-flex items-center gap-2"
            data-testid="architecture-cta"
          >
            Start generating reports today
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
