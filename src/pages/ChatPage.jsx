import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import AIChatArea from '../components/AIChatArea';
import ChatConversation from '../components/ChatConversation';
import ReportBuilder from '../components/ReportBuilder';
import RightPanel from '../components/RightPanel';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { sessionsApi } from '../services/api';

const isValidUuid = (str) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [chatState, setChatState] = useState('landing');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  // Route-driven state: URL has session ID → load that session
  // URL is /chat with triggerQuery → start new chat with that query
  // URL is /chat plain → show landing
  useEffect(() => {
    if (id && isValidUuid(id)) {
      setSelectedSessionId(id);
      setChatState('conversation');
      setActiveQuery('');
    } else if (location.state?.triggerQuery) {
      // New chat triggered from elsewhere
      setSelectedSessionId(null);
      setChatState('conversation');
      setActiveQuery(location.state.triggerQuery);
    } else {
      setSelectedSessionId(null);
      setChatState('landing');
      setActiveQuery('');
    }
  }, [id, location.state]);

  // Landing page search → always start a new chat (clean, simple UX like ChatGPT)
  const handleSearch = (query) => {
    setActiveQuery(query);
    setSelectedSessionId(null);
    setChatState('conversation');
  };

  const handleOpenReport = (query, data = null) => {
    setActiveQuery(query);
    setReportData(data);
    setChatState('report');
    setIsRightPanelOpen(true);
    navigate('/report/new', { state: { query, data } });
  };

  const handleSessionCreated = (newId) => {
    setSelectedSessionId(newId);
    navigate(`/chat/${newId}`, { replace: true });
  };

  return (
    <div className="flex-1 flex w-full h-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {chatState === 'landing' && (
          <Motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full overflow-y-auto w-full">
            <AIChatArea onSearch={handleSearch} />
          </Motion.div>
        )}

        {chatState === 'conversation' && (
          <Motion.div key="conv" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full w-full overflow-hidden">
            <ChatConversation 
              key={selectedSessionId || `new-${Date.now()}`}
              initialQuery={activeQuery} 
              onOpenReport={handleOpenReport} 
              sessionId={selectedSessionId} 
              onSessionCreated={handleSessionCreated}
            />
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
