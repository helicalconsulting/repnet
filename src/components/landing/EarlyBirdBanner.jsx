import React from 'react';
import { Sparkles } from 'lucide-react';

export default function EarlyBirdBanner() {
  const openModal = () => {
    window.dispatchEvent(new Event('openEarlyBirdModal'));
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-6 p-5 rounded-3xl border-[3px] border-black bg-yellow-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all max-w-full">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-yellow-400 border-[2px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
          <Sparkles className="text-black" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-black text-black font-['Outfit'] uppercase tracking-tight leading-none">Early Bird Offer</h3>
          <p className="text-sm text-slate-600 font-bold mt-1">Get 25% discount on launch.</p>
        </div>
      </div>
      <button 
        onClick={openModal} 
        className="px-8 py-4 bg-[#0055FF] text-white text-lg font-black rounded-2xl border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer whitespace-nowrap"
      >
        Claim Now
      </button>
    </div>
  );
}
