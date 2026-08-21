import { NavLink } from 'react-router-dom'
import styles from './InsightsEventSwitcher.module.css'

function InsightsEventSwitcher({ activities }) {
  return (
    <nav className={styles.switcher}>
      {activities.map((activity) => (
        <NavLink
          key={activity.id}
          to={`/admin/insights/${activity.id}`}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          {activity.title}
        </NavLink>
      ))}
    </nav>
  )
}

export default InsightsEventSwitcher
