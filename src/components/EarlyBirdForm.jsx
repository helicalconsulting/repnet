import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2 } from 'lucide-react';
import { countryCodes } from '../utils/countryCodes';

export default function EarlyBirdForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+91',
    phone: ''
  });

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openEarlyBirdModal', handleOpen);
    return () => window.removeEventListener('openEarlyBirdModal', handleOpen);
  }, []);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const response = await fetch('http://localhost:3001/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setTimeout(() => setIsOpen(false), 5000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="early-bird-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-['Outfit']"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-[380px] bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden"
          >
            <div className="relative p-6">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>

            <h3 className="text-[1.1rem] font-bold text-black mb-5 pr-6 leading-tight">
              Be an early bird subscriber and get 25% discount
            </h3>

            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-6 text-center"
              >
                <CheckCircle2 size={48} className="text-green-500 mb-4" />
                <p className="font-semibold text-lg text-black">Thank you!</p>
                <p className="text-sm text-slate-600 mt-1">We've received your details.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm font-medium"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm font-medium"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="w-[110px] px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm font-medium cursor-pointer"
                  >
                    {countryCodes.map(({ code, label }) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-[#0055FF] hover:bg-[#0044CC] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {status === 'loading' ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit Details</span>
                      <Send size={16} />
                    </>
                  )}
                </button>
                {status === 'error' && (
                  <p className="text-red-500 text-xs text-center mt-2">Failed to send details. Please try again.</p>
                )}
              </form>
            )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
