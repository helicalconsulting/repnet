import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2, Loader2, Users, Sparkles } from "lucide-react";
import axios from "axios";

const API = `${import.meta.env.VITE_BACKEND_URL || ''}/api`;

export default function WaitlistSection() {
  const [form, setForm] = useState({ email: "", company: "", erp_system: "" });
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    axios.get(`${API}/waitlist/count`).then(r => setWaitlistCount(r.data.count)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await axios.post(`${API}/waitlist`, form);
      setStatus("success");
      setWaitlistCount(c => c + 1);
    } catch (err) {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <section id="waitlist" data-testid="waitlist-section" className="py-28 md:py-36 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="orb-1 absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-blue-400/[0.04] blur-3xl" />
        <div className="orb-2 absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-400/[0.04] blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 font-['Outfit'] bg-blue-50 px-3 py-1 rounded-full">
              Early Access
            </span>
            <h2 className="text-4xl sm:text-5xl tracking-tight font-bold text-slate-900 font-['Outfit'] mt-5 leading-[1.1]">
              Get early access
            </h2>
            <p className="text-lg text-slate-500 mt-4">
              Be the first to transform how your team generates ERP reports.
            </p>

            {/* Social proof */}
            {waitlistCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-5 inline-flex items-center gap-2 bg-blue-50/80 border border-blue-100 rounded-full px-4 py-2"
              >
                <Users size={14} className="text-blue-500" />
                <span className="text-sm text-blue-700 font-medium">
                  <strong>{waitlistCount}</strong> {waitlistCount === 1 ? 'person has' : 'people have'} joined
                </span>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {status === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-lg"
                data-testid="waitlist-success"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <CheckCircle2 size={56} className="text-emerald-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-2xl font-bold text-slate-900 font-['Outfit']">You're on the list!</h3>
                <p className="text-sm text-slate-500 mt-2">We'll reach out when early access opens.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-8 shadow-xl shadow-slate-200/30" data-testid="waitlist-form">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Work Email *</label>
                  <input
                    type="email"
                    required
                    data-testid="waitlist-email-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 outline-none transition-all bg-white/80"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Company</label>
                  <input
                    type="text"
                    data-testid="waitlist-company-input"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Acme Corp"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 outline-none transition-all bg-white/80"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Current ERP System</label>
                  <select
                    data-testid="waitlist-erp-select"
                    value={form.erp_system}
                    onChange={(e) => setForm({ ...form, erp_system: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 outline-none transition-all bg-white"
                  >
                    <option value="">Select your ERP</option>
                    <option value="SYSPRO">SYSPRO</option>
                    <option value="Acumatica">Acumatica</option>
                    <option value="Sage">Sage</option>
                    <option value="Epicor">Epicor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {status === "error" && (
                  <p className="text-sm text-red-500" data-testid="waitlist-error">{errorMsg}</p>
                )}

                <motion.button
                  type="submit"
                  data-testid="waitlist-submit-btn"
                  disabled={status === "loading"}
                  whileHover={{ scale: 1.02, boxShadow: "0 12px 40px rgba(0,85,255,0.25)" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-[#0055FF] to-[#3B82F6] text-white py-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-blue-500/20"
                >
                  {status === "loading" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Join Waitlist
                    </>
                  )}
                </motion.button>

                <p className="text-[11px] text-slate-400 text-center mt-3">
                  No spam. We'll only email you about early access.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
