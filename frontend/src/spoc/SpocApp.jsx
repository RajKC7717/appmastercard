import { Route, Routes } from 'react-router-dom';
import SpocLayout from './SpocLayout.jsx';
import SpocDashboard from './pages/SpocDashboard.jsx';
import SpocActivities from './pages/SpocActivities.jsx';
import SpocActivityDetail from './pages/SpocActivityDetail.jsx';
import SpocInsights from './pages/SpocInsights.jsx';
import SpocRequests from './pages/SpocRequests.jsx';
import SpocReports from './pages/SpocReports.jsx';

/** The corporate SPOC console as one lazily-loaded module. See AdminApp. */
export default function SpocApp() {
  return (
    <Routes>
      <Route element={<SpocLayout />}>
        <Route index element={<SpocDashboard />} />
        <Route path="activities" element={<SpocActivities />} />
        <Route path="activities/:activityId" element={<SpocActivityDetail />} />
        <Route path="requests" element={<SpocRequests />} />
        <Route path="insights" element={<SpocInsights />} />
        <Route path="reports" element={<SpocReports />} />
      </Route>
    </Routes>
  );
}
