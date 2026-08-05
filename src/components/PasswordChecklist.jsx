import { motion as Motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { checkStrength } from '../utils/password';

export default function PasswordChecklist({ password }) {
  if (!password) return null;
  const { checks } = checkStrength(password);

  return (
    <Motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2.5"
    >
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs">
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0 transition-colors"
              style={{ color: c.pass ? '#22c55e' : 'rgba(0,0,0,0.25)' }}
            />
            <span className={c.pass ? 'text-foreground/70' : 'text-muted-foreground'}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </Motion.div>
  );
}
