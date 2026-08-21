import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider, useAuth } from './auth/AuthProvider.jsx';
import RequireAuth, { RedirectIfSignedIn } from './auth/RequireAuth.jsx';
import LoginPage from './auth/LoginPage.jsx';
import SignupPage from './auth/SignupPage.jsx';
import { ToastProvider } from './shared/ui/Toast.jsx';
import { Skeleton } from './shared/ui/States.jsx';

import { VolunteerProvider } from './volunteer/state/VolunteerProvider.jsx';
import VolunteerLayout from './volunteer/VolunteerLayout.jsx';
import HomePage from './volunteer/pages/HomePage.jsx';
import EventsPage from './volunteer/pages/EventsPage.jsx';
import HistoryPage from './volunteer/pages/HistoryPage.jsx';
import ProfilePage from './volunteer/pages/ProfilePage.jsx';
import FeedbackPage from './volunteer/pages/FeedbackPage.jsx';

/* The two consoles are code-split out of the volunteer bundle. A
   volunteer on mobile data at a plantation site should not download an
   admin console to reach a nine-question form. */
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));
const SpocApp = lazy(() => import('./spoc/SpocApp.jsx'));

/**
 * ROUTES — one product, three apps, one front door.
 *
 * The front door is the sign-in screen, never a marketing page. After
 * signing in, the role decides which app opens:
 *
 *   VOLUNTEER      -> /volunteer  the portal and the 60-second form
 *   SPOC           -> /spoc       their own company, and only theirs
 *   ADMIN / STAFF  -> /admin      the Foundation's console
 *
 * Every app sits behind <RequireAuth roles={…}>. Signing in as one role
 * and typing another app's URL does not render that app — it redirects to
 * the app that role owns. Worth being precise about what that is and is
 * not: this is navigation, not authorisation. The rule that actually
 * protects data is the role middleware on the API, which checks the JWT
 * cookie on every request. This layer stops the wrong screen appearing;
 * that layer stops the wrong data leaving.
 *
 * The volunteer feedback flow sits OUTSIDE the portal shell on purpose.
 * It is a single-purpose task screen, and navigation chrome there would
 * only compete with the one thing the volunteer came to do.
 */
function RootRedirect() {
  const { user, home } = useAuth();
  return <Navigate to={user ? home : '/login'} replace />;
}

/** Matches the console's own loading shape, so nothing jumps on arrival. */
function ConsoleFallback() {
  return (
    <div style={{ padding: 'var(--space-8)', display: 'grid', gap: 'var(--space-4)' }}>
      <Skeleton height={40} width="40%" />
      <Skeleton height={120} radius="md" />
      <Skeleton height={280} radius="md" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* ---- Public ------------------------------------------- */}
            <Route
              path="/login"
              element={
                <RedirectIfSignedIn>
                  <LoginPage />
                </RedirectIfSignedIn>
              }
            />
            <Route
              path="/signup"
              element={
                <RedirectIfSignedIn>
                  <SignupPage />
                </RedirectIfSignedIn>
              }
            />

            {/* ---- Volunteer ---------------------------------------- */}
            <Route element={<RequireAuth roles={['VOLUNTEER']} />}>
              <Route
                path="/volunteer"
                element={
                  <VolunteerProvider>
                    <VolunteerLayout />
                  </VolunteerProvider>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              <Route
                path="/volunteer/feedback/:activityId"
                element={
                  <VolunteerProvider>
                    <FeedbackPage />
                  </VolunteerProvider>
                }
              />
            </Route>

            {/* ---- NGO admin ---------------------------------------- */}
            <Route element={<RequireAuth roles={['ADMIN', 'STAFF']} />}>
              <Route
                path="/admin/*"
                element={
                  <Suspense fallback={<ConsoleFallback />}>
                    <AdminApp />
                  </Suspense>
                }
              />
            </Route>

            {/* ---- Corporate SPOC ----------------------------------- */}
            <Route element={<RequireAuth roles={['SPOC']} />}>
              <Route
                path="/spoc/*"
                element={
                  <Suspense fallback={<ConsoleFallback />}>
                    <SpocApp />
                  </Suspense>
                }
              />
            </Route>

            {/* An unknown address lands you wherever you belong, rather
                than on a dead end that tells you nothing. */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
