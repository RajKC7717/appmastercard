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
}

export default App
