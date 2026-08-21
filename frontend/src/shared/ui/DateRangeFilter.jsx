import { TextInput } from './Form.jsx';
import styles from '../console/console.module.css';

/**
 * The from/to date pair, with the one rule that matters enforced: the
 * start of a range can never be after its end.
 *
 * Three layers, because one is not enough:
 *
 *  1. `max` on the From field and `min` on the To field, so the native
 *     picker greys out the impossible days before anyone clicks one.
 *  2. If a date still arrives out of order — typed, pasted, or from an
 *     old bookmarked URL — the other end moves with it rather than the
 *     screen showing an empty list and no explanation. Silently returning
 *     zero rows for an impossible range is the worst of the options.
 *  3. A line under the fields saying what happened, so the correction is
 *     never a surprise.
 *
 * Used by every filtered screen in both consoles, so the behaviour cannot
 * differ between them.
 */
export default function DateRangeFilter({
  from,
  to,
  onChange,
  idPrefix,
  fromLabel = 'From',
  toLabel = 'To',
}) {
  const setFrom = (value) => {
    /* Pushing To forward keeps the range valid AND keeps the day the
       person just picked, which is the one thing they were sure about. */
    if (value && to && value > to) {
      onChange({ from: value, to: value });
      return;
    }
    onChange({ from: value });
  };

  const setTo = (value) => {
    if (value && from && value < from) {
      onChange({ from: value, to: value });
      return;
    }
    onChange({ to: value });
  };

  const corrected = Boolean(from && to && from === to);

  return (
    <>
      <div className={styles.filterField}>
        <label className={styles.filterLabel} htmlFor={`${idPrefix}-from`}>
          {fromLabel}
        </label>
        <TextInput
          id={`${idPrefix}-from`}
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => setFrom(event.target.value)}
        />
      </div>

      <div className={styles.filterField}>
        <label className={styles.filterLabel} htmlFor={`${idPrefix}-to`}>
          {toLabel}
        </label>
        <TextInput
          id={`${idPrefix}-to`}
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => setTo(event.target.value)}
        />
        {corrected && (
          <p className={styles.rangeNote} role="status">
            Showing a single day.
          </p>
        )}
      </div>
    </>
  );
}
