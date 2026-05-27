import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Loader2 } from 'lucide-react';
import { organizationApi } from '../services/api';

const initialForm = {
  organizationName: '',
  industry: '',
  erpSystem: '',
  teamSize: '',
};

export default function OnboardingPage({ user, onComplete }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ...initialForm,
    organizationName: user?.company || '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!form.organizationName.trim()) {
      setErrorMessage('Organization name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await organizationApi.completeOnboarding(form);
      onComplete(response.user);
      navigate('/connections', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save onboarding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-3 rounded-xl border border-border/50 bg-card/80 px-4 py-3 shadow-sm">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Organization onboarding</p>
              <p className="text-xs text-muted-foreground">Set up the workspace before connecting databases.</p>
            </div>
          </div>
          <h1 className="text-3xl font-semibold">Finish your workspace setup</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This keeps the basic auth and organization flow ready while the report generation engine stays separate.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-border/50 bg-card/90 p-6 shadow-xl md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="organizationName" className="mb-1.5 block text-sm font-medium text-foreground/85">
                Organization name
              </label>
              <input
                id="organizationName"
                type="text"
                value={form.organizationName}
                onChange={(event) => updateField('organizationName', event.target.value)}
                placeholder="Repnex Labs"
                className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
              />
            </div>

            <div>
              <label htmlFor="industry" className="mb-1.5 block text-sm font-medium text-foreground/85">
                Industry
              </label>
              <input
                id="industry"
                type="text"
                value={form.industry}
                onChange={(event) => updateField('industry', event.target.value)}
                placeholder="Manufacturing"
                className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
              />
            </div>

            <div>
              <label htmlFor="erpSystem" className="mb-1.5 block text-sm font-medium text-foreground/85">
                Primary ERP
              </label>
              <input
                id="erpSystem"
                type="text"
                value={form.erpSystem}
                onChange={(event) => updateField('erpSystem', event.target.value)}
                placeholder="SAP / Oracle / Dynamics"
                className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="teamSize" className="mb-1.5 block text-sm font-medium text-foreground/85">
                Team size
              </label>
              <select
                id="teamSize"
                value={form.teamSize}
                onChange={(event) => updateField('teamSize', event.target.value)}
                className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
              >
                <option value="">Select team size</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-1000">201-1000</option>
                <option value="1000+">1000+</option>
              </select>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-primary/5 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              After this step, you land on database connections and can start basic onboarding of your organization data sources.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:from-primary/95 hover:to-blue-600/95 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
              {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
