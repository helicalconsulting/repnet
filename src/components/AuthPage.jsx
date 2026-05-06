import { useState, useEffect } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { authApi } from '../services/mockApi';

const defaultFormData = {
  name: '',
  company: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const THEME_STORAGE_KEY = 'repnex-theme';
const ssoProviders = [
  { id: 'microsoft-entra', label: 'Microsoft Entra', logoSrc: '/sso/microsoft.svg' },
  { id: 'okta', label: 'Okta', logoSrc: '/sso/okta.svg' },
  { id: 'google', label: 'Google Workspace', logoSrc: '/sso/google.svg' },
];

const designPillars = [
  {
    icon: ShieldCheck,
    title: 'Secure local session',
    description: 'Authentication state is persisted in browser storage for this demo environment.',
  },
  {
    icon: Database,
    title: 'ERP-ready workspace',
    description: 'Jump straight into connected data sources and AI-generated reports after sign in.',
  },
  {
    icon: Sparkles,
    title: 'Designed for analysts',
    description: 'The same card, glow and rounded control system as the main product experience.',
  },
];

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('signin');
  const [formData, setFormData] = useState(defaultFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const isSignIn = mode === 'signin';
  const isMfaStep = Boolean(mfaChallenge);

  useEffect(() => {
    let isDark = false;

    try {
      isDark = window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
    } catch {
      isDark = false;
    }

    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const resetMfaStep = () => {
    setErrorMessage('');
    setMfaChallenge(null);
    setMfaCode('');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrorMessage('');
    setShowPassword(false);
    resetMfaStep();
    setFormData((prev) => ({
      ...prev,
      password: '',
      confirmPassword: '',
    }));
  };

  const applyDemoCredentials = () => {
    setMode('signin');
    setErrorMessage('');
    resetMfaStep();
    setFormData((prev) => ({
      ...prev,
      email: 'demo@repnex.ai',
      password: 'demo@123',
      confirmPassword: '',
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      return 'Email and password are required.';
    }

    if (!emailPattern.test(formData.email.trim())) {
      return 'Enter a valid email address.';
    }

    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (!isSignIn) {
      if (formData.name.trim().length < 2) {
        return 'Full name must be at least 2 characters.';
      }

      if (formData.password !== formData.confirmPassword) {
        return 'Password confirmation does not match.';
      }
    }

    return null;
  };

  const handleAuthResponse = (response) => {
    if (response?.requiresMfa) {
      setMfaChallenge(response);
      setMfaCode('');
      return;
    }

    onAuthSuccess(response);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const authResponse = isSignIn
        ? await authApi.signIn({
            email: formData.email,
            password: formData.password,
          })
        : await authApi.signUp({
            name: formData.name.trim(),
            company: formData.company.trim(),
            email: formData.email,
            password: formData.password,
            mfaEnabled: true,
          });

      handleAuthResponse(authResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSsoSignIn = async (providerId) => {
    setErrorMessage('');

    if (!formData.email.trim()) {
      setErrorMessage('Enter your work email before using SSO.');
      return;
    }

    if (!emailPattern.test(formData.email.trim())) {
      setErrorMessage('Enter a valid work email for SSO.');
      return;
    }

    setIsSubmitting(true);

    try {
      const authResponse = await authApi.signInWithSso({
        provider: providerId,
        email: formData.email,
      });
      handleAuthResponse(authResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'SSO sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyMfa = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!mfaChallenge) {
      setErrorMessage('MFA session expired. Start sign in again.');
      return;
    }

    if (!/^\d{6}$/.test(mfaCode.trim())) {
      setErrorMessage('Enter a valid 6-digit MFA code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const authenticatedUser = await authApi.verifyMfa({
        challengeId: mfaChallenge.challengeId,
        code: mfaCode,
      });
      onAuthSuccess(authenticatedUser);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'MFA verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendMfa = async () => {
    setErrorMessage('');

    if (!mfaChallenge) {
      return;
    }

    setIsSubmitting(true);

    try {
      const refreshedChallenge = await authApi.resendMfaCode({
        challengeId: mfaChallenge.challengeId,
      });
      setMfaChallenge((prev) => ({
        ...prev,
        ...refreshedChallenge,
      }));
      setMfaCode('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to resend MFA code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-100px] left-[15%] h-[320px] w-[320px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-120px] right-[8%] h-[360px] w-[360px] rounded-full bg-blue-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center p-4 md:p-8">
        <div className="grid w-full overflow-hidden rounded-3xl border border-border/50 bg-card/85 shadow-2xl backdrop-blur-xl md:grid-cols-2">
          <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary to-blue-700 p-10 text-white">
            <div>
              <div className="mb-8 inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
                <img src="/270970406.jpeg" alt="Repnex logo" className="h-8 w-8 rounded-lg object-contain bg-white/90 p-1" />
                <div>
                  <p className="text-sm font-semibold">Repnex</p>
                  <p className="text-xs text-white/75">AI-Powered ERP Reports</p>
                </div>
              </div>
              <h1 className="mb-3 text-3xl font-semibold leading-tight">Build reports from natural language in seconds.</h1>
              <p className="text-sm text-white/80 leading-relaxed">
                Sign in to access your workspace, connected databases, and AI chat sessions.
              </p>
            </div>

            <div className="space-y-4">
              {designPillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.title} className="rounded-xl border border-white/20 bg-white/10 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4" />
                      {pillar.title}
                    </div>
                    <p className="text-xs text-white/80">{pillar.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-7 sm:p-9 md:p-10">
            <div className="mb-6 md:hidden">
              <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-border/50 bg-black/5 dark:bg-white/5 px-3 py-2">
                <img src="/270970406.jpeg" alt="Repnex logo" className="h-7 w-7 rounded-md object-contain bg-white p-1" />
                <span className="text-sm font-semibold">Repnex</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-4 inline-flex rounded-xl bg-black/5 p-1 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isSignIn ? 'bg-card shadow text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    !isSignIn ? 'bg-card shadow text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Create account
                </button>
              </div>

              <h2 className="text-2xl font-semibold">{isSignIn ? 'Welcome back' : 'Create your workspace account'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isSignIn
                  ? 'Sign in to continue where you left off.'
                  : 'Start with a new account and jump into report generation.'}
              </p>
            </div>

            {!isMfaStep ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence mode="wait" initial={false}>
                    {!isSignIn && (
                      <Motion.div
                        key="signup-fields"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-4"
                      >
                        <div>
                          <label htmlFor="full-name" className="mb-1.5 block text-sm font-medium text-foreground/85">
                            Full name
                          </label>
                          <input
                            id="full-name"
                            type="text"
                            value={formData.name}
                            onChange={(event) => updateField('name', event.target.value)}
                            placeholder="Keshav Sharma"
                            className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
                          />
                        </div>
                        <div>
                          <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-foreground/85">
                            Company (optional)
                          </label>
                          <input
                            id="company"
                            type="text"
                            value={formData.company}
                            onChange={(event) => updateField('company', event.target.value)}
                            placeholder="Repnex Labs"
                            className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
                          />
                        </div>
                      </Motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground/85">
                      Work email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground/85">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(event) => updateField('password', event.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 pr-12 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
                        autoComplete={isSignIn ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors dark:hover:bg-white/10"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {!isSignIn && (
                    <div>
                      <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-foreground/85">
                        Confirm password
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(event) => updateField('confirmPassword', event.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
                        autoComplete="new-password"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:from-primary/95 hover:to-blue-600/95 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {isSignIn ? 'Continue to MFA' : 'Create account'}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                {isSignIn && (
                  <div className="mt-5">
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/60" />
                      </div>
                      <span className="relative bg-card px-3 text-xs text-muted-foreground">Enterprise SSO</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {ssoProviders.map((provider) => {
                        return (
                          <button
                            key={provider.id}
                            type="button"
                            onClick={() => handleSsoSignIn(provider.id)}
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-black/[0.02] px-3 py-2.5 text-xs font-medium text-foreground/90 transition-colors hover:bg-black/5 disabled:opacity-60 dark:bg-white/[0.02] dark:hover:bg-white/[0.08]"
                          >
                            <img src={provider.logoSrc} alt="" aria-hidden="true" className="h-4 w-4 shrink-0 object-contain" />
                            {provider.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Use your Active Directory work email and continue with Entra, Okta, or Google SSO.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleVerifyMfa} className="space-y-4">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                    <KeyRound className="h-4 w-4" />
                    Multi-factor verification
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We sent a 6-digit code via <span className="font-semibold text-foreground">{mfaChallenge.delivery}</span> for{' '}
                    <span className="font-semibold text-foreground">{mfaChallenge.authMethod}</span>.
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Demo code: <span className="font-semibold text-foreground">{mfaChallenge.demoCode}</span>
                  </p>
                </div>

                <div>
                  <label htmlFor="mfa-code" className="mb-1.5 block text-sm font-medium text-foreground/85">
                    Enter verification code
                  </label>
                  <input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    value={mfaCode}
                    onChange={(event) => {
                      setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                    }}
                    placeholder="123456"
                    className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-center text-lg tracking-[0.25em] font-semibold outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
                    autoComplete="one-time-code"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:from-primary/95 hover:to-blue-600/95 disabled:opacity-60"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Continue'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendMfa}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-black/[0.02] px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-black/5 disabled:opacity-60 dark:bg-white/[0.02] dark:hover:bg-white/[0.08]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Resend
                  </button>
                </div>

                <button
                  type="button"
                  onClick={resetMfaStep}
                  className="w-full rounded-xl border border-border/60 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/[0.02] transition-colors dark:hover:bg-white/[0.02]"
                >
                  Back to sign in
                </button>
              </form>
            )}

            <AnimatePresence>
              {errorMessage && (
                <Motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400"
                >
                  {errorMessage}
                </Motion.p>
              )}
            </AnimatePresence>

            <div className="mt-6 rounded-xl border border-border/50 bg-black/[0.02] p-4 text-xs text-muted-foreground dark:bg-white/[0.02]">
              <div className="flex items-center justify-between gap-4">
                <p className="leading-relaxed">
                  Use the built-in demo account for instant access while evaluating the interface.
                </p>
                <button
                  type="button"
                  onClick={applyDemoCredentials}
                  className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
                >
                  Use demo login
                </button>
              </div>
              <p className="mt-2 text-[11px]">
                demo@repnex.ai / demo@123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
