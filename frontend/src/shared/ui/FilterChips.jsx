import styles from './FilterChips.module.css';

/**
 * A single row of pills — the one filter control in the consoles.
 *
 * Options are `string` or `{ value, label, count }`. The row scrolls
 * sideways rather than wrapping into a second line, so the height of the
 * page above the list never changes as filters are added.
 */
export default function FilterChips({ options = [], selected, onSelect, label }) {
  const normalised = options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option,
  );

  return (
    <div className={styles.row} role="group" aria-label={label}>
      {normalised.map(({ value, label: text, count }) => {
        const active = value === selected;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(value)}
            className={`${styles.chip} ${active ? styles.active : ''}`}
          >
            {text}
            {count != null && <span className={styles.count}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
