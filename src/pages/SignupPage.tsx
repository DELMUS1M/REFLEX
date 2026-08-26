import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { ReflexRole } from '../lib/types';
import { UserPlus } from 'lucide-react';

const ROLES: { value: ReflexRole; label: string }[] = [
  { value: 'retailer', label: 'Retailer staff' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'rider', label: 'Rider' },
];

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<ReflexRole>('retailer');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signUp(email, password, fullName, role, phone || undefined);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    setDone(true);
    window.setTimeout(() => navigate('/login'), 1800);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-2 text-[var(--color-muted-foreground)]">
          Confirm your address, then sign in. Taking you to the sign-in page…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-1.5 text-[var(--color-muted-foreground)]">Pick the role you'll be using Reflex as.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium">
          Full name
        </label>
        <input
          id="fullName"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mb-4 min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 outline-none focus-visible:border-[var(--color-primary)]"
        />

        <label htmlFor="su-email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="su-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 outline-none focus-visible:border-[var(--color-primary)]"
        />

        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
          Phone <span className="text-[var(--color-muted-foreground)]">(riders — used for job SMS)</span>
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mb-4 min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 outline-none focus-visible:border-[var(--color-primary)]"
        />

        <label htmlFor="su-password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <input
          id="su-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 outline-none focus-visible:border-[var(--color-primary)]"
        />

        <fieldset className="mb-4">
          <legend className="mb-1.5 text-sm font-medium">Role</legend>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-center text-sm font-medium ${
                  role === r.value
                    ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-foreground)]'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  className="sr-only"
                />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="mb-4 text-sm text-[var(--color-destructive)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 font-medium text-[var(--color-on-primary)] transition-colors hover:brightness-95 disabled:opacity-70"
        >
          <UserPlus size={18} aria-hidden="true" />
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--color-muted-foreground)]">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-[var(--color-primary)]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
