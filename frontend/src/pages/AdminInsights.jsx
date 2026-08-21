import { useParams } from 'react-router-dom'
import { Sparkles, Clock, CalendarClock } from 'lucide-react'
import InsightsEventSwitcher from '../components/InsightsEventSwitcher/InsightsEventSwitcher'
import ScoreGauge from '../components/ScoreGauge/ScoreGauge'
import SummaryCard from '../components/SummaryCard/SummaryCard'
import ActionItemCard from '../components/ActionItemCard/ActionItemCard'
import ChecklistGroup from '../components/ChecklistGroup/ChecklistGroup'
import EmailDeliveryStatus from '../components/EmailDeliveryStatus/EmailDeliveryStatus'
import Badge from '../components/Badge/Badge'
import { activities } from '../data/mockActivities'
import { actionPlans } from '../data/mockActionPlans'
import styles from './AdminInsights.module.css'

const statusTone = {
  generated: 'neutral',
  upcoming: 'neutral',
  in_progress: 'should',
  completed: 'success',
  evaluating: 'neutral',
  improved: 'success',
  needs_reassessment: 'error',
}

const statusLabel = {
  generated: 'Generated',
  upcoming: 'Upcoming',
  in_progress: 'In Progress',
  completed: 'Completed',
  evaluating: 'Evaluating',
  improved: 'Improved',
  needs_reassessment: 'Needs Reassessment',
}

const buckets = [
  { key: 'must', label: 'Must Have' },
  { key: 'should', label: 'Should Have' },
]

function AdminInsights() {
  const { eventId } = useParams()
  const activity = activities.find((a) => String(a.id) === eventId)
  const plan = activity ? actionPlans[activity.id] : undefined

  if (!activity) {
    return (
      <div className={styles.empty}>
        <p>Event not found.</p>
      </div>
    )
  }

  return (
    <>
      <InsightsEventSwitcher activities={activities} />

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            <Sparkles size={14} /> AI Action Plan
          </p>
          <h1>{activity.title}</h1>
        </div>
        {plan?.generationState === 'generated' && (
          <Badge tone={statusTone[plan.status] ?? 'neutral'}>{statusLabel[plan.status] ?? plan.status}</Badge>
        )}
      </div>

      {activity.feedbackStatus === 'open' && (
        <div className={styles.stateCard}>
          <Clock size={18} />
          <p>Feedback closes {activity.feedbackDeadline}. Action Plan generates automatically after.</p>
        </div>
      )}

      {activity.feedbackStatus === 'closed' && !plan && (
        <div className={styles.stateCard}>
          <Clock size={18} />
          <p>Action Plan not yet available.</p>
        </div>
      )}

      {plan?.generationState === 'pending' && (
        <div className={styles.stateCard}>
          <Clock size={18} />
          <p>Analysing {plan.responseCount} responses&hellip;</p>
        </div>
      )}

      {plan?.generationState === 'insufficient_evidence' && (
        <div className={styles.stateCard}>
          <Clock size={18} />
          <p>Insufficient evidence to generate a plan.</p>
        </div>
      )}

      {plan?.generationState === 'failed' && (
        <div className={styles.stateCard}>
          <Clock size={18} />
          <p>Analysis failed — retrying automatically.</p>
        </div>
      )}

      {plan?.generationState === 'generated' && (
        <>
          {plan.emailDelivery && <EmailDeliveryStatus delivery={plan.emailDelivery} />}

          <div className={styles.overviewRow}>
            <ScoreGauge score={plan.overallExperience.score} />
            <div className={styles.countTiles}>
              <SummaryCard label="Must Have Actions" value={plan.actionPlan.filter((i) => i.bucket === 'must').length} />
              <SummaryCard label="Should Have Actions" value={plan.actionPlan.filter((i) => i.bucket === 'should').length} />
            </div>
          </div>

          <section>
            <h2 className={styles.sectionTitle}>Automated Action Plan</h2>
            {buckets.map(({ key, label }) => {
              const items = plan.actionPlan.filter((item) => item.bucket === key)
              if (items.length === 0) return null
              return (
                <div key={key} className={styles.bucketGroup}>
                  <h3 className={styles.bucketTitle}>{label}</h3>
                  <div className={styles.actionGrid}>
                    {items.map((item) => (
                      <ActionItemCard key={item.priority} item={item} />
                    ))}
                  </div>
                </div>
              )
            })}
          </section>

          {plan.nextEventChecklist.length > 0 && (
            <section className={styles.card}>
              <div className={styles.nextEventHeader}>
                <CalendarClock size={18} />
                <div>
                  <h2>Next Event Preparation</h2>
                  {plan.nextEvent && (
                    <p className={styles.muted}>
                      {plan.nextEvent.title} &bull; {plan.nextEvent.date}
                    </p>
                  )}
                </div>
              </div>
              <ChecklistGroup items={plan.nextEventChecklist} />
            </section>
          )}
        </>
      )}
    </>
  )
}

export default AdminInsights
