import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { authApi } from '../services/api';

const passwordRules = [
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
  { label: 'One number', test: (value) => /\d/.test(value) },
];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const checks = useMemo(
    () => passwordRules.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password]
  );
  const passwordReady = checks.every((rule) => rule.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('This reset link is missing a token.');
      return;
    }
    if (!passwordReady) {
      setErrorMessage('Password must include uppercase, lowercase, a number, and at least 8 characters.');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, password });
      setCompleted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 shadow-2xl">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </button>

        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">{completed ? 'Password updated' : 'Create a new password'}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {completed ? 'Your password has been reset. You can now sign in.' : 'Choose a strong password for your account.'}
          </p>
        </div>

        {completed ? (
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to sign in
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-foreground/85">
                New password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 pr-12 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="mb-1.5 block text-sm font-medium text-foreground/85">
                Confirm password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
                autoComplete="new-password"
              />
            </div>

            <div className="grid gap-2 rounded-2xl border border-border/60 p-4 sm:grid-cols-2">
              {checks.map((rule) => (
                <div key={rule.label} className={`flex items-center gap-2 text-xs ${rule.passed ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  <Check className="h-3.5 w-3.5" />
                  {rule.label}
                </div>
              ))}
            </div>

            {errorMessage && (
              <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !passwordReady || !passwordsMatch}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
