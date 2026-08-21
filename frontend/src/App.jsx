<<<<<<< HEAD
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
=======
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './components/AdminLayout/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminActivityDetail from './pages/AdminActivityDetail'
import AdminInsights from './pages/AdminInsights'
import { activities } from './data/mockActivities'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="activities/:activityId" element={<AdminActivityDetail />} />
          <Route path="insights" element={<Navigate to={`/admin/insights/${activities[0].id}`} replace />} />
          <Route path="insights/:eventId" element={<AdminInsights />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
>>>>>>> bc64df7ecae2db9898f4a5bbbcd80102f4e46de0
}
