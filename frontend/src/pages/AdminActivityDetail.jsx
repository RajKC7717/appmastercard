import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Sparkles, Clock } from 'lucide-react'
import Button from '../components/Button/Button'
import FeedbackItem from '../components/FeedbackItem/FeedbackItem'
import FeedbackResponseCard from '../components/FeedbackResponseCard/FeedbackResponseCard'
import SectionRatings from '../components/SectionRatings/SectionRatings'
import { activities } from '../data/mockActivities'
import { actionPlans } from '../data/mockActionPlans'
import { categoryIcons, DefaultCategoryIcon } from '../data/categoryIcons'
import styles from './AdminActivityDetail.module.css'

function AdminActivityDetail() {
  const { activityId } = useParams()
  const navigate = useNavigate()
  const activity = activities.find((a) => String(a.id) === activityId)
  const plan = activity ? actionPlans[activity.id] : undefined
  const CategoryIcon = activity ? categoryIcons[activity.category] ?? DefaultCategoryIcon : null

  if (!activity) {
    return (
      <div className={styles.notFound}>
        <p>Activity not found.</p>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/admin')}>
          <ArrowLeft size={16} /> Back to Activities
        </button>
      </div>
    )
  }

  return (
    <>
      <button type="button" className={styles.backBtn} onClick={() => navigate('/admin')}>
        <ArrowLeft size={16} /> Back to Activities
      </button>

      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.categoryIcon}>
            <CategoryIcon size={22} />
          </div>
          <div>
            <p className={styles.category}>{activity.category}</p>
            <h1>{activity.title}</h1>
          </div>
        </div>
        <Button variant="secondary" icon={FileText}>
          Export Report
        </Button>
      </div>
      <p className={styles.meta}>
        {activity.date} &bull; {activity.partner}
      </p>

      <section className={styles.statsGrid}>
        <div>
          <span>Total Volunteers</span>
          <strong>{activity.volunteers}</strong>
        </div>
        <div>
          <span>Feedback Responses</span>
          <strong>{activity.responses}</strong>
        </div>
        <div>
          <span>Response Rate</span>
          <strong>{activity.responseRate}%</strong>
        </div>
        <div>
          <span>Experience Rating</span>
          <strong>&#9733; {activity.rating}/5</strong>
        </div>
      </section>

      <FeedbackResponseCard
        volunteers={activity.volunteers}
        responses={activity.responses}
        responseRate={activity.responseRate}
      />

      <SectionRatings sections={activity.sectionRatings} responses={activity.responses} />

      <section className={styles.insightCta}>
        {activity.feedbackStatus === 'open' ? (
          <>
            <Clock size={20} />
            <div>
              <strong>Feedback collection is still open</strong>
              <p>Closes {activity.feedbackDeadline}. The AI Action Plan will be generated automatically once it ends.</p>
            </div>
          </>
        ) : plan?.generationState === 'generated' ? (
          <>
            <Sparkles size={20} />
            <div>
              <strong>AI Action Plan is ready</strong>
              <p>Automatically generated from {plan.responseCount} feedback responses for this activity.</p>
            </div>
            <Button onClick={() => navigate(`/admin/insights/${activity.id}`)}>View Action Plan</Button>
          </>
        ) : (
          <>
            <Clock size={20} />
            <div>
              <strong>AI Action Plan is being generated</strong>
              <p>Feedback has closed — analysis is in progress and will appear in Insights automatically.</p>
            </div>
          </>
        )}
      </section>

      <section className={`${styles.card} ${styles.feedbackSection}`}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Recent Volunteer Feedback</h2>
            <p className={styles.muted}>Feedback collected for this activity</p>
          </div>
          <Button variant="secondary">Filter</Button>
        </div>

        {activity.recentFeedback.map((feedback) => (
          <FeedbackItem key={feedback.name} {...feedback} />
        ))}
      </section>
    </>
  )
}

export default AdminActivityDetail
