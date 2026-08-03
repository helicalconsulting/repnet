import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Loader2 } from 'lucide-react';
import { organizationApi } from '../services/api';
import { ProductMark } from '../components/ui/product-ui';

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
    <div className="workspace-canvas surface-grid min-h-screen px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="mb-6 inline-flex items-center gap-3">
            <ProductMark className="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold">Repnex</p>
              <p className="text-xs text-muted-foreground">Workspace setup</p>
            </div>
          </div>
          <h1 className="page-heading text-3xl font-semibold">Tell us about your organization</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            These details help us set up the workspace for your team. You can update them later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-panel app-card rounded-3xl p-6 shadow-xl md:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-border/55 pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Organization details</h2>
              <p className="text-xs text-muted-foreground">Only the organization name is required.</p>
            </div>
          </div>
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

          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-4 sm:flex-row sm:items-center">
            <p className="text-sm leading-6 text-muted-foreground">
              Next, you’ll connect the data source you want to use for reports.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="brand-gradient flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 sm:w-auto"
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
