import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { authApi } from '../services/api';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!emailPattern.test(email.trim())) {
      setErrorMessage('Enter a valid work email.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 shadow-2xl">
        <div className="mb-7">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </button>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {sent ? <CheckCircle2 className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-semibold">{sent ? 'Check your email' : 'Reset your password'}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {sent
              ? 'If an active account exists for that email, a reset link has been sent. The link expires in 30 minutes.'
              : 'Enter your work email and we will send a secure password reset link.'}
          </p>
        </div>

        {!sent && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-foreground/85">
                Work email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
                autoComplete="email"
              />
            </div>

            {errorMessage && (
              <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
