import { TriangleAlert } from 'lucide-react'
import ProgressBar from '../ProgressBar/ProgressBar'
import Badge from '../Badge/Badge'
import { categoryIcons, DefaultCategoryIcon } from '../../data/categoryIcons'
import styles from './ActivityCard.module.css'

function ActivityCard({ activity, onClick }) {
  const CategoryIcon = categoryIcons[activity.category] ?? DefaultCategoryIcon

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.icon}>
          <CategoryIcon size={20} />
        </div>
        <span className={styles.category}>{activity.category}</span>
      </div>

      <h3>{activity.title}</h3>
      <p className={styles.meta}>
        {activity.date} &bull; {activity.partner}
      </p>

      <div className={styles.stats}>
        <div>
          <span>Volunteers</span>
          <strong>{activity.volunteers}</strong>
        </div>
        <div>
          <span>Responses</span>
          <strong>{activity.responses}</strong>
        </div>
        <div>
          <span>Rating</span>
          <strong>&#9733; {activity.rating}</strong>
        </div>
      </div>

      <div className={styles.response}>
        <div className={styles.responseHeading}>
          <span>Feedback response</span>
          <strong>{activity.responseRate}%</strong>
        </div>
        <ProgressBar percentage={activity.responseRate} />
      </div>

      <div className={styles.statusRow}>
        <Badge tone={activity.feedbackStatus === 'open' ? 'watch' : 'success'}>
          {activity.feedbackStatus === 'open' ? 'Feedback open' : 'Feedback closed'}
        </Badge>
      </div>

      {activity.issues > 0 && (
        <div className={styles.issue}>
          <TriangleAlert size={14} />
          {activity.issues} recurring issue{activity.issues > 1 ? 's' : ''} detected
        </div>
      )}

      <button type="button" className={styles.detailsBtn} onClick={onClick}>
        View Activity Details &rarr;
      </button>
    </div>
  )
}

export default ActivityCard
