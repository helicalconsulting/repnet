import { motion } from "framer-motion";
import { Calendar, Hash, Type, List, ToggleLeft, Send, Sparkles } from "lucide-react";
import { useState } from "react";

/**
 * Claude-like parameter input card for filling missing template parameters.
 * Renders dynamic form fields based on param types from the backend.
 */
export default function ParameterCard({
  templateId,
  templateDescription,
  extractedParams = {},
  missingParams = [],
  onSubmit,
  isLoading = false,
}) {
  const [values, setValues] = useState(() => {
    const initial = { ...extractedParams };
    missingParams.forEach((p) => {
      if (p.default !== null && p.default !== undefined) {
        initial[p.name] = p.default;
      }
    });
    return initial;
  });

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  const allFilled = missingParams.every(
    (p) => !p.required || (values[p.name] !== undefined && values[p.name] !== "")
  );

  const getIcon = (type) => {
    switch (type) {
      case "date":
      case "datetime":
        return <Calendar className="w-4 h-4" />;
      case "int":
      case "float":
        return <Hash className="w-4 h-4" />;
      case "enum":
        return <List className="w-4 h-4" />;
      case "bool":
        return <ToggleLeft className="w-4 h-4" />;
      default:
        return <Type className="w-4 h-4" />;
    }
  };

  const renderField = (param) => {
    const { name, type, options, default: defaultVal, required, min_val, max_val } = param;
    const value = values[name] ?? "";
    const displayName = name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return (
      <div key={name} className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
          {getIcon(type)}
          {displayName}
          {required && <span className="text-red-400 text-[10px]">*</span>}
        </label>

        {type === "enum" && options?.length ? (
          <select
            value={value}
            onChange={(e) => handleChange(name, e.target.value)}
            className="w-full px-3 py-2.5 bg-background/60 border border-border/50 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all appearance-none cursor-pointer"
          >
            <option value="">Select {displayName.toLowerCase()}...</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : type === "date" || type === "datetime" ? (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(name, e.target.value)}
            className="w-full px-3 py-2.5 bg-background/60 border border-border/50 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        ) : type === "int" || type === "float" ? (
          <input
            type="number"
            value={value}
            min={min_val ?? undefined}
            max={max_val ?? undefined}
            step={type === "float" ? "0.01" : "1"}
            placeholder={defaultVal !== null ? `Default: ${defaultVal}` : `Enter ${displayName.toLowerCase()}`}
            onChange={(e) => handleChange(name, type === "int" ? parseInt(e.target.value) || "" : parseFloat(e.target.value) || "")}
            className="w-full px-3 py-2.5 bg-background/60 border border-border/50 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        ) : type === "bool" ? (
          <button
            type="button"
            onClick={() => handleChange(name, !value)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
              value
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-background/60 border-border/50 text-foreground/60"
            }`}
          >
            <div className={`w-8 h-4 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-4" : ""}`} />
            </div>
            {value ? "Yes" : "No"}
          </button>
        ) : (
          <input
            type="text"
            value={value}
            placeholder={defaultVal !== null ? `Default: ${defaultVal}` : `Enter ${displayName.toLowerCase()}`}
            onChange={(e) => handleChange(name, e.target.value)}
            className="w-full px-3 py-2.5 bg-background/60 border border-border/50 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <form onSubmit={handleSubmit} className="bg-card/80 dark:bg-[#1C1C1C]/90 backdrop-blur-xl border border-border/30 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/30">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/20 dark:border-white/5 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Parameters Required</span>
          </div>
          <p className="text-sm text-foreground/70 mt-1 leading-relaxed">
            {templateDescription || `Configure ${templateId} parameters`}
          </p>
        </div>

        {/* Pre-filled params display */}
        {Object.keys(extractedParams).length > 0 && (
          <div className="px-5 py-3 border-b border-border/10 dark:border-white/5 bg-emerald-500/5">
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Auto-Extracted</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(extractedParams).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-700 dark:text-emerald-300">
                  <span className="font-medium">{k.replace(/_/g, " ")}:</span> {String(v)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Fields */}
        <div className="px-5 py-4 space-y-4">
          {missingParams.map(renderField)}
        </div>

        {/* Submit */}
        <div className="px-5 py-4 border-t border-border/10 dark:border-white/5">
          <button
            type="submit"
            disabled={!allFilled || isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-primary/30 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                Run Query
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
