import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { RetailerPage } from './pages/RetailerPage';
import { DispatcherPage } from './pages/DispatcherPage';
import { RiderPage } from './pages/RiderPage';

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
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
        </Routes>
      </main>
    </div>
  );
}
