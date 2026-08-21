import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import AdminTopbar from '../components/AdminTopbar/AdminTopbar'
import SummaryCard from '../components/SummaryCard/SummaryCard'
import ActivityFilterBar from '../components/ActivityFilterBar/ActivityFilterBar'
import ActivityCard from '../components/ActivityCard/ActivityCard'
import Button from '../components/Button/Button'
import { activities, categories } from '../data/mockActivities'
import styles from './AdminDashboard.module.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('All Activities')

  const filteredActivities =
    selectedCategory === 'All Activities'
      ? activities
      : activities.filter((activity) => activity.category === selectedCategory)

  const summary = useMemo(() => {
    const totalVolunteers = activities.reduce((sum, a) => sum + a.volunteers, 0)
    const totalResponses = activities.reduce((sum, a) => sum + a.responses, 0)
    const avgRating = activities.reduce((sum, a) => sum + a.rating, 0) / activities.length

    return {
      activeActivities: activities.length,
      totalVolunteers,
      responseRate: Math.round((totalResponses / totalVolunteers) * 100),
      overallRating: avgRating.toFixed(1),
    }
  }, [])

  return (
    <>
      <AdminTopbar greeting="Good morning 👋" title="Activity Overview" />

      <section className={styles.summary}>
        <SummaryCard label="Active Activities" value={summary.activeActivities} />
        <SummaryCard label="Total Volunteers" value={summary.totalVolunteers} />
        <SummaryCard label="Feedback Response Rate" value={`${summary.responseRate}%`} />
        <SummaryCard label="Overall Experience" value={`${summary.overallRating}/5`} />
      </section>

      <section>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Activities</h2>
            <p>Review volunteer experience activity-wise</p>
          </div>
          <Button icon={Plus}>Create Activity</Button>
        </div>

        <ActivityFilterBar
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <div className={styles.grid}>
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onClick={() => navigate(`/admin/activities/${activity.id}`)}
            />
          ))}
        </div>
      </section>
    </>
  )
}

export default AdminDashboard
