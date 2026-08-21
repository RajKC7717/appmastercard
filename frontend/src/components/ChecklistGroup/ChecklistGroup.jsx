import { Square } from 'lucide-react'
import styles from './ChecklistGroup.module.css'

const phaseLabel = {
  before_event: 'Before the event',
  during_event: 'During the event',
  after_event: 'After the event',
}

const phaseOrder = ['before_event', 'during_event', 'after_event']

function ChecklistGroup({ items }) {
  const grouped = phaseOrder
    .map((phase) => ({ phase, tasks: items.filter((item) => item.phase === phase) }))
    .filter((group) => group.tasks.length > 0)

  return (
    <div className={styles.groups}>
      <div className={styles.stepper}>
        {grouped.map(({ phase, tasks }, i) => (
          <div key={phase} className={styles.step}>
            <div className={styles.stepDot}>{i + 1}</div>
            <span>
              {phaseLabel[phase] ?? phase} &middot; {tasks.length}
            </span>
          </div>
        ))}
      </div>

      {grouped.map(({ phase, tasks }) => (
        <div key={phase} className={styles.group}>
          <h4>{phaseLabel[phase] ?? phase}</h4>
          <ul>
            {tasks.map((task) => (
              <li key={task.task}>
                <Square size={16} className={styles.checkbox} />
                <div>
                  <p>{task.task}</p>
                  <span>
                    {task.responsibleRole} &bull; {task.deadline}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default ChecklistGroup
