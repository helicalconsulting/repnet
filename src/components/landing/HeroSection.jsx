import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import DotField from "../DotField";
import EarlyBirdBanner from "./EarlyBirdBanner";

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

      <div className="relative z-10 max-w-[90rem] mx-auto px-6 md:px-12 lg:px-16 w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
        <div className="max-w-3xl w-full">
          {/* Badge */}

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl lg:text-[4.5rem] tracking-tighter font-bold text-slate-900 font-['Outfit'] leading-[1.02]"
          >
            Fed up with Crystal Reports and Power BI?
            <span className="relative inline-block mt-4">
              <span className="relative z-10 bg-gradient-to-r from-[#0055FF] via-[#3B82F6] to-[#6366F1] bg-clip-text text-transparent block">
                Talk to your data with Repnex.
              </span>
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-3 bg-blue-100/50 rounded-sm -z-0"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                style={{ originX: 0 }}
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-6 text-lg sm:text-xl text-slate-500 leading-relaxed max-w-xl font-['Manrope']"
          >
            Stop building reports manually. Ask in plain English, get answers in seconds, and share insights your team can act on instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-10"
          >
            <EarlyBirdBanner />
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
        className="hidden lg:block w-full max-w-[480px] flex-shrink-0"
      >
        <div className="animate-float-card">
          <div className="bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-[3px] border-black overflow-hidden animate-glow-pulse">
            {/* Terminal header */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-black px-5 py-3.5 flex items-center gap-2.5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57] border-[1px] border-black" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border-[1px] border-black" />
                <div className="w-3 h-3 rounded-full bg-[#28C840] border-[1px] border-black" />
              </div>
              <span className="text-[10px] text-black font-bold ml-2 font-mono tracking-wider uppercase">repnex-ai-copilot</span>
            </div>
            {/* Chat simulation with typing */}
            <div className="p-5 space-y-4 bg-white" data-testid="hero-demo-preview">
              {/* User message with typing */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full border-[2px] border-black bg-white flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] text-black font-bold">You</span>
                </div>
                <div className="bg-white rounded-xl px-4 py-3 text-sm text-black border-[2px] border-black min-h-[44px] flex-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-medium">
                  <span>{typedText}</span>
                  <span className="typing-cursor" />
                </div>
              </div>
              {/* AI response */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full border-[2px] border-black bg-[#0055FF] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Sparkles size={10} className="text-white" />
                </div>
                <div className="space-y-3 flex-1">
                  <div className="bg-white rounded-xl px-4 py-3 text-sm text-black border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[10px] text-[#0055FF] font-mono mb-2 font-bold">Generated SQL:</p>
                    <code className="text-[11px] text-black font-mono leading-relaxed block font-medium">
                      SELECT category, SUM(amount)<br />
                      FROM sales WHERE quarter = 'Q4'<br />
                      GROUP BY category ORDER BY 2 DESC
                    </code>
                  </div>
                  {/* Animated mini chart */}
                  <div className="bg-white rounded-xl border-[2px] border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-end gap-1.5 h-16">
                      {[75, 60, 90, 45, 80, 55, 70].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 1.4 + i * 0.08, duration: 0.5, ease: "backOut" }}
                          className="flex-1 rounded-sm border-[1px] border-black"
                          style={{
                            minHeight: 4,
                            background: '#0055FF',
                            opacity: 0.85 + (h / 400),
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-black mt-2.5 font-bold uppercase">Revenue by Category - Q4 2024</p>
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
