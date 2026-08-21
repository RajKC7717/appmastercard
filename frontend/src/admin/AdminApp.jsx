import { Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminActivities from './pages/AdminActivities.jsx';
import AdminActivityDetail from './pages/AdminActivityDetail.jsx';
import AdminFeedback from './pages/AdminFeedback.jsx';
import AdminThemes from './pages/AdminThemes.jsx';
import AdminActionPlans from './pages/AdminActionPlans.jsx';
import AdminActionPlanDetail from './pages/AdminActionPlanDetail.jsx';
import AdminReports from './pages/AdminReports.jsx';
import AdminPartners from './pages/AdminPartners.jsx';

/**
 * The whole NGO admin console as one module, so App.jsx can load it
 * lazily. That is not tidiness — it is bandwidth. A volunteer opening
 * the feedback form on mobile data at a plantation site should not be
 * made to download the admin console's tables, exports and charts to get
 * to a nine-question form. Splitting here keeps the volunteer bundle to
 * what a volunteer actually runs.
 */
export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="activities" element={<AdminActivities />} />
        <Route path="activities/:activityId" element={<AdminActivityDetail />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="themes" element={<AdminThemes />} />
        <Route path="action-plans" element={<AdminActionPlans />} />
        <Route path="action-plans/:eventId" element={<AdminActionPlanDetail />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="partners" element={<AdminPartners />} />
      </Route>
    </Routes>
  );
}
