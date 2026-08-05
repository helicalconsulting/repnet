import { motion as Motion } from 'framer-motion';
import { checkStrength, strengthLabel } from '../utils/password';

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const { score } = checkStrength(password);
  const { label, color } = strengthLabel(score);

  return (
    <Motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 space-y-2"
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? color : 'rgba(0,0,0,0.08)' }}
          />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color }}>
        {label}
      </p>
    </Motion.div>
  );
}
