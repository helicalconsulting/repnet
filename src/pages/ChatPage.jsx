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

  // ── Route-driven init (only for direct URL loads / sidebar clicks) ───
  // We use a ref to skip the first effect run when the user just initiated
  // a new chat — in that case ChatConversation updates the URL itself via
  // window.history.replaceState (no React Router involvement).
  const routeInitDoneRef = useRef(false);

  useEffect(() => {
    if (id && isValidUuid(id)) {
      // Only treat this as an external navigation if we don't already have
      // a conversation running (i.e. the user clicked a sidebar history item
      // or opened a bookmarked link directly).
      if (chatState !== 'conversation' || !conversationKey) {
        setSelectedSessionId(id);
        setChatState('conversation');
        setActiveQuery('');
        setConversationKey(id);
      }
    } else if (!routeInitDoneRef.current) {
      // /chat with no id → clean landing (only on first load)
      setSelectedSessionId(null);
      setChatState('landing');
      setActiveQuery('');
      setConversationKey(null);
    }
    routeInitDoneRef.current = true;
  }, [id]);  // eslint-disable-line react-hooks/exhaustive-deps

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
   * We update the URL silently via history API so the browser can restore
   * the session on refresh WITHOUT triggering a React Router re-render
   * (which would unmount ChatConversation and kill the WebSocket).
   */
  const handleSessionCreated = (newId) => {
    setSelectedSessionId(newId);
    // Silently sync URL bar — no React Router route change, no unmount.
    window.history.replaceState(null, '', `/chat/${newId}`);
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
