import { Outlet } from 'react-router-dom'
import AdminSidebar from '../AdminSidebar/AdminSidebar'
import styles from './AdminLayout.module.css'

function AdminLayout() {
  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
