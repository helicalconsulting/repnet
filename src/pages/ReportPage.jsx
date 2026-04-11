import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReportBuilder from '../components/ReportBuilder';
import RightPanel from '../components/RightPanel';
import { AnimatePresence, motion as Motion } from 'framer-motion';

export default function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const query = location.state?.query || "Database Analytics";
  const reportData = location.state?.data || null;

  useEffect(() => {
    const handleResize = () => {
      setIsRightPanelOpen(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex-1 flex w-full h-full relative overflow-hidden bg-background">
      <Motion.div key="report" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
        <ReportBuilder 
          query={query} 
          reportData={reportData}
          onClose={() => navigate('/chat')} 
          onToggleInsights={() => setIsRightPanelOpen(prev => !prev)}
        />
      </Motion.div>
      
      <RightPanel 
        isOpen={isRightPanelOpen} 
        onClose={() => setIsRightPanelOpen(false)} 
      />
    </div>
  );
}
