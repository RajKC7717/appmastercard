import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { VolunteerProvider } from './volunteer/state/VolunteerProvider.jsx';
import VolunteerLayout from './volunteer/VolunteerLayout.jsx';
import HomePage from './volunteer/pages/HomePage.jsx';
import EventsPage from './volunteer/pages/EventsPage.jsx';
import HistoryPage from './volunteer/pages/HistoryPage.jsx';
import ProfilePage from './volunteer/pages/ProfilePage.jsx';
import FeedbackPage from './volunteer/pages/FeedbackPage.jsx';

/**
 * Routes.
 *
 * Everything the volunteer sees lives under /volunteer. Sign-in is a
 * separate teammate's screen and is expected to land here after auth.
 *
 * The four portal tabs share the navbar shell. The feedback flow sits
 * outside it on purpose — it is a single-purpose task screen, and
 * navigation chrome there would only compete with the one thing on it.
 */
export default function App() {
  return (
    <BrowserRouter>
      <VolunteerProvider>
        <Routes>
          <Route path="/volunteer" element={<VolunteerLayout />}>
            <Route index element={<HomePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="/volunteer/feedback/:activityId" element={<FeedbackPage />} />

          {/* Until the sign-in screen exists, the front door is the portal. */}
          <Route path="*" element={<Navigate to="/volunteer" replace />} />
        </Routes>
      </VolunteerProvider>
    </BrowserRouter>
  );
}
