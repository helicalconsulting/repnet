import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
  { label: "Docs", href: "#documentation" },
  { label: "Pricing", href: "#pricing" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);

      const sections = navLinks.map(l => l.href.replace("#", ""));
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(sections[i]);
          return;
        }
      }
      setActiveSection("");
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} data-testid="scroll-progress" />
      <motion.header
        data-testid="header-nav"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/75 backdrop-blur-2xl border-b border-slate-200/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="flex items-center justify-between h-16">
            <Link to="/" data-testid="header-logo" className="flex items-center gap-2.5 group">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center bg-white p-1 pb-1.5 border border-border">
                <img src="/270970406.jpeg" alt="Logo" className="w-full h-full object-contain filter hue-rotate-15 contrast-125" />
              </div>
              <span className="text-lg font-semibold text-slate-900 font-['Outfit'] tracking-tight">
                RepNet
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1" data-testid="desktop-nav">
              {navLinks.map((link) => {
                const sectionId = link.href.replace("#", "");
                const isActive = activeSection === sectionId;
                return (
                  <button
                    key={link.href}
                    data-testid={`nav-link-${link.label.toLowerCase()}`}
                    onClick={() => scrollTo(link.href)}
                    className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-md ${
                      isActive ? "text-[#0055FF]" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-blue-50/80 rounded-md -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <motion.button
                data-testid="nav-dashboard-btn"
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.03, boxShadow: "0 8px 30px rgba(0,85,255,0.25)" }}
                whileTap={{ scale: 0.97 }}
                className="bg-gradient-to-r from-[#0055FF] to-[#3B82F6] text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
              >
                Go to Dashboard
              </motion.button>
            </div>

            <motion.button
              data-testid="mobile-menu-toggle"
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileOpen(!mobileOpen)}
              whileTap={{ scale: 0.9 }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden bg-white/95 backdrop-blur-2xl border-b border-slate-200"
              data-testid="mobile-menu"
            >
              <div className="px-6 py-4 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.button
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => scrollTo(link.href)}
                    className="block w-full text-left text-sm font-medium text-slate-600 hover:text-[#0055FF] hover:bg-blue-50/50 py-2.5 px-3 rounded-lg transition-all"
                  >
                    {link.label}
                  </motion.button>
                ))}
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-[#0055FF] to-[#3B82F6] text-white px-5 py-2.5 rounded-lg text-sm font-medium mt-3"
                >
                  Go to Dashboard
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
