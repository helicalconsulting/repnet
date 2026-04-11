import { AnimatePresence, motion as Motion } from "framer-motion";
import { 
  Lightbulb, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  Target,
  Clock,
  MessageSquare,
  Zap,
  ChevronRight,
  ExternalLink,
  X
} from "lucide-react";
import { useState } from "react";

const insights = [
  { 
    id: 1, 
    text: "Sales in Q3 are up 14% compared to expected metrics.", 
    type: "positive",
    metric: "+14%",
    icon: TrendingUp
  },
  { 
    id: 2, 
    text: "3 Purchase Orders are significantly delayed.", 
    type: "warning",
    metric: "3 POs",
    icon: AlertTriangle
  },
  { 
    id: 3, 
    text: "Inventory turnover rate improved by 8.2% this month.", 
    type: "positive",
    metric: "+8.2%",
    icon: TrendingUp
  },
  { 
    id: 4, 
    text: "Customer satisfaction dropped slightly in West region.", 
    type: "warning",
    metric: "-2.1%",
    icon: TrendingDown
  },
];

const suggestedTasks = [
  { id: 1, title: "Review Delayed POs", description: "Check status of 3 delayed purchase orders", assignee: "John D.", priority: "High", due: "Today" },
  { id: 2, title: "Adjust Q4 Forecast", description: "Update forecast based on Q3 actuals", assignee: "Sarah M.", priority: "Medium", due: "Tomorrow" },
  { id: 3, title: "West Region Follow-up", description: "Address customer satisfaction concerns", assignee: "Unassigned", priority: "High", due: "This Week" },
];

const followUpQuestions = [
  "Drill down into top-performing regions",
  "Compare with last year's Q3 performance",
  "Show monthly breakdown of trends",
  "Export this report to PDF"
];

export default function RightPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("insights");
  const [expandedInsight, setExpandedInsight] = useState(null);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <Motion.div
         className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] md:hidden cursor-pointer"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         onClick={onClose}
      />
      <Motion.aside
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "100%", opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 right-0 md:relative md:h-full w-full max-w-[92vw] sm:max-w-[420px] md:max-w-[340px] bg-card/80 backdrop-blur-xl border-l border-border/50 flex flex-col z-[100] md:z-20 shrink-0 shadow-2xl md:shadow-none"
      >
      <div className="p-4 sm:p-5 flex flex-col h-full overflow-hidden">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            AI Insights
          </h2>
          <button onClick={onClose} className="md:hidden p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl mb-5">
          {[
            { id: "insights", label: "Insights", icon: Lightbulb },
            { id: "actions", label: "Actions", icon: Target },
            { id: "follow", label: "Follow-up", icon: MessageSquare }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === "insights" && (
              <Motion.div
                key="insights"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {insights.map((insight, idx) => {
                  const Icon = insight.icon;
                  return (
                    <Motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                        insight.type === "positive" 
                          ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10" 
                          : "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          insight.type === "positive" ? "bg-emerald-500/10" : "bg-amber-500/10"
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            insight.type === "positive" ? "text-emerald-500" : "text-amber-500"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-xs font-bold ${
                              insight.type === "positive" ? "text-emerald-500" : "text-amber-500"
                            }`}>
                              {insight.metric}
                            </span>
                            <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                              expandedInsight === insight.id ? "rotate-90" : ""
                            }`} />
                          </div>
                          <p className="text-sm text-foreground/80">{insight.text}</p>
                          
                          <AnimatePresence>
                            {expandedInsight === insight.id && (
                              <Motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-3 pt-3 border-t border-border/30"
                              >
                                <button className="text-xs text-primary hover:underline flex items-center gap-1">
                                  View detailed analysis
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </Motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </Motion.div>
                  );
                })}
              </Motion.div>
            )}

            {activeTab === "actions" && (
              <Motion.div
                key="actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {suggestedTasks.map((task, idx) => (
                  <Motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-primary/30 transition-all group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm text-foreground">{task.title}</h4>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        task.priority === "High" 
                          ? "bg-rose-500/15 text-rose-500" 
                          : "bg-blue-500/15 text-blue-500"
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{task.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">
                            {task.assignee.charAt(0)}
                          </div>
                          <span>{task.assignee}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{task.due}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/30 flex gap-2">
                      <button className="flex-1 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                        Assign
                      </button>
                      <button className="flex-1 py-1.5 text-xs font-medium text-foreground/70 bg-black/5 dark:bg-white/5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </Motion.div>
                ))}
                
                {/* Add Task Button */}
                <button className="w-full py-3.5 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary font-medium flex items-center justify-center gap-2 transition-all">
                  <Plus className="w-4 h-4" />
                  Add Custom Task
                </button>
              </Motion.div>
            )}

            {activeTab === "follow" && (
              <Motion.div
                key="follow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <p className="text-xs text-muted-foreground mb-4">
                  Suggested follow-up questions based on your current report:
                </p>
                {followUpQuestions.map((question, idx) => (
                  <Motion.button
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="w-full p-3.5 rounded-xl text-left text-sm bg-black/5 dark:bg-white/5 border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all group flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2.5">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      {question}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Motion.button>
                ))}
                
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Pro Tip</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can ask follow-up questions in natural language. The AI will remember the context of your current report.
                  </p>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Action */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20">
            <MessageSquare className="w-4 h-4" />
            Ask AI Assistant
          </button>
        </div>
      </div>
    </Motion.aside>
    </>
  );
}
