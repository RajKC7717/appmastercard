import { Building2, CalendarDays, Clock, Lock, MapPin } from 'lucide-react';
import { t, ui } from '../../data/questions.js';
import { formatDate, formatTimeRange } from '../../lib/format.js';
import styles from './FixedActivityField.module.css';

/**
 * The first field, and the only one the volunteer cannot change.
 *
 * Activity name, date, venue and corporate partner all come from the
 * attendance record, so "capture basic activity details" costs zero typing
 * and the feedback maps to the right activity automatically. It also acts
 * as the trust signal: you are in the right place, this is your activity.
 */
export default function FixedActivityField({ activity, lang }) {
  return (
    <section className={styles.field} aria-labelledby="fixed-label">
      <div className={styles.labelRow}>
        <span className={styles.label} id="fixed-label">
          {t(ui.youVolunteeredAt, lang)}
        </span>
        <span className={styles.locked}>
          <Lock className={styles.lockIcon} aria-hidden="true" />
          Fixed
        </span>
      </div>

      <div className={styles.box}>
        <h1 className={styles.name}>{activity.name}</h1>
        <dl className={styles.meta}>
          <div className={styles.metaRow}>
            <dt className="srOnly">Date</dt>
            <CalendarDays className={styles.icon} aria-hidden="true" />
            <dd>{formatDate(activity.date)}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt className="srOnly">Time</dt>
            <Clock className={styles.icon} aria-hidden="true" />
            <dd>{formatTimeRange(activity.startTime, activity.endTime)}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt className="srOnly">Venue</dt>
            <MapPin className={styles.icon} aria-hidden="true" />
            <dd>
              {activity.venue}, {activity.area}
            </dd>
          </div>
          <div className={styles.metaRow}>
            <dt className="srOnly">Corporate partner</dt>
            <Building2 className={styles.icon} aria-hidden="true" />
            <dd>{activity.corporatePartner}</dd>
          </div>
        </dl>
      </div>

      <p className={styles.note}>{t(ui.fixedNote, lang)}</p>
    </section>
  );
}
