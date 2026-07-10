import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  Users,
  AlertTriangle,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { SmartSkeleton } from "@ela-labs/smart-skeleton-react";
import { authApi } from '../services/api';

// ── Password strength ──────────────────────────────────────────────────
const checkStrength = (pwd) => {
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

const strengthLabel = (score) => {
  if (score <= 1) return { label: 'Very weak', color: '#ef4444' };
  if (score === 2) return { label: 'Weak', color: '#f97316' };
  if (score === 3) return { label: 'Fair', color: '#eab308' };
  if (score === 4) return { label: 'Strong', color: '#22c55e' };
  return { label: 'Very strong', color: '#10b981' };
};

// ── PasswordInput ──────────────────────────────────────────────────────
function PasswordInput({ id, label, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground/85">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-transparent bg-black/5 pl-10 pr-12 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors dark:hover:bg-white/10"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Strength Meter ─────────────────────────────────────────────────────
function StrengthMeter({ password }) {
  if (!password) return null;
  const { checks, score } = checkStrength(password);
  const { label, color } = strengthLabel(score);

  return (
    <Motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 space-y-2.5"
    >
      {/* Bar */}
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
      {/* Checklist */}
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

// ── Main Page ──────────────────────────────────────────────────────────
const STATUS = {
  VALIDATING: 'validating',  // checking token presence
  READY: 'ready',            // form shown
  SUBMITTING: 'submitting',  // API call in flight
  SUCCESS: 'success',        // accepted, logged in
  INVALID: 'invalid',        // token missing / expired
  ACCEPTED: 'accepted',      // invite was already used
};

export default function AcceptInvitePage({ onAuthSuccess }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState(STATUS.VALIDATING);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [orgName, setOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');

  useEffect(() => {
    let mounted = true;

    const validateInvite = async () => {
      if (!token) {
        setStatus(STATUS.INVALID);
        setErrorMessage('No invitation token found. Please use the link from your email.');
        return;
      }

      try {
        const invite = await authApi.getInvite(token);
        if (!mounted) return;

        setOrgName(invite.organization_name || '');
        setInviteEmail(invite.email || '');
        setInviteRole(invite.role || '');

        if (invite.status === 'active') {
          setStatus(STATUS.ACCEPTED);
          setErrorMessage('This invitation has already been accepted. Sign in with the password created for this account.');
          return;
        }

        setStatus(STATUS.READY);
      } catch (err) {
        if (!mounted) return;
        setStatus(STATUS.INVALID);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'This invitation link is invalid or expired. Please request a new invite.'
        );
      }
    };

    validateInvite();
    return () => {
      mounted = false;
    };
  }, [token]);

  const { score: pwdScore } = checkStrength(password);
  const meetsServerPolicy = /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit =
    status === STATUS.READY &&
    pwdScore >= 3 &&
    password.length >= 8 &&
    meetsServerPolicy &&
    passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (pwdScore < 3) {
      setErrorMessage('Please choose a stronger password (at least "Fair" strength).');
      return;
    }
    if (!meetsServerPolicy) {
      setErrorMessage('Password must include uppercase, lowercase, and a number.');
      return;
    }

    setStatus(STATUS.SUBMITTING);

    try {
      const result = await authApi.acceptInvite({ token, password });
      setStatus(STATUS.SUCCESS);
      // Auto-redirect after brief success animation
      setTimeout(() => {
        onAuthSuccess(result);
        navigate('/dashboard', { replace: true });
      }, 1800);
    } catch (err) {
      setStatus(STATUS.READY);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to activate account. The link may have expired.'
      );
    }
  };

  // ── Invalid / Expired ──
  if (status === STATUS.INVALID) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-[20%] h-[280px] w-[280px] rounded-full bg-rose-500/10 blur-[120px]" />
          <div className="absolute bottom-[-100px] right-[10%] h-[300px] w-[300px] rounded-full bg-primary/8 blur-[140px]" />
        </div>
        <Motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-md w-full rounded-3xl border border-border/50 bg-card/90 p-8 shadow-2xl backdrop-blur-xl text-center"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Invitation Invalid</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{errorMessage}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 w-full rounded-xl border border-border/60 bg-black/[0.02] dark:bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/[0.07] transition-colors"
          >
            Back to Sign In
          </button>
        </Motion.div>
      </div>
    );
  }

  // ── Success ──
  if (status === STATUS.SUCCESS) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-[20%] h-[280px] w-[280px] rounded-full bg-emerald-500/10 blur-[120px]" />
        </div>
        <Motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-md w-full rounded-3xl border border-emerald-500/20 bg-card/90 p-8 shadow-2xl backdrop-blur-xl text-center"
        >
          <Motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500"
          >
            <Check className="h-8 w-8" />
          </Motion.div>
          <h1 className="text-xl font-semibold mb-2">You're all set! 🎉</h1>
          <p className="text-sm text-muted-foreground">
            Account activated. Redirecting you to the dashboard…
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Taking you in…
          </div>
        </Motion.div>
      </div>
    );
  }

  // ── Already Accepted ──
  if (status === STATUS.ACCEPTED) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full rounded-3xl border border-border/50 bg-card/90 p-8 shadow-2xl backdrop-blur-xl text-center"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Invitation Already Accepted</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{errorMessage}</p>
          {inviteEmail && (
            <p className="mt-4 rounded-xl border border-border/60 bg-black/[0.02] px-4 py-3 text-sm font-medium dark:bg-white/[0.02]">
              {inviteEmail}
            </p>
          )}
          <button
            onClick={() => navigate('/login')}
            className="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to Sign In
          </button>
        </Motion.div>
      </div>
    );
  }

  // ── Validating ──
  if (status === STATUS.VALIDATING) {
    return (
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex items-center justify-center p-4">
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-100px] left-[15%] h-[320px] w-[320px] rounded-full bg-primary/15 blur-[120px]" />
          <div className="absolute bottom-[-120px] right-[8%] h-[360px] w-[360px] rounded-full bg-blue-500/10 blur-[140px]" />
        </div>

        <Motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-5xl"
        >
          <SmartSkeleton loading={true}>
            <div className="grid overflow-hidden rounded-3xl border border-border/50 bg-card/85 shadow-2xl backdrop-blur-xl md:grid-cols-2">
              {/* Left panel skeleton */}
              <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary/50 to-blue-700/50 p-10 text-white min-h-[500px]">
                <div>
                  <div className="h-12 w-32 bg-white/10 rounded-xl mb-8 animate-pulse" />
                  <div className="h-8 bg-white/20 rounded w-3/4 mb-3 animate-pulse" />
                  <div className="h-4 bg-white/10 rounded w-full mb-2 animate-pulse" />
                  <div className="h-4 bg-white/10 rounded w-2/3 animate-pulse" />
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
              {/* Right panel skeleton */}
              <div className="p-7 sm:p-9 md:p-10 space-y-6">
                <div>
                  <div className="h-6 bg-muted rounded w-1/4 mb-4 animate-pulse" />
                  <div className="h-8 bg-muted rounded w-2/3 mb-2 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                </div>
                <div className="h-16 bg-muted rounded-2xl animate-pulse" />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                    <div className="h-10 bg-muted rounded-xl animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                    <div className="h-10 bg-muted rounded-xl animate-pulse" />
                  </div>
                </div>
                <div className="h-12 bg-muted rounded-xl animate-pulse" />
              </div>
            </div>
          </SmartSkeleton>
        </Motion.div>
      </div>
    );
  }

  // ── Main Form (READY / SUBMITTING) ──
  const isSubmitting = status === STATUS.SUBMITTING;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex items-center justify-center p-4">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-100px] left-[15%] h-[320px] w-[320px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-120px] right-[8%] h-[360px] w-[360px] rounded-full bg-blue-500/10 blur-[140px]" />
      </div>

      <Motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-5xl"
      >
        <div className="grid overflow-hidden rounded-3xl border border-border/50 bg-card/85 shadow-2xl backdrop-blur-xl md:grid-cols-2">

          {/* ── Left panel ── */}
          <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary to-blue-700 p-10 text-white">
            <div>
              <div className="mb-8 inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
                <img src="/270970406.jpeg" alt="Repnex logo" className="h-8 w-8 rounded-lg object-contain bg-white/90 p-1" />
                <div>
                  <p className="text-sm font-semibold">Repnex</p>
                  <p className="text-xs text-white/75">AI-Powered ERP Reports</p>
                </div>
              </div>
              <h1 className="mb-3 text-3xl font-semibold leading-tight">
                You've been invited to collaborate.
              </h1>
              <p className="text-sm text-white/80 leading-relaxed">
                {orgName
                  ? `${orgName} has added you to their Repnex workspace.`
                  : 'Your team has added you to their Repnex workspace.'}
                {' '}Set a password to activate your account and get instant access.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: ShieldCheck, title: 'Secure token-based activation', desc: 'Your invitation link is cryptographically signed and expires in 24 hours.' },
                { icon: Users, title: 'Role-based access control', desc: 'Your admin has assigned you a specific role with appropriate permissions.' },
                { icon: Sparkles, title: 'Instant access after setup', desc: 'Once you activate, you can start querying ERP data in plain English immediately.' },
              ].map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="rounded-xl border border-white/20 bg-white/10 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4" />
                      {p.title}
                    </div>
                    <p className="text-xs text-white/80">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right panel — form ── */}
          <div className="p-7 sm:p-9 md:p-10">
            {/* Mobile logo */}
            <div className="mb-6 md:hidden">
              <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-border/50 bg-black/5 dark:bg-white/5 px-3 py-2">
                <img src="/270970406.jpeg" alt="Repnex logo" className="h-7 w-7 rounded-md object-contain bg-white p-1" />
                <span className="text-sm font-semibold">Repnex</span>
              </div>
            </div>

            {/* Header */}
            <div className="mb-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5">
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">Account Activation</span>
              </div>
              <h2 className="text-2xl font-semibold">Create your password</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {orgName
                  ? `Joining ${orgName}. Set a strong password to activate your account.`
                  : 'Set a strong password to activate your account and join the workspace.'}
              </p>
            </div>

            {(inviteEmail || inviteRole) && (
              <div className="mb-5 rounded-2xl border border-border/60 bg-black/[0.02] p-4 text-sm dark:bg-white/[0.02]">
                {inviteEmail && <p className="font-medium text-foreground">{inviteEmail}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {orgName && <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-medium text-primary">{orgName}</span>}
                  {inviteRole && <span className="rounded-lg bg-black/5 px-2.5 py-1 font-medium capitalize text-muted-foreground dark:bg-white/5">{inviteRole}</span>}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Password */}
              <div>
                <PasswordInput
                  id="invite-password"
                  label="New password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
                <AnimatePresence>
                  {password && <StrengthMeter password={password} />}
                </AnimatePresence>
              </div>

              {/* Confirm */}
              <div>
                <label htmlFor="invite-confirm" className="mb-1.5 block text-sm font-medium text-foreground/85">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="invite-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-colors bg-black/5 dark:bg-white/5 ${
                      confirmPassword && !passwordsMatch
                        ? 'border-rose-500/50 focus:border-rose-500/70'
                        : confirmPassword && passwordsMatch
                        ? 'border-emerald-500/50 focus:border-emerald-500/70'
                        : 'border-transparent focus:border-primary/50'
                    }`}
                  />
                  {confirmPassword && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {passwordsMatch
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        : <AlertTriangle className="h-4 w-4 text-rose-500" />}
                    </div>
                  )}
                </div>
                <AnimatePresence>
                  {confirmPassword && !passwordsMatch && (
                    <Motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-1 text-xs text-rose-500"
                    >
                      Passwords do not match
                    </Motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Error */}
              <AnimatePresence>
                {errorMessage && (
                  <Motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400"
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    {errorMessage}
                  </Motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:from-primary/95 hover:to-blue-600/95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Activate Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Security note */}
            <div className="mt-6 rounded-xl border border-border/50 bg-black/[0.02] dark:bg-white/[0.02] px-4 py-3.5 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2 font-medium text-foreground/70">
                <ShieldCheck className="h-3.5 w-3.5" />
                Enterprise Security
              </div>
              <p>Your password is hashed with bcrypt and never stored in plain text. This invitation token is single-use and expires in 24 hours.</p>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </div>
      </Motion.div>
    </div>
  );
}
