import { NavLink } from 'react-router-dom';
import { ConnectionIndicator } from './ConnectionIndicator';
import { useAuth } from '../lib/auth';
import { LogOut } from 'lucide-react';

const LINKS: { to: string; label: string; role: 'retailer' | 'dispatcher' | 'rider' }[] = [
  { to: '/retailer', label: 'Retailer', role: 'retailer' },
  { to: '/dispatcher', label: 'Dispatcher', role: 'dispatcher' },
  { to: '/rider', label: 'Rider', role: 'rider' },
];

export function Header() {
  const { session, profile, signOut } = useAuth();
  const visibleLinks = profile
    ? LINKS.filter((l) => l.role === profile.role || (profile.role === 'dispatcher' && l.role === 'retailer'))
    : [];

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-card)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2 shrink-0" aria-label="Reflex home">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="var(--color-foreground)" />
            <path
              d="M8 22V10h6.5c2.5 0 4.2 1.6 4.2 3.9 0 1.7-.9 3-2.4 3.5L19 22h-3l-2.3-4.2h-2.8V22H8zm2.9-6.6h3.3c1.2 0 2-.7 2-1.7 0-1-.8-1.7-2-1.7h-3.3v3.4z"
              fill="white"
            />
            <circle cx="23.5" cy="10.5" r="2.5" fill="var(--color-accent)" />
          </svg>
          <span className="text-lg font-semibold tracking-tight">Reflex</span>
        </NavLink>

        <nav aria-label="Primary" className="flex items-center gap-1 overflow-x-auto">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `min-h-[44px] rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                    : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden sm:block">
            <ConnectionIndicator />
          </div>
          {session && (
            <button
              onClick={() => signOut()}
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            >
              <LogOut size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
