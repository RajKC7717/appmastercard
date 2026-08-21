import { Bell } from 'lucide-react'
import styles from './AdminTopbar.module.css'

function AdminTopbar({ greeting, title }) {
  return (
    <header className={styles.topbar}>
      <div>
        <p>{greeting}</p>
        <h1>{title}</h1>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.iconBtn} aria-label="Notifications">
          <Bell size={18} />
        </button>

        <div className={styles.profile}>
          <div className={styles.avatar}>NG</div>
          <span>NGO Admin</span>
        </div>
      </div>
    </header>
  )
}

export default AdminTopbar
