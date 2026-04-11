import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReportBuilder from '../components/ReportBuilder';
import RightPanel from '../components/RightPanel';

export default function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const query = location.state?.query || "Database Analytics";
  const reportData = location.state?.data || null;

  return (
    <div className="flex-1 flex w-full h-full relative overflow-hidden bg-background">
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
        <ReportBuilder 
          query={query} 
          reportData={reportData}
          onClose={() => navigate('/chat')} 
          onToggleInsights={() => setIsRightPanelOpen(prev => !prev)}
        />
      </div>
      
      <RightPanel 
        isOpen={isRightPanelOpen} 
        onClose={() => setIsRightPanelOpen(false)} 
      />
    </div>
  );
}
