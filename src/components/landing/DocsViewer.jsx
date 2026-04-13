import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, BarChart3, Database, ChevronRight, Sparkles, DollarSign, Settings2, TrendingUp, Download, Filter, PieChart } from "lucide-react";

const SCREENSHOTS = {
  chat: "https://customer-assets.emergentagent.com/job_nl-to-report/artifacts/c09cab2b_Screenshot%20from%202026-04-13%2013-42-23.png",
  analytics: "https://customer-assets.emergentagent.com/job_nl-to-report/artifacts/me2k7cso_Screenshot%20from%202026-04-13%2013-42-34.png",
  connections: "https://customer-assets.emergentagent.com/job_nl-to-report/artifacts/sd9b8ti4_Screenshot%20from%202026-04-13%2013-42-40.png",
};

const demos = [
  {
    id: "query",
    label: "Ask a Question",
    icon: MessageSquare,
    description: "Type what you need in plain English. Choose from report categories or write your own custom query.",
    highlights: ["Category-based templates", "Smart query suggestions", "Natural language input"],
    screenshot: SCREENSHOTS.chat,
  },
  {
    id: "analytics",
    label: "View Analytics",
    icon: BarChart3,
    description: "See instant results with KPI cards, interactive data tables, and rich visualizations — all generated automatically.",
    highlights: ["Live KPI dashboards", "Draggable data tables", "Auto-generated charts"],
    screenshot: SCREENSHOTS.analytics,
  },
  {
    id: "connections",
    label: "Manage Connections",
    icon: Database,
    description: "Securely connect your ERP databases. Monitor sync status, manage multiple data sources, and view recent chat history.",
    highlights: ["Multi-database support", "Real-time sync status", "Encrypted credentials"],
    screenshot: SCREENSHOTS.connections,
  },
];

export default function ProductShowcase() {
  const [activeId, setActiveId] = useState("query");
  const active = demos.find((d) => d.id === activeId);

  return (
    <section id="documentation" data-testid="docs-section" className="py-28 md:py-36 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/30 to-white" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-blue-500/[0.02] rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 font-['Outfit'] bg-blue-50 px-3 py-1 rounded-full">
            See It In Action
          </span>
          <h2 className="text-4xl sm:text-5xl tracking-tight font-bold text-slate-900 font-['Outfit'] mt-5 leading-[1.1]">
            A product built for{" "}
            <span className="bg-gradient-to-r from-[#0055FF] to-[#6366F1] bg-clip-text text-transparent">
              real users
            </span>
          </h2>
          <p className="text-lg text-slate-500 mt-4">
            From natural language queries to interactive dashboards — see what RepNet delivers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Tab bar */}
          <div className="flex justify-center mb-8" data-testid="docs-sidebar">
            <div className="inline-flex gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-2 shadow-sm">
              {demos.map((demo) => (
                <button
                  key={demo.id}
                  data-testid={`docs-topic-${demo.id}`}
                  onClick={() => setActiveId(demo.id)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    activeId === demo.id
                      ? "bg-gradient-to-r from-[#0055FF] to-[#3B82F6] text-white shadow-lg shadow-blue-500/20"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <demo.icon size={16} />
                  <span className="hidden sm:inline">{demo.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/40" data-testid="docs-content-pane">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {active && (
                  <div className="grid grid-cols-1 lg:grid-cols-5">
                    {/* Left: Info panel */}
                    <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-100">
                      <div className={`w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5`}>
                        <active.icon size={22} className="text-[#0055FF]" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 font-['Outfit'] mb-3">
                        {active.label}
                      </h3>
                      <p className="text-base text-slate-500 leading-relaxed mb-6">
                        {active.description}
                      </p>
                      <div className="space-y-3">
                        {active.highlights.map((h) => (
                          <div key={h} className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <ChevronRight size={10} className="text-[#0055FF]" />
                            </div>
                            <span className="text-sm text-slate-600 font-medium">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Screenshot */}
                    <div className="lg:col-span-3 bg-gradient-to-br from-slate-50/80 to-slate-100/50 p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
                      <div className="w-full rounded-xl overflow-hidden shadow-xl shadow-slate-300/30 border border-slate-200/50 bg-white">
                        {/* Browser chrome */}
                        <div className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200/60 px-4 py-2.5 flex items-center gap-3">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                          </div>
                          <div className="flex-1 flex justify-center">
                            <div className="bg-white/80 rounded-md border border-slate-200/60 px-4 py-1 text-[10px] text-slate-400 font-mono">
                              app.repnet.ai
                            </div>
                          </div>
                        </div>
                        {/* Screenshot */}
                        <img
                          src={active.screenshot}
                          alt={active.label}
                          className="w-full h-auto block"
                          data-testid={`showcase-screenshot-${activeId}`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
