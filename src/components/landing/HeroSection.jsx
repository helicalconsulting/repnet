import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/1b50ded6-5f6b-43ec-bb6e-1400db92ec24/images/2e505fba189137fd9c570f2ce59e906eb741c9704edbc47a95a8902ce38dc051.png";

const typingQueries = [
  "Show me total revenue by product category for Q4...",
  "List all overdue invoices above $10K from last month...",
  "Compare sales performance across all regions YoY...",
  "Which suppliers had the highest lead times in Q3...",
  "Show inventory turnover rate by warehouse location...",
];

function useTypingAnimation(strings, typingSpeed = 40, pauseTime = 2500) {
  const [display, setDisplay] = useState("");
  const [strIdx, setStrIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = strings[strIdx];
    let timeout;

    if (!isDeleting && charIdx <= current.length) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx));
        setCharIdx(charIdx + 1);
      }, typingSpeed);
    } else if (!isDeleting && charIdx > current.length) {
      timeout = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && charIdx > 0) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx - 1));
        setCharIdx(charIdx - 1);
      }, typingSpeed / 2);
    } else {
      setIsDeleting(false);
      setStrIdx((strIdx + 1) % strings.length);
      setCharIdx(0);
    }

    return () => clearTimeout(timeout);
  }, [charIdx, isDeleting, strIdx, strings, typingSpeed, pauseTime]);

  return display;
}

function AnimatedCounter({ value, suffix = "", prefix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = parseInt(value);
    if (isNaN(end)) return;
    const duration = 1500;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return <span ref={ref}>{prefix}{isNaN(parseInt(value)) ? value : count}{suffix}</span>;
}

export default function HeroSection() {
  const typedText = useTypingAnimation(typingQueries, 35, 2200);
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const scrollTo = (id) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      data-testid="hero-section"
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
    >
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="orb-1 absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-blue-400/[0.04] blur-3xl" />
        <div className="orb-2 absolute top-[40%] right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-400/[0.05] blur-3xl" />
        <div className="orb-3 absolute bottom-[10%] left-[40%] w-[400px] h-[400px] rounded-full bg-sky-300/[0.04] blur-3xl" />
      </div>

      {/* Background image with parallax */}
      <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
        <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-[0.06]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-white" />
      </motion.div>

      {/* Dot grid pattern */}
      <div className="absolute inset-0 z-0 dot-grid opacity-[0.35]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-16 w-full">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2.5 bg-white/80 backdrop-blur-sm border border-blue-100/80 rounded-full px-4 py-1.5 mb-8 shadow-sm"
          >
            <Sparkles size={12} className="text-[#0055FF]" />
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600 font-['Outfit']">
              AI-Powered ERP Analytics
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl lg:text-[4.5rem] tracking-tighter font-bold text-slate-900 font-['Outfit'] leading-[1.02]"
          >
            Turn plain English into{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-[#0055FF] via-[#3B82F6] to-[#6366F1] bg-clip-text text-transparent">
                ERP reports
              </span>
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-3 bg-blue-100/50 rounded-sm -z-0"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                style={{ originX: 0 }}
              />
            </span>{" "}
            in seconds.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-6 text-lg sm:text-xl text-slate-500 leading-relaxed max-w-xl font-['Manrope']"
          >
            Connect your SYSPRO, Acumatica, Sage, or Epicor database. Ask questions in natural language. Get instant charts, dashboards, and anomaly alerts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <motion.button
              data-testid="hero-waitlist-btn"
              onClick={() => {
                const navigate = (import('react-router-dom')).then(m => m.useNavigate()('/dashboard')).catch(() => window.location.href='/dashboard');
                window.location.href = '/dashboard';
              }}
              whileHover={{ scale: 1.04, boxShadow: "0 12px 40px rgba(0,85,255,0.3)" }}
              whileTap={{ scale: 0.97 }}
              className="group bg-gradient-to-r from-[#0055FF] to-[#3B82F6] text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center gap-2.5 text-sm shadow-xl shadow-blue-500/25"
            >
              Go to Dashboard
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </motion.button>
            <motion.button
              data-testid="hero-demo-btn"
              onClick={() => scrollTo("#features")}
              whileHover={{ scale: 1.03, backgroundColor: "rgba(248,250,252,1)" }}
              whileTap={{ scale: 0.97 }}
              className="group bg-white/60 backdrop-blur-sm text-slate-700 hover:text-slate-900 border border-slate-200/80 px-8 py-4 rounded-xl font-semibold transition-all flex items-center gap-2.5 text-sm shadow-sm"
            >
              <Play size={14} className="text-[#0055FF]" />
              See How It Works
            </motion.button>
          </motion.div>

          {/* Animated Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-16 flex gap-10 sm:gap-16"
          >
            {[
              { value: "500", prefix: "$", suffix: "-2K", label: "Saved per report" },
              { value: "30", prefix: "< ", suffix: "s", label: "Report generation" },
              { value: "4", suffix: "+", label: "ERPs supported" },
            ].map((stat) => (
              <div key={stat.label} data-testid={`hero-stat-${stat.label.replace(/\s/g, '-').toLowerCase()}`} className="group">
                <div className="text-3xl font-bold text-slate-900 font-['Outfit'] tracking-tight group-hover:text-[#0055FF] transition-colors duration-300">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-slate-400 mt-1.5 font-medium tracking-wide">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Demo Preview Card with parallax */}
        <motion.div
          style={{ y: cardY }}
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-[460px]"
        >
          <div className="animate-float-card">
            <div className="glass-card rounded-2xl shadow-2xl shadow-slate-300/30 overflow-hidden animate-glow-pulse">
              {/* Terminal header */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-100 px-5 py-3.5 flex items-center gap-2.5">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-sm" />
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E] shadow-sm" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-sm" />
                </div>
                <span className="text-[10px] text-slate-400 ml-2 font-mono tracking-wider">repnet-ai-copilot</span>
              </div>
              {/* Chat simulation with typing */}
              <div className="p-5 space-y-4 bg-white/50" data-testid="hero-demo-preview">
                {/* User message with typing */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-slate-500 font-semibold">You</span>
                  </div>
                  <div className="bg-slate-50/80 rounded-xl px-4 py-3 text-sm text-slate-700 border border-slate-100/80 min-h-[44px] flex-1">
                    <span>{typedText}</span>
                    <span className="typing-cursor" />
                  </div>
                </div>
                {/* AI response */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0055FF] to-[#3B82F6] flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                    <Sparkles size={10} className="text-white" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="bg-blue-50/60 rounded-xl px-4 py-3 text-sm text-slate-600 border border-blue-100/50">
                      <p className="text-[10px] text-blue-500 font-mono mb-2 font-medium">Generated SQL:</p>
                      <code className="text-[11px] text-slate-500 font-mono leading-relaxed block">
                        SELECT category, SUM(amount)<br />
                        FROM sales WHERE quarter = 'Q4'<br />
                        GROUP BY category ORDER BY 2 DESC
                      </code>
                    </div>
                    {/* Animated mini chart */}
                    <div className="bg-white rounded-xl border border-slate-100 p-3">
                      <div className="flex items-end gap-1.5 h-16">
                        {[75, 60, 90, 45, 80, 55, 70].map((h, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: 1.4 + i * 0.08, duration: 0.5, ease: "backOut" }}
                            className="flex-1 rounded-sm"
                            style={{
                              minHeight: 4,
                              background: `linear-gradient(to top, #0055FF, ${i === 2 ? '#6366F1' : '#3B82F6'})`,
                              opacity: 0.75 + (h / 400),
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2.5 font-medium">Revenue by Category - Q4 2024</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
