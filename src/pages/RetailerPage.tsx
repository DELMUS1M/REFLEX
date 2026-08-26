import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useLiveRequests } from '../lib/useLiveRequests';
import { createRequest } from '../lib/api';
import { useAuth } from '../lib/auth';
import { StatusBadge } from '../components/StatusBadge';
import { clockTime } from '../lib/time';
import { PackagePlus, Loader2 } from 'lucide-react';

interface FormState {
  customer_name: string;
  phone: string;
  address: string;
  item: string;
}

const EMPTY: FormState = { customer_name: '', phone: '', address: '', item: '' };

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.customer_name.trim()) errors.customer_name = 'Enter the customer\u2019s name.';
  if (!/^\+?[0-9\s-]{7,15}$/.test(form.phone.trim())) errors.phone = 'Enter a valid phone number.';
  if (!form.address.trim()) errors.address = 'Enter a delivery address.';
  if (!form.item.trim()) errors.item = 'Describe what\u2019s being delivered.';
  return errors;
}

export function RetailerPage() {
  const { profile } = useAuth();
  const { requests, riders, loading, error: loadError } = useLiveRequests();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [justCreated, setJustCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const myRequests = useMemo(
    () => [...requests].filter((r) => r.created_by === profile?.id).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [requests, profile?.id]
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !profile) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await createRequest(form, profile.id);
      setForm(EMPTY);
      setJustCreated(true);
      window.setTimeout(() => setJustCreated(false), 4000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not log the request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">New delivery request</h1>
      <p className="mt-1.5 text-[var(--color-muted-foreground)]">
        Fill this in once. Everyone downstream sees it immediately.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"
        >
          <Field
            label="Customer name"
            id="customer_name"
            value={form.customer_name}
            onChange={(v) => update('customer_name', v)}
            error={errors.customer_name}
            autoComplete="name"
          />
          <Field
            label="Phone number"
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(v) => update('phone', v)}
            error={errors.phone}
            autoComplete="tel"
            placeholder="e.g. 0712 345 678"
          />
          <Field
            label="Delivery address"
            id="address"
            value={form.address}
            onChange={(v) => update('address', v)}
            error={errors.address}
            autoComplete="street-address"
          />
          <Field
            label="Item description"
            id="item"
            value={form.item}
            onChange={(v) => update('item', v)}
            error={errors.item}
            placeholder="e.g. 2x car battery, 1x inverter"
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 font-medium text-[var(--color-on-primary)] transition-colors hover:brightness-95 disabled:opacity-70"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <PackagePlus size={18} aria-hidden="true" />}
            Log request
          </button>
          <p aria-live="polite" className="mt-3 min-h-[20px] text-sm">
            {justCreated && <span className="text-[var(--color-success)]">Request logged. It\u2019s in the dispatcher queue now.</span>}
            {submitError && <span className="text-[var(--color-destructive)]">{submitError}</span>}
          </p>
        </form>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            My requests
          </h2>

          {loadError && (
            <p role="alert" className="mb-3 rounded-lg border border-[var(--color-destructive)] bg-red-50 px-3 py-2 text-sm text-[var(--color-destructive)]">
              {loadError}
            </p>
          )}

          {loading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] p-10 text-[var(--color-muted-foreground)]">
              <Loader2 className="animate-spin" size={18} aria-hidden="true" /> Loading…
            </div>
          ) : myRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-[var(--color-muted-foreground)]">
              Nothing logged yet. Requests you create will show up here with live status.
            </div>
          ) : (
            <>
              <ul className="grid gap-3 sm:hidden">
                {myRequests.map((req) => (
                  <li key={req.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{req.customer_name}</p>
                        <p className="text-sm text-[var(--color-muted-foreground)]">{req.item}</p>
                      </div>
                      <StatusBadge status={req.status} since={req.status_since} />
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{req.address}</p>
                    {req.rider_name && <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Rider: {req.rider_name}</p>}
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] sm:block">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
                      <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                      <th scope="col" className="px-4 py-3 font-medium">Item</th>
                      <th scope="col" className="px-4 py-3 font-medium">Address</th>
                      <th scope="col" className="px-4 py-3 font-medium">Rider</th>
                      <th scope="col" className="px-4 py-3 font-medium">Logged</th>
                      <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map((req) => (
                      <tr key={req.id} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="px-4 py-3 font-medium">{req.customer_name}</td>
                        <td className="px-4 py-3">{req.item}</td>
                        <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{req.address}</td>
                        <td className="px-4 py-3">{req.rider_name ?? '—'}</td>
                        <td className="px-4 py-3 font-data text-[var(--color-muted-foreground)]">{clockTime(new Date(req.created_at).getTime())}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={req.status} since={req.status_since} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      <span className="sr-only">{riders.length} riders on the team</span>
    </div>
  );
}

interface FieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}

function Field({ label, id, value, onChange, error, type = 'text', placeholder, autoComplete }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`min-h-[44px] w-full rounded-lg border bg-[var(--color-card)] px-3 py-2 text-[var(--color-foreground)] outline-none transition-colors focus-visible:border-[var(--color-primary)] ${
          error ? 'border-[var(--color-destructive)]' : 'border-[var(--color-border)]'
        }`}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      )}
    </div>
  );
}
