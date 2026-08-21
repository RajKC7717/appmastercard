import { User, Calendar } from 'lucide-react'
import Badge from '../../shared/ui/Badge.jsx'
import styles from './ActionItemCard.module.css'

const bucketLabel = {
  must: 'Must Have',
  should: 'Should Have',
  could: 'Could Have',
  watch: 'Watch',
}

function ActionItemCard({ item }) {
  return (
    <div className={styles.card}>
      <Badge tone={item.bucket}>{bucketLabel[item.bucket] ?? item.bucket}</Badge>
      <h3>{item.action}</h3>

      <div className={styles.meta}>
        <span>
          <User size={13} /> {item.responsibleRole}
        </span>
        <span>
          <Calendar size={13} /> {item.deadline}
        </span>
      </div>
    </div>
  )
}

export default ActionItemCard
