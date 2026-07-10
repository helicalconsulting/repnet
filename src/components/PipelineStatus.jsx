import { motion } from "framer-motion";
import { Search, Database, Cpu, Rocket, Sparkles, Check, Loader2 } from "lucide-react";

const STEPS = [
  { id: "classify", label: "Classifying intent", icon: Search, color: "text-violet-500" },
  { id: "search", label: "Searching templates", icon: Database, color: "text-blue-500" },
  { id: "extract", label: "Building query", icon: Cpu, color: "text-amber-500" },
  { id: "execute", label: "Executing", icon: Rocket, color: "text-emerald-500" },
  { id: "insight", label: "Generating insights", icon: Sparkles, color: "text-primary" },
];

/**
 * Visual pipeline progress indicator that shows the query processing stages.
 * Displays animated step icons with status (pending / active / done).
 */
export default function PipelineStatus({ currentStep = "classify", completedSteps = [] }) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 px-4 py-3 bg-card/80 dark:bg-[#1C1C1C]/80 backdrop-blur-xl border border-border/30 dark:border-white/10 rounded-2xl shadow-sm"
    >
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isCompleted = completedSteps.includes(step.id);
        const isActive = step.id === currentStep;
        const isPending = !isCompleted && !isActive;

        return (
          <div key={step.id} className="flex items-center">
            <motion.div
              initial={false}
              animate={{
                scale: isActive ? 1.1 : 1,
                opacity: isPending ? 0.35 : 1,
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary/10 dark:bg-primary/15"
                  : isCompleted
                  ? "bg-emerald-500/10"
                  : ""
              }`}
            >
              {isCompleted ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : isActive ? (
                <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                    step.color === 'text-primary' ? 'bg-primary' : step.color.replace('text-', 'bg-')
                  }/45 opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    step.color === 'text-primary' ? 'bg-primary' : step.color.replace('text-', 'bg-')
                  }`} />
                </span>
              ) : (
                <Icon className={`w-3.5 h-3.5 text-muted-foreground/50`} />
              )}
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  isActive
                    ? step.color
                    : isCompleted
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground/50"
                }`}
              >
                {step.label}
              </span>
            </motion.div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className="w-3 mx-0.5">
                <div
                  className={`h-px transition-colors ${
                    i < currentIdx || isCompleted
                      ? "bg-emerald-500/40"
                      : "bg-border/30 dark:bg-white/10"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
