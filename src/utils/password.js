export const checkStrength = (pwd) => {
  const checks = [
    { label: 'At least 8 characters', pass: pwd.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(pwd) },
    { label: 'Lowercase letter', pass: /[a-z]/.test(pwd) },
    { label: 'Number', pass: /\d/.test(pwd) },
    { label: 'Special character (!@#$…)', pass: /[^A-Za-z0-9]/.test(pwd) },
  ];
  const score = checks.filter((c) => c.pass).length;
  return { checks, score };
};

export const strengthLabel = (score) => {
  if (score <= 1) return { label: 'Very weak', color: '#ef4444' };
  if (score === 2) return { label: 'Weak', color: '#f97316' };
  if (score === 3) return { label: 'Fair', color: '#eab308' };
  if (score === 4) return { label: 'Strong', color: '#22c55e' };
  return { label: 'Very strong', color: '#10b981' };
};
