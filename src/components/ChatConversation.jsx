import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, ArrowUp, Sparkles, Bot, User, Copy, Check, RefreshCw, Database, Code, ChevronDown, Lightbulb, Plus, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";

export default function ChatConversation({ 
  initialQuery, 
  onOpenReport 
}) {
  const { connections, activeConnection, addNotification } = useApp();
  const [messages, setMessages] = useState([
    { id: "1", role: "user", content: initialQuery }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [streamedContent, setStreamedContent] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const bottomRef = useRef(null);

  const activeConn = connections.find(c => c.id === activeConnection);

  // Simulated streaming response
  useEffect(() => {
    if (isTyping && messages[messages.length - 1].role === "user") {
      const lastUserMsg = messages[messages.length - 1].content;
      
      const fullResponse = `I've analyzed your request and queried the connected ERP database.

**Query Analysis:**
Based on "${lastUserMsg.slice(0, 50)}...", I identified the relevant data sources and generated an optimized SQL query.

**Data Sources:**
• products (3,421 records)
• sales_transactions (89,234 records)  
• customers (15,420 records)

**Key Findings:**
1. Found **2,847 matching records** across 3 tables
2. Time period: Last 6 months of data
3. Applied filters for margin > 10%

I've prepared a comprehensive report with interactive visualizations. You can explore the data in different chart types, customize colors, and export to CSV.`;

      let currentIndex = 0;
      const streamInterval = setInterval(() => {
        if (currentIndex < fullResponse.length) {
          setStreamedContent(fullResponse.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(streamInterval);
          setMessages(prev => [
            ...prev, 
            { 
              id: Date.now().toString(), 
              role: "ai", 
              content: fullResponse,
              showReportBtn: true,
              tables: ["products", "sales_transactions", "customers"],
              sql: `SELECT p.name, SUM(s.amount) as revenue, AVG(s.margin) as margin
FROM products p JOIN sales_transactions s ON p.id = s.product_id
WHERE s.date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
GROUP BY p.id HAVING margin > 10
ORDER BY revenue DESC LIMIT 10;`
            }
          ]);
          setStreamedContent("");
          setIsTyping(false);
          setShowSuggestions(true);
        }
      }, 15);

      return () => clearInterval(streamInterval);
    }
  }, [messages, isTyping]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedContent]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: inputValue }]);
    setInputValue("");
    setIsTyping(true);
    setShowSuggestions(false);
  };

  const handleCopy = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addNotification('success', 'Copied to clipboard');
  };

  const followUpSuggestions = [
    "Add a breakdown by region",
    "Compare with previous quarter",
    "Show only top 5 performers",
    "Include trend analysis"
  ];

  // Format message content with markdown-like rendering
  const formatContent = (content) => {
    return content.split('\n').map((line, i) => {
      // Bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (line.startsWith('• ')) {
        return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: line.slice(2) }} />;
      }
      // Numbered lists
      const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
      if (numberedMatch) {
        return <li key={i} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: numberedMatch[2] }} />;
      }
      // Empty lines
      if (!line.trim()) return <br key={i} />;
      // Regular paragraphs
      return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center w-full min-h-full relative bg-background">
      
      {/* Connection Status Bar */}
      {activeConn && (
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card/80 dark:bg-[#1C1C1C]/80 backdrop-blur-md border border-border/50 dark:border-white/10 rounded-full text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-muted-foreground">Connected to</span>
            <span className="font-medium text-foreground">{activeConn.name}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl flex-1 flex flex-col pt-20 pb-40 px-6 overflow-y-auto custom-scrollbar">
        
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex w-full mb-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'ai' && (
               <div className="w-9 h-9 rounded-full bg-gradient-to-b from-white via-[#93c5fd] to-[#2563eb] flex items-center justify-center mr-3 shrink-0 shadow-lg shadow-primary/20">
                 <Bot className="w-4 h-4 text-blue-700" />
               </div>
            )}
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
              <div className={`relative group ${
                msg.role === 'user' 
                  ? 'px-5 py-3 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm shadow-lg shadow-primary/20' 
                  : 'bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/5 rounded-2xl rounded-tl-sm p-5 shadow-sm'
              }`}>
                {msg.role === 'user' ? (
                  <span className="text-[15px] leading-relaxed">{msg.content}</span>
                ) : (
                  <div className="text-[15px] leading-relaxed text-foreground">
                    {formatContent(msg.content)}
                  </div>
                )}
                
                {/* Copy button for AI messages */}
                {msg.role === 'ai' && (
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-all"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
              
              {/* Tables & SQL info */}
              {msg.tables && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Code className="w-3.5 h-3.5" />
                  <span>Queried: {msg.tables.join(', ')}</span>
                </div>
              )}
              
              {/* Report Button */}
              {msg.showReportBtn && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4"
                >
                  <button 
                    onClick={() => onOpenReport(initialQuery)}
                    className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground rounded-xl transition-all shadow-lg shadow-primary/30 group font-medium text-sm"
                  >
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>View Interactive Report</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs">with charts & data</span>
                  </button>
                </motion.div>
              )}
            </div>
            {msg.role === 'user' && (
               <div className="w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center ml-3 shrink-0">
                 <User className="w-5 h-5 text-muted-foreground" />
               </div>
            )}
          </motion.div>
        ))}

        {/* Streaming response */}
        {isTyping && streamedContent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex w-full mb-6 justify-start"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-b from-white via-[#93c5fd] to-[#2563eb] flex items-center justify-center mr-3 shrink-0 shadow-lg shadow-primary/20">
              <Bot className="w-4 h-4 text-blue-700" />
            </div>
            <div className="bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/5 rounded-2xl rounded-tl-sm p-5 shadow-sm max-w-[85%]">
              <div className="text-[15px] leading-relaxed text-foreground">
                {formatContent(streamedContent)}
                <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Typing indicator */}
        {isTyping && !streamedContent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex w-full mb-6 justify-start items-center"
          >
             <div className="w-9 h-9 rounded-full bg-gradient-to-b from-white via-[#93c5fd] to-[#2563eb] flex items-center justify-center mr-3 shrink-0 shadow-lg shadow-primary/20">
               <Bot className="w-4 h-4 text-blue-700" />
             </div>
             <div className="flex gap-1.5 bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/5 px-5 py-4 rounded-2xl rounded-tl-sm">
               <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
               <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
               <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
             </div>
          </motion.div>
        )}

        {/* Follow-up suggestions */}
        <AnimatePresence>
          {showSuggestions && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-wrap gap-2 mb-6 pl-12"
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Suggestions:</span>
              </div>
              {followUpSuggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInputValue(sug);
                    setShowSuggestions(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/10 hover:border-primary/50 rounded-lg transition-colors"
                >
                  {sug}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} className="h-4 w-full shrink-0 block" />
      </div>

      {/* Fixed Bottom Input */}
      <div className="absolute bottom-0 w-full left-0 right-0 px-6 pb-6 bg-gradient-to-t from-[#fcfcf9] via-[#fcfcf9]/95 dark:from-[#141414] dark:via-[#141414]/95 to-transparent z-10 pt-10 flex justify-center pointer-events-none">
        
        <form 
          onSubmit={handleSubmit}
          className="relative w-full max-w-3xl pointer-events-auto bg-card dark:bg-[#1C1C1C] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-border/50 dark:border-white/5 flex flex-col p-2 min-h-[90px] focus-within:border-primary/30 focus-within:shadow-[0_8px_30px_rgba(37,99,235,0.15)] transition-all"
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a follow-up question..."
            className="w-full bg-transparent border-none outline-none text-foreground text-[15px] p-3 resize-none placeholder:text-muted-foreground/60 min-h-[44px] max-h-[200px] overflow-y-auto"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between mt-auto px-2 py-1">
            <button type="button" className="flex items-center gap-1.5 text-[12px] font-medium text-foreground/70 hover:text-foreground transition-colors px-2 py-1 rounded bg-black/5 dark:bg-white/5">
              <Sparkles className="w-3 h-3 text-primary" />
              RepNet AI Pro
            </button>
            <div className="flex items-center gap-2">
              <button type="button" className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <button 
                type="submit" 
                disabled={!inputValue.trim() || isTyping}
                className="w-8 h-8 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30 disabled:bg-muted-foreground rounded-full transition-all shadow-lg shadow-primary/30 disabled:shadow-none group"
              >
                <ArrowUp className="w-4 h-4 stroke-[3px] group-active:translate-y-[-2px] transition-transform" />
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
