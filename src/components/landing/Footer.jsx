import { motion } from "framer-motion";
import { Code, MessageCircle, Globe, Mail } from "lucide-react";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#architecture" },
      { label: "Pricing", href: "#pricing" },
      { label: "See It In Action", href: "#documentation" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
      { label: "DPA", href: "#" },
    ],
  },
];

export default function Footer() {
  const scrollTo = (href) => {
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer data-testid="footer" className="border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/80 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <img src="/270970406.jpeg" alt="RepNet logo" className="h-full w-full object-contain rounded-md" />
              </div>
              <span className="text-lg font-bold text-slate-900 font-['Outfit'] tracking-tight">
                RepNet
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              AI-powered ERP reporting for non-technical users. Generate reports in seconds, not days.
            </p>
            <div className="flex gap-2.5 mt-6">
              {[
                { icon: MessageCircle, label: "twitter" },
                { icon: Globe, label: "linkedin" },
                { icon: Code, label: "github" },
                { icon: Mail, label: "email" },
              ].map(({ icon: Icon, label }) => (
                <motion.a
                  key={label}
                  href="#"
                  data-testid={`footer-social-${label}`}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-xl border border-slate-200/80 flex items-center justify-center text-slate-400 hover:text-[#0055FF] hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                >
                  <Icon size={15} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-5 font-['Outfit']">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => scrollTo(link.href)}
                      data-testid={`footer-link-${link.label.toLowerCase()}`}
                      className="text-sm text-slate-500 hover:text-[#0055FF] transition-colors hover-underline"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} RepNet. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            Built for SYSPRO, Acumatica, Sage & Epicor
          </p>
        </div>
      </div>
    </footer>
  );
}
