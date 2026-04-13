import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import axios from "axios";

const API = `${import.meta.env.VITE_BACKEND_URL || ''}/api`;

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await axios.post(`${API}/contact`, form);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <section id="contact" data-testid="contact-section" className="py-28 md:py-36 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/50 to-white" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 font-['Outfit'] bg-blue-50 px-3 py-1 rounded-full">
              Contact
            </span>
            <h2 className="text-4xl sm:text-5xl tracking-tight font-bold text-slate-900 font-['Outfit'] mt-5">
              Have questions?
            </h2>
            <p className="text-lg text-slate-500 mt-4">
              Reach out and we'll get back to you within 24 hours.
            </p>
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
                data-testid="contact-success"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <CheckCircle2 size={56} className="text-emerald-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-2xl font-bold text-slate-900 font-['Outfit']">Message sent!</h3>
                <p className="text-sm text-slate-500 mt-2">We'll be in touch shortly.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-8 shadow-xl shadow-slate-200/30" data-testid="contact-form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-2 block">Name *</label>
                    <input
                      type="text"
                      required
                      data-testid="contact-name-input"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 outline-none transition-all bg-white/80"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-2 block">Email *</label>
                    <input
                      type="email"
                      required
                      data-testid="contact-email-input"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="john@company.com"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 outline-none transition-all bg-white/80"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Company</label>
                  <input
                    type="text"
                    data-testid="contact-company-input"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Acme Corp"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 outline-none transition-all bg-white/80"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Message *</label>
                  <textarea
                    required
                    rows={4}
                    data-testid="contact-message-input"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your ERP reporting needs..."
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 outline-none transition-all resize-none bg-white/80"
                  />
                </div>

                {status === "error" && (
                  <p className="text-sm text-red-500" data-testid="contact-error">{errorMsg}</p>
                )}

                <motion.button
                  type="submit"
                  data-testid="contact-submit-btn"
                  disabled={status === "loading"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-[#0055FF] to-[#3B82F6] text-white py-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-blue-500/20"
                >
                  {status === "loading" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={14} />
                      Send Message
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
