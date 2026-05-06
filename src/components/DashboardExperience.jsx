import { useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import {
  MessageSquareText,
  BarChart3,
  LayoutDashboard,
  ShieldAlert,
  Database,
  ShieldCheck,
  Zap,
  ArrowRight,
  FileText,
  Code2,
  Server,
  Shield,
  Brain,
  Calendar,
  Rocket,
  TestTube,
  Users,
  Layers,
  Check,
} from 'lucide-react';

const HERO_BG = 'https://static.prod-images.emergentagent.com/jobs/1b50ded6-5f6b-43ec-bb6e-1400db92ec24/images/2e505fba189137fd9c570f2ce59e906eb741c9704edbc47a95a8902ce38dc051.png';
const ARCH_IMG = 'https://static.prod-images.emergentagent.com/jobs/1b50ded6-5f6b-43ec-bb6e-1400db92ec24/images/75804f15bdc7f64f5f28511fff32b0f6c8db34ccbec3f7f6af3f4efb455ebeee.png';

const logoItems = [
  { name: 'SYSPRO', url: 'https://static.prod-images.emergentagent.com/jobs/1b50ded6-5f6b-43ec-bb6e-1400db92ec24/images/b16d6877fe2259ae1d4af680ca188324ad844820c6ea81cfc164ca44c0b35135.png' },
  { name: 'Acumatica', url: 'https://static.prod-images.emergentagent.com/jobs/1b50ded6-5f6b-43ec-bb6e-1400db92ec24/images/c90756a8c1d8fa29735ab682462ed4bbf6c2e74d516f345882229d52e4a00977.png' },
  { name: 'Sage', url: 'https://static.prod-images.emergentagent.com/jobs/1b50ded6-5f6b-43ec-bb6e-1400db92ec24/images/33b51baf0cc935a455b244bba0ab023f847b9c0c046a8f83742865cc8526e56a.png' },
  { name: 'Epicor', url: 'https://static.prod-images.emergentagent.com/jobs/1b50ded6-5f6b-43ec-bb6e-1400db92ec24/images/c0c22824ff18de96d590750ea816b69f88f1d2db0b652e1af24fa1500570f614.png' },
];

const featureCards = [
  {
    icon: MessageSquareText,
    title: 'Natural Language to SQL',
    description: 'Ask questions in plain English. Our AI understands your ERP schema and generates optimized SQL queries instantly.',
    span: 'md:col-span-2',
  },
  {
    icon: BarChart3,
    title: 'One-Click Charts',
    description: 'Instantly convert table results into interactive charts. AI recommends the best chart type for each query.',
    span: 'md:col-span-1',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard Builder',
    description: 'Pin reports, drag-and-drop widgets, and share dashboards securely across teams.',
    span: 'md:col-span-1',
  },
  {
    icon: ShieldAlert,
    title: 'Anomaly Detection',
    description: 'Monitor KPI drift and surface actionable alerts before performance drops become expensive.',
    span: 'md:col-span-2',
  },
];

const architectureSteps = [
  { icon: Database, label: 'Connect ERP', desc: 'Securely link SQL Server or Oracle with encrypted credentials.' },
  { icon: Zap, label: 'AI Processes', desc: 'Schema-aware prompts and optimized SQL generation.' },
  { icon: ShieldCheck, label: 'Validated Output', desc: 'Read-only, schema-validated query execution.' },
];

const docsTopics = [
  {
    id: 'overview',
    icon: FileText,
    label: 'Executive Summary',
    title: 'AI Copilot for SYSPRO ERP',
    body: `Repnex enables non-technical ERP users to generate report-ready SQL from natural language.

It connects to SQL Server and Oracle sources used by SYSPRO, Acumatica, Sage, and Epicor. Output is auto-visualized as interactive charts and can be pinned to dashboards.`,
  },
  {
    id: 'stack',
    icon: Code2,
    label: 'Tech Stack',
    title: 'Recommended Stack',
    body: `Frontend: React + Tailwind + Recharts
Backend: FastAPI + SQLAlchemy
AI: LLM-driven NL→SQL with schema context`,
  },
  {
    id: 'api',
    icon: Server,
    label: 'API Endpoints',
    title: 'Core API Surface',
    body: `POST /api/query/generate
POST /api/query/execute
GET  /api/dashboards
POST /api/dashboards/:id/pin`,
  },
  {
    id: 'security',
    icon: Shield,
    label: 'Security Model',
    title: 'Enterprise Security',
    body: `AES-256 encrypted credentials, SELECT-only SQL validation, tenant isolation, and complete audit trails.`,
  },
  {
    id: 'ai',
    icon: Brain,
    label: 'AI Architecture',
    title: 'Prompt Pipeline',
    body: `Tenant schema is injected into system prompts. Queries are validated, retried with context, and logged for quality improvements.`,
  },
];

const roadmapPhases = [
  { icon: Code2, weeks: 'Weeks 1-4', title: 'Core Engine' },
  { icon: Layers, weeks: 'Weeks 5-10', title: 'Reporting UI' },
  { icon: Rocket, weeks: 'Weeks 11-16', title: 'Dashboards & Sharing' },
  { icon: TestTube, weeks: 'Weeks 17-20', title: 'Beta Hardening' },
  { icon: Users, weeks: 'Weeks 21-24', title: 'Anomaly + Tasks' },
  { icon: Calendar, weeks: 'Weeks 25-28', title: 'Scale & Launch' },
];

const pricingPlans = [
  { name: 'Starter', price: '$99', period: '/month', features: ['1 ERP connection', '5 users', '500 AI queries/month'] },
  { name: 'Pro', price: '$299', period: '/month', features: ['3 ERP connections', '25 users', 'Unlimited dashboards'], highlight: true },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited connections', 'Unlimited users', 'SSO / SAML'] },
];

function SectionTitle({ label, title, description }) {
  return (
    <div className="mb-12">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">{label}</span>
      <h2 className="text-3xl sm:text-4xl tracking-tight font-semibold text-slate-900 mt-3">{title}</h2>
      {description ? <p className="text-base text-slate-500 mt-3 max-w-xl">{description}</p> : null}
    </div>
  );
}

export default function DashboardExperience() {
  const [activeTopic, setActiveTopic] = useState('overview');
  const activeDoc = useMemo(
    () => docsTopics.find((topic) => topic.id === activeTopic) ?? docsTopics[0],
    [activeTopic],
  );

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-white">
      <section className="relative overflow-hidden pt-14 pb-20 border-b border-slate-100">
        <div className="absolute inset-0 z-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-[0.08]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-white" />
        </div>
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#0055FF 1px, transparent 1px), linear-gradient(90deg, #0055FF 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <Motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-semibold tracking-tight text-slate-900 max-w-4xl">
            Integrated Repnex dashboard experience from <span className="text-[#0055FF]">ui-repnex</span>
          </Motion.h1>
          <p className="mt-6 text-slate-600 max-w-2xl">
            Your workspace now includes the full product-style dashboard sections: capabilities, architecture, docs, roadmap, and pricing.
          </p>
        </div>
      </section>

      <section className="py-14 border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 overflow-hidden">
          <div className="flex animate-marquee items-center gap-20">
            {[...logoItems, ...logoItems, ...logoItems].map((logo, i) => (
              <div key={`${logo.name}-${i}`} className="flex-shrink-0 flex items-center gap-3 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <img src={logo.url} alt={logo.name} className="h-10 w-auto object-contain" />
                <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <SectionTitle label="Capabilities" title="Everything you need to master ERP data" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featureCards.map((feature) => (
              <div key={feature.title} className={`${feature.span} bg-white border border-slate-200 rounded-lg p-7 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,85,255,0.06)] hover:border-blue-500/30 transition-all`}>
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <feature.icon size={20} className="text-[#0055FF]" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-500 mt-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <SectionTitle label="How It Works" title="Built for enterprise-grade security and speed" />
              <div className="space-y-5">
                {architectureSteps.map((step) => (
                  <div key={step.label} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <step.icon size={18} className="text-[#0055FF]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{step.label}</h4>
                      <p className="text-sm text-slate-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-3 flex-wrap">
                {['User Chat', 'NL Engine', 'SQL Gen', 'ERP DB', 'Report', 'Dashboard'].map((step, i, arr) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-600">{step}</span>
                    {i < arr.length - 1 && <ArrowRight size={12} className="text-slate-300" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl shadow-slate-200/40">
              <img src={ARCH_IMG} alt="System Architecture" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <SectionTitle label="Documentation" title="Deep technical overview" />
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex flex-col md:flex-row min-h-[420px]">
              <div className="md:w-64 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 p-3">
                {docsTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setActiveTopic(topic.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                      activeTopic === topic.id
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                    }`}
                  >
                    <topic.icon size={16} className={activeTopic === topic.id ? 'text-[#0055FF]' : 'text-slate-400'} />
                    {topic.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 p-6 md:p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{activeDoc.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">{activeDoc.body}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <SectionTitle label="Roadmap" title="Project timeline" description="28-week plan from foundation to general availability." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roadmapPhases.map((phase) => (
              <div key={phase.weeks} className="bg-white border border-slate-200 rounded-lg p-6 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,85,255,0.06)] transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg border border-blue-100 bg-blue-50 text-blue-600 flex items-center justify-center">
                    <phase.icon size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{phase.weeks}</span>
                    <h3 className="text-sm font-semibold text-slate-900">{phase.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <SectionTitle label="Pricing" title="Simple, transparent pricing" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-7 ${
                  plan.highlight
                    ? 'bg-white border-2 border-[#0055FF] shadow-lg shadow-blue-500/10'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                <div className="mt-3 mb-5">
                  <span className="text-4xl font-semibold text-slate-900 tracking-tight">{plan.price}</span>
                  <span className="text-sm text-slate-400">{plan.period}</span>
                </div>
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5">
                      <Check size={14} className="mt-0.5 text-[#0055FF]" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
