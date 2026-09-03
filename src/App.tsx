import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';

// Route-level code-splitting: the landing page (and its GSAP hero animation)
// ships in the initial bundle since every visitor hits it. Everything behind
// auth, plus low-traffic auth screens, loads on demand instead of bloating
// the first paint.
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then((m) => ({ default: m.SignupPage })));
const RetailerPage = lazy(() => import('./pages/RetailerPage').then((m) => ({ default: m.RetailerPage })));
const DispatcherPage = lazy(() => import('./pages/DispatcherPage').then((m) => ({ default: m.DispatcherPage })));
const RiderPage = lazy(() => import('./pages/RiderPage').then((m) => ({ default: m.RiderPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-[var(--color-muted-foreground)]">
      <Loader2 className="animate-spin" size={20} aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';

  return (
    <div
      className={`min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] transition-colors ${
        isLanding ? 'theme-landing' : ''
      }`}
    >
      
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/retailer"
              element={
                <ProtectedRoute allow={['retailer', 'dispatcher']}>
                  <RetailerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dispatcher"
              element={
                <ProtectedRoute allow={['dispatcher']}>
                  <DispatcherPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider"
              element={
                <ProtectedRoute allow={['rider']}>
                  <RiderPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}