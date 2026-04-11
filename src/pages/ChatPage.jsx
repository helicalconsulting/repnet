import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import AIChatArea from '../components/AIChatArea';
import ChatConversation from '../components/ChatConversation';
import ReportBuilder from '../components/ReportBuilder';
import RightPanel from '../components/RightPanel';
import { AnimatePresence, motion as Motion } from 'framer-motion';

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [chatState, setChatState] = useState('landing');
  const [activeQuery, setActiveQuery] = useState('');
  const [reportData, setReportData] = useState(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  // If navigated from New Chat button
  useEffect(() => {
    if (location.state?.createNew) {
      setChatState('landing');
      setActiveQuery('');
      setReportData(null);
      setIsRightPanelOpen(false);
      navigate('/chat', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleSearch = (query) => {
    setActiveQuery(query);
    setChatState("conversation");
    // In a real app we'd navigate to /chat/conversation/:id 
  };

  const handleOpenReport = (query, data = null) => {
    setActiveQuery(query);
    setReportData(data);
    setChatState("report");
    setIsRightPanelOpen(true);
    navigate('/report', { state: { query, data } });
  };

  return (
    <div className="flex-1 flex w-full h-full relative">
      <AnimatePresence mode="wait">
        {chatState === 'landing' && (
          <Motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full overflow-y-auto w-full">
            <AIChatArea onSearch={handleSearch} />
          </Motion.div>
        )}

        {chatState === 'conversation' && (
          <Motion.div key="conv" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto w-full">
            <ChatConversation initialQuery={activeQuery} onOpenReport={handleOpenReport} />
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
