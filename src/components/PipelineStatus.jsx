import { motion } from "framer-motion";
import { Search, Database, Cpu, Rocket, Sparkles, Check, Loader2 } from "lucide-react";

const STEPS = [
  { id: "classify", label: "Understanding question", icon: Search, color: "text-violet-500", bgColor: "bg-violet-500", pingColor: "bg-violet-500/40" },
  { id: "search", label: "Finding the right data", icon: Database, color: "text-blue-500", bgColor: "bg-blue-500", pingColor: "bg-blue-500/40" },
  { id: "extract", label: "Preparing query", icon: Cpu, color: "text-amber-500", bgColor: "bg-amber-500", pingColor: "bg-amber-500/40" },
  { id: "execute", label: "Running query", icon: Rocket, color: "text-emerald-500", bgColor: "bg-emerald-500", pingColor: "bg-emerald-500/40" },
  { id: "insight", label: "Preparing answer", icon: Sparkles, color: "text-primary", bgColor: "bg-primary", pingColor: "bg-primary/40" },
];

/**
 * Visual pipeline progress indicator that shows the query processing stages.
 * Displays animated step icons with status (pending / active / done).
 */
export default function PipelineStatus({ currentStep = "classify", completedSteps = [], statusText = "" }) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl rounded-2xl border border-border/30 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#1C1C1C]/80"
    >
      <div className="sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary motion-reduce:animate-none" />
            <span className="truncate text-xs font-semibold text-foreground">
              {statusText || STEPS[currentIdx]?.label || STEPS[0].label}
            </span>
          </div>
          <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
            Step {Math.max(currentIdx + 1, 1)} of {STEPS.length}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${((Math.max(currentIdx, 0) + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="hidden items-center gap-1 sm:flex">
        {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isCompleted = completedSteps.includes(step.id);
        const isActive = step.id === currentStep;
        const isPending = !isCompleted && !isActive;

        const displayLabel = (isActive && statusText) ? statusText : step.label;

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
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${step.pingColor} opacity-75 motion-reduce:animate-none`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${step.bgColor}`} />
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
                {displayLabel}
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
      </div>
    </motion.div>
  );
}
