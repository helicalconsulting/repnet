import { useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { MessageSquareText, BarChart3, LayoutDashboard, ShieldAlert, ArrowUpRight } from "lucide-react";

function SpotlightCard({ children, className = "" }) {
  const ref = useRef(null);
  const handleMouse = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    ref.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouse}
      className={`spotlight-card feature-card ${className}`}
    >
      <div className="spotlight-gradient rounded-2xl" />
      {children}
    </div>
  );
}

const features = [
  {
    icon: MessageSquareText,
    title: "Natural Language to SQL",
    description: "Just type what you need. Our AI understands your ERP schema and writes optimized SQL instantly.",
    span: "md:col-span-2 md:row-span-1",
    gradient: "from-blue-500/10 to-indigo-500/5",
    detail: (
      <div className="mt-5 bg-[#0F172A] rounded-xl p-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="relative space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">YOU</span>
            <span className="text-xs text-slate-400 font-mono">"Show me all overdue invoices over $10K"</span>
          </div>
          <div className="border-l-2 border-blue-500/30 pl-3 ml-1">
            <span className="text-[10px] text-emerald-400 font-mono block mb-1">Generated SQL</span>
            <code className="text-[11px] text-slate-300 font-mono leading-relaxed block">
              <span className="text-blue-400">SELECT</span> inv_number, customer, amount<br />
              <span className="text-blue-400">FROM</span> ar_invoices<br />
              <span className="text-blue-400">WHERE</span> amount {'>'} <span className="text-amber-300">10000</span><br />
              <span className="text-blue-400">AND</span> status = <span className="text-emerald-300">'OVERDUE'</span>
            </code>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: "Instant Visualizations",
    description: "One click converts any table into beautiful charts. AI picks the best chart type for your data.",
    span: "md:col-span-1 md:row-span-1",
    gradient: "from-violet-500/10 to-purple-500/5",
    detail: (
      <div className="mt-5 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100 p-4">
        <div className="flex items-end gap-2 h-24">
          {[40, 65, 50, 85, 55, 72, 92, 60, 78].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              whileInView={{ height: `${h}%` }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: "backOut" }}
              className="flex-1 rounded-md"
              style={{
                minHeight: 4,
                background: i === 6
                  ? "linear-gradient(to top, #0055FF, #6366F1)"
                  : `rgba(0,85,255,${0.08 + (h / 600)})`,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-3">
          <span className="text-[9px] text-slate-400 font-mono">Jan</span>
          <span className="text-[9px] text-slate-400 font-mono">Sep</span>
        </div>
      </div>
    ),
  },
  {
    icon: LayoutDashboard,
    title: "Custom Dashboards",
    description: "Pin your reports to drag-and-drop dashboards. Share them with your team via secure links.",
    span: "md:col-span-1 md:row-span-1",
    gradient: "from-sky-500/10 to-cyan-500/5",
    detail: (
      <div className="mt-5 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 h-12 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-100/60 flex items-center px-3">
            <div className="flex gap-1">{[20,30,25,35,28].map((h,i)=><div key={i} className="w-1.5 rounded-full bg-blue-400/60" style={{height:h}} />)}</div>
          </div>
          <div className="h-12 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100/60 flex items-center justify-center">
            <span className="text-lg font-bold text-indigo-600 font-['Outfit']">87%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-100/60 flex items-center px-3">
            <span className="text-[10px] text-emerald-600 font-medium">+12.4% MoM</span>
          </div>
          <div className="h-10 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-100/60 flex items-center px-3">
            <span className="text-[10px] text-amber-600 font-medium">$2.4M Revenue</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: ShieldAlert,
    title: "Smart Anomaly Alerts",
    description: "AI monitors your metrics 24/7 and instantly alerts you when something unusual happens. Stay ahead of problems.",
    span: "md:col-span-2 md:row-span-1",
    gradient: "from-rose-500/10 to-orange-500/5",
    detail: (
      <div className="mt-5 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[180px] relative h-20 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100 p-3 overflow-hidden">
          <svg viewBox="0 0 200 50" className="w-full h-full">
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
            <path d="M0,35 Q25,33 50,28 T100,22 T140,18 T160,40 T200,20" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
            <path d="M0,35 Q25,33 50,28 T100,22 T140,18 T160,40 T200,20" fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="160" cy="40" r="5" fill="none" stroke="#EF4444" strokeWidth="1.5">
              <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="160" cy="40" r="3" fill="#EF4444" />
          </svg>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-2.5"
        >
          <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-700">Revenue anomaly detected</p>
            <p className="text-[10px] text-red-500 mt-0.5">Region B dropped 23% vs. last week</p>
          </div>
        </motion.div>
      </div>
    ),
  },
];

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function FeaturesGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" data-testid="features-section" className="py-28 md:py-36 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/[0.02] rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 max-w-2xl"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 font-['Outfit'] bg-blue-50 px-3 py-1 rounded-full">
            Capabilities
          </span>
          <h2 className="text-4xl sm:text-5xl tracking-tight font-bold text-slate-900 font-['Outfit'] mt-5 leading-[1.1]">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-[#0055FF] to-[#6366F1] bg-clip-text text-transparent">
              master your ERP data
            </span>
          </h2>
          <p className="text-lg text-slate-500 mt-4 leading-relaxed">
            Stop waiting days for reports. Get answers in seconds with AI that understands your business.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants} className={feature.span}>
              <SpotlightCard
                className={`bg-white border border-slate-200/80 rounded-2xl p-7 h-full bg-gradient-to-br ${feature.gradient}`}
              >
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center mb-5 shadow-sm group-hover:shadow-md transition-shadow">
                    <feature.icon size={20} className="text-[#0055FF]" />
                  </div>
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-semibold text-slate-900 font-['Outfit']" data-testid={`feature-card-${feature.title.replace(/\s+/g, '-').toLowerCase()}`}>
                      {feature.title}
                    </h3>
                    <ArrowUpRight size={16} className="text-slate-300 mt-1 flex-shrink-0" />
                  </div>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{feature.description}</p>
                  {feature.detail}
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
