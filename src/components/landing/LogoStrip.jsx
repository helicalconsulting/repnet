import { motion } from "framer-motion";

const logos = [
  { name: "SYSPRO", url: "https://static.prod-images.emergentagent.com/jobs/1b50ded6-5f6b-43ec-bb6e-1400db92ec24/images/b16d6877fe2259ae1d4af680ca188324ad844820c6ea81cfc164ca44c0b35135.png" },
  { name: "Acumatica", url: "https://static.prod-images.emergentagent.com/jobs/1b50ded6-5f6b-43ec-bb6e-1400db92ec24/images/c90756a8c1d8fa29735ab682462ed4bbf6c2e74d516f345882229d52e4a00977.png" },
  { name: "Sage", url: "https://static.prod-images.emergentagent.com/jobs/1b50ded6-5f6b-43ec-bb6e-1400db92ec24/images/33b51baf0cc935a455b244bba0ab023f847b9c0c046a8f83742865cc8526e56a.png" },
  { name: "Epicor", url: "https://static.prod-images.emergentagent.com/jobs/1b50ded6-5f6b-43ec-bb6e-1400db92ec24/images/c0c22824ff18de96d590750ea816b69f88f1d2db0b652e1af24fa1500570f614.png" },
];

export default function LogoStrip() {
  return (
    <section data-testid="logo-strip" className="py-20 border-y border-slate-100/80 relative overflow-hidden bg-white">
      {/* Subtle bg */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50" />
      
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-12"
        >
          Trusted by teams using leading ERP systems
        </motion.p>
        <div className="overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="flex animate-marquee items-center gap-16">
            {[...logos, ...logos, ...logos, ...logos].map((logo, i) => (
              <motion.div
                key={`${logo.name}-${i}`}
                whileHover={{ scale: 1.15 }}
                className="flex-shrink-0 flex items-center gap-4 transition-all duration-300 cursor-pointer px-6 py-3 rounded-xl hover:bg-blue-50/50"
                data-testid={`logo-${logo.name.toLowerCase()}-${i}`}
              >
                <img src={logo.url} alt={logo.name} className="h-11 w-auto object-contain" />
                <span className="text-lg font-bold text-slate-800 font-['Outfit'] whitespace-nowrap tracking-tight">{logo.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
