import styles from './ActivityFilterBar.module.css'

function ActivityFilterBar({ categories, selected, onSelect }) {
  return (
    <div className={styles.filters}>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category)}
          className={`${styles.filter} ${selected === category ? styles.active : ''}`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}

export default ActivityFilterBar
