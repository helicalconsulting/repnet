import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AIChatArea from '../components/AIChatArea';
import ChatConversation from '../components/ChatConversation';
import { AnimatePresence, motion as Motion } from 'framer-motion';

const isValidUuid = (str) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

export default function ChatPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [chatState, setChatState]                 = useState('landing');
  const [activeQuery, setActiveQuery]             = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  /**
   * conversationKey is the React key for <ChatConversation>.
   * Changing it forces an unmount + fresh mount (new isolated conversation).
   * Rules:
   *   - Set to a unique timestamp on new query  → fresh component every time
   *   - Set to session UUID when opening history → loads that session cleanly
   *   - NEVER changes during an active query    → no disruption mid-execution
   */
  const [conversationKey, setConversationKey] = useState(null);

  // ── Route-driven init ────────────────────────────────────────────────
  useEffect(() => {
    if (id && isValidUuid(id)) {
      // User opened /chat/:id intentionally (sidebar, bookmark, direct URL)
      // → load history of that specific session
      setSelectedSessionId(id);
      setChatState('conversation');
      setActiveQuery('');
      setConversationKey(prev => {
        if (prev === id || (prev && prev.startsWith('new-') && selectedSessionId === id)) {
          return prev;
        }
        return id;
      });
    } else {
      // /chat with no id → always show a clean fresh landing
      setSelectedSessionId(null);
      setChatState('landing');
      setActiveQuery('');
      setConversationKey(null);
    }
  }, [id, selectedSessionId]);

  useEffect(() => {
    const handleNewChat = () => {
      setSelectedSessionId(null);
      setChatState('landing');
      setActiveQuery('');
      setConversationKey(null);
    };
    window.addEventListener('repnex-new-chat', handleNewChat);
    return () => window.removeEventListener('repnex-new-chat', handleNewChat);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────

  /**
   * Landing page search → always spawn a completely isolated fresh chat.
   */
  const handleSearch = (query) => {
    setActiveQuery(query);
    setSelectedSessionId(null);
    setChatState('conversation');
    setConversationKey(`new-${Date.now()}`);
  };

  /**
   * Called by ChatConversation when the backend creates a session.
   * We navigate to /chat/:id so that the session ID is preserved in the URL,
   * allowing the state/report to persist even on page refresh.
   */
  const handleSessionCreated = (newId) => {
    setSelectedSessionId(newId);
    navigate(`/chat/${newId}`, { replace: true });
  };

  /** "View Interactive Report" button inside chat */
  const handleOpenReport = (query, data = null) => {
    navigate('/report/new', { state: { query, data, fromChat: true, sessionId: selectedSessionId } });
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex w-full h-full relative overflow-hidden">
      <AnimatePresence mode="wait">

        {chatState === 'landing' && (
          <Motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full overflow-y-auto w-full custom-scrollbar"
          >
            <AIChatArea onSearch={handleSearch} />
          </Motion.div>
        )}

        {chatState === 'conversation' && conversationKey && (
          <Motion.div
            key="conv"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full w-full overflow-hidden"
          >
            <ChatConversation
              key={conversationKey}
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
