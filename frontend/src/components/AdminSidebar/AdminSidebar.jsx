import { NavLink } from 'react-router-dom'
import { Home, Calendar, MessageSquare, Users, Brain, BarChart3, Settings } from 'lucide-react'
import styles from './AdminSidebar.module.css'

const menuItems = [
  { label: 'Dashboard', icon: Home, to: '/admin', end: true },
  { label: 'Activities', icon: Calendar },
  { label: 'Feedback', icon: MessageSquare },
  { label: 'Volunteers', icon: Users },
  { label: 'Insights', icon: Brain, to: '/admin/insights' },
  { label: 'Reports', icon: BarChart3 },
]

function AdminSidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandLogo}>S</div>
        <div>
          <h2>SevaSahayog</h2>
          <span>NGO Portal</span>
        </div>
      </div>

      <div className={styles.menuTitle}>MAIN MENU</div>

      {menuItems.map(({ label, icon: Icon, to, end }) =>
        to ? (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) => `${styles.menu} ${isActive ? styles.active : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ) : (
          <button key={label} type="button" className={styles.menu}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        )
      )}

      <div className={styles.sidebarBottom}>
        <button type="button" className={styles.menu}>
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <div className={styles.adminProfile}>
          <div className={styles.avatar}>NG</div>
          <div>
            <strong>NGO Admin</strong>
            <small>SevaSahayog</small>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default AdminSidebar
