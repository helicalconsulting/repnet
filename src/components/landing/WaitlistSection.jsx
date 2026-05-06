import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Users, Sparkles } from "lucide-react";
import axios from "axios";

const API = `${import.meta.env.VITE_BACKEND_URL || ''}/api`;
const subscribeReasons = [
  "Replace Crystal Reports and Power BI back-and-forth with natural language analytics.",
  "Get launch updates, demos, and product education before public release.",
  "Get priority onboarding support for your ERP stack.",
];

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
              Subscribe to learn more
            </h2>
            <p className="text-lg text-slate-500 mt-4">
              Join the Repnex early list and see why teams are switching to conversational reporting.
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

            <div className="mt-6 space-y-3 text-left">
              {subscribeReasons.map((reason) => (
                <div key={reason} className="flex items-start gap-2.5 rounded-lg bg-white/70 border border-slate-200/70 px-4 py-3">
                  <CheckCircle2 size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600">{reason}</p>
                </div>
              ))}
            </div>
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
                <p className="text-sm text-slate-500 mt-2">Thanks for subscribing. We'll share updates shortly.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 bg-white/80 backdrop-blur-sm rounded-2xl border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" data-testid="waitlist-form">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Work Email *</label>
                  <input
                    type="email"
                    required
                    data-testid="waitlist-email-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3.5 rounded-xl border-[2px] border-black text-sm text-slate-900 placeholder:text-slate-500 focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all bg-white/80 font-bold"
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
                    className="w-full px-4 py-3.5 rounded-xl border-[2px] border-black text-sm text-slate-900 placeholder:text-slate-500 focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all bg-white/80 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Current ERP System</label>
                  <select
                    data-testid="waitlist-erp-select"
                    value={form.erp_system}
                    onChange={(e) => setForm({ ...form, erp_system: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border-[2px] border-black text-sm text-slate-900 focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all bg-white font-bold"
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
                  whileHover={{ x: 2, y: 2, boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}
                  whileTap={{ x: 4, y: 4, boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)" }}
                  className="w-full bg-[#0055FF] text-white py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60 border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                    {status === "loading" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Subscribe Now
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
