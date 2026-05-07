import { motion } from "framer-motion";

const logos = [
  { name: "Acumatica", url: "/logos/Acumatica.png" },
  { name: "Epicor", url: "/logos/Epicor_Logo_Teal_RGB_(1).png" },
  { name: "SYSPRO", url: "/logos/SYSPRO.png" },
  { name: "Sage", url: "/logos/Sage_logo.png" },
];

export default function LogoStrip() {
  return (
    <section data-testid="logo-strip" className="py-28 border-y border-slate-100/80 relative overflow-hidden bg-white">
      {/* Subtle bg */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50" />
      
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-sm font-bold uppercase tracking-[0.4em] text-slate-500 mb-16"
        >
          Trusted by teams using leading ERP systems
        </motion.p>
        <div className="overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="flex animate-marquee items-center gap-16">
            {[...logos, ...logos, ...logos, ...logos, ...logos, ...logos].map((logo, i) => (
              <motion.div
                key={`${logo.name}-${i}`}
                whileHover={{ scale: 1.15 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="flex-shrink-0 flex items-center transition-all duration-300 cursor-pointer px-10 py-4 rounded-2xl hover:bg-blue-50/50"
                data-testid={`logo-${logo.name.toLowerCase()}-${i}`}
              >
                <img src={logo.url} alt={logo.name} className="h-12 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
