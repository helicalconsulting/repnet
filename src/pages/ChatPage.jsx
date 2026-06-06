import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AIChatArea from '../components/AIChatArea';
import ChatConversation from '../components/ChatConversation';
import { AnimatePresence, motion as Motion } from 'framer-motion';

const isValidUuid = (str) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

export default function ChatPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [chatState, setChatState]               = useState('landing');
  const [activeQuery, setActiveQuery]           = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  /**
   * conversationKey drives ChatConversation's React key:
   *  - Set to a unique timestamp   → fresh mount (new chat from landing)
   *  - Set to the session UUID     → fresh mount (loading existing session)
   *  - NOT changed on session-create navigation → component stays alive mid-query
   */
  const [conversationKey, setConversationKey] = useState(null);

  /**
   * justCreatedSessionRef is set to true immediately before we navigate to
   * /chat/:newId after creating a session. The useEffect below checks this flag
   * and skips remounting the component, so the in-progress query can finish.
   */
  const justCreatedSessionRef = useRef(false);

  // ── Route-driven initialisation ──────────────────────────────────────
  useEffect(() => {
    if (id && isValidUuid(id)) {
      if (justCreatedSessionRef.current) {
        // We just created this session; the URL was updated via navigate({ replace })
        // Do NOT change conversationKey — keep the component alive so the query finishes
        justCreatedSessionRef.current = false;
        setSelectedSessionId(id);
        return;
      }
      // User navigated to an existing session (sidebar, direct URL, bookmark)
      // Force a clean mount so the history loader runs fresh
      setSelectedSessionId(id);
      setChatState('conversation');
      setActiveQuery('');
      setConversationKey(id);
    } else {
      // /chat with no id → show landing
      setSelectedSessionId(null);
      setChatState('landing');
      setActiveQuery('');
      setConversationKey(null);
    }
  }, [id]); // Only id matters — location.state was causing spurious re-runs

  // ── Handlers ─────────────────────────────────────────────────────────

  /** User submits a query from the landing page → always a brand-new isolated chat */
  const handleSearch = (query) => {
    setActiveQuery(query);
    setSelectedSessionId(null);
    setChatState('conversation');
    setConversationKey(`new-${Date.now()}`); // unique key forces a fresh ChatConversation
  };

  /**
   * ChatConversation calls this once the backend session is created.
   * We set the ref BEFORE navigate so the useEffect knows to skip remounting.
   */
  const handleSessionCreated = (newId) => {
    justCreatedSessionRef.current = true;   // ← critical: prevents remount
    setSelectedSessionId(newId);
    navigate(`/chat/${newId}`, { replace: true }); // URL = shareable link
  };

  /** "View Interactive Report" button inside chat */
  const handleOpenReport = (query, data = null) => {
    navigate('/report/new', { state: { query, data } });
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex w-full h-full relative overflow-hidden">
      <AnimatePresence mode="wait">

        {chatState === 'landing' && (
          <Motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full overflow-y-auto w-full"
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
              key={conversationKey}           // fresh mount only when key changes
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
