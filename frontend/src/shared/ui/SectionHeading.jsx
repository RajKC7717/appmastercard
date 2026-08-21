import styles from './SectionHeading.module.css';

/**
 * Title, one line of explanation, and at most one action. Every section on
 * every console screen opens the same way, so the eye learns the shape once.
 */
export default function SectionHeading({ title, subtitle, action, as: Tag = 'h2' }) {
  return (
    <div className={styles.heading}>
      <div>
        <Tag className={styles.title}>{title}</Tag>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
