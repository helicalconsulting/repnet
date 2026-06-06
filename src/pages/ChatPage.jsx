import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import AIChatArea from '../components/AIChatArea';
import ChatConversation from '../components/ChatConversation';
import ReportBuilder from '../components/ReportBuilder';
import RightPanel from '../components/RightPanel';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { sessionsApi } from '../services/api';
import { Sparkles, ChevronRight } from 'lucide-react';

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [chatState, setChatState] = useState('landing');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  const [lastActiveSessionId, setLastActiveSessionId] = useState(null);
  const [lastSessionTitle, setLastSessionTitle] = useState('');
  const [pendingQuery, setPendingQuery] = useState(null);
  const [showSessionChoiceModal, setShowSessionChoiceModal] = useState(false);
  const [bypassChoice, setBypassChoice] = useState(false);

  const { id } = useParams();

  // Load last active session on mount
  useEffect(() => {
    sessionsApi.list()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.sessions || data?.items || []);
        if (list.length > 0) {
          setLastActiveSessionId(list[0].id);
          setLastSessionTitle(list[0].title || 'Untitled Chat');
        }
      })
      .catch(err => {
        console.error('Failed to load last active session:', err);
      });
  }, [chatState]); // Refresh when going back to landing page

  // If navigated from New Chat button or URL has session ID
  useEffect(() => {
    if (id) {
      setSelectedSessionId(id);
      setChatState('conversation');
      setActiveQuery('');
    } else {
      setSelectedSessionId(null);
      setChatState('landing');
      setActiveQuery('');
      if (location.state?.createNew) {
        setBypassChoice(true);
        navigate('/chat', { replace: true, state: {} });
      }
    }
  }, [id, location.state, navigate]);

  const handleSearch = (query) => {
    if (lastActiveSessionId && !bypassChoice) {
      setPendingQuery(query);
      setShowSessionChoiceModal(true);
    } else {
      setActiveQuery(query);
      setSelectedSessionId(null);
      setChatState("conversation");
      setBypassChoice(false);
    }
  };

  const handleOpenReport = (query, data = null) => {
    setActiveQuery(query);
    setReportData(data);
    setChatState("report");
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
              key="chat-conversation"
              initialQuery={activeQuery} 
              onOpenReport={handleOpenReport} 
              sessionId={selectedSessionId} 
              onSessionCreated={handleSessionCreated}
            />
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Session Choice Modal */}
      <AnimatePresence>
        {showSessionChoiceModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <Motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card dark:bg-[#1C1C1C] border border-border/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                Select Chat Option
              </h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                You have a recent active chat: <strong className="text-foreground">"{lastSessionTitle}"</strong>. How would you like to run this query?
              </p>
              
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setSelectedSessionId(lastActiveSessionId);
                    setActiveQuery(pendingQuery);
                    setChatState("conversation");
                    setShowSessionChoiceModal(false);
                    navigate(`/chat/${lastActiveSessionId}`, { state: { triggerQuery: pendingQuery } });
                  }}
                  className="w-full flex items-center justify-between p-4 bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded-xl transition-all text-left group"
                >
                  <div className="pr-4">
                    <div className="text-sm font-semibold text-primary">Continue in current chat</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Appends query to the active conversation history</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform shrink-0" />
                </button>

                <button
                  onClick={() => {
                    setSelectedSessionId(null);
                    setActiveQuery(pendingQuery);
                    setChatState("conversation");
                    setShowSessionChoiceModal(false);
                    navigate(`/chat`);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 border border-border/50 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all text-left group"
                >
                  <div className="pr-4">
                    <div className="text-sm font-semibold text-foreground">Start a new chat</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Creates a fresh chat with a clean history</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowSessionChoiceModal(false)}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
