import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { LogIn } from 'lucide-react';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    navigate('/');
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1.5 text-[var(--color-muted-foreground)]">Use the account your dispatcher set up for you.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 outline-none focus-visible:border-[var(--color-primary)]"
        />

        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 outline-none focus-visible:border-[var(--color-primary)]"
        />

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
          <LogIn size={18} aria-hidden="true" />
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--color-muted-foreground)]">
        No account yet?{' '}
        <Link to="/signup" className="font-medium text-[var(--color-primary)]">
          Create one
        </Link>
      </p>
    </div>
  );
}
