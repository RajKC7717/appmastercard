import { useState } from 'react';
import {
  Bus,
  Check,
  MessageCircle,
  Phone,
  Send,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import Badge from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import { needCategories } from '../data/demoData.js';
import { submitNeed } from '../lib/api.js';
import { formatShortDate, formatSubmittedAt } from '../lib/format.js';
import styles from './SpocNeeds.module.css';

const CATEGORY_ICON = { bus: Bus, tool: Wrench, shield: ShieldAlert };

/**
 * Raise a volunteering need with the company SPOC.
 *
 * This is the one place the SPOC appears, and it is the last section on the
 * home page on purpose: it is what you reach for when something is wrong,
 * not what you came here to do. Feedback is about an activity that has
 * finished; a need is about one that has not.
 *
 * The category ids are InsightTheme enum values (TRANSPORT, EQUIPMENT,
 * SAFETY), so a need and an AI-detected aspect from a written comment land
 * in the same reporting bucket on the admin side.
 *
 * The chips are optional and multi-select, so tapping a selected one clears
 * it — unlike the required ratings on the feedback form, which can be
 * changed but never emptied.
 */
export default function SpocNeeds({ spoc, activities, needs }) {
  const [selected, setSelected] = useState([]);
  const [activityId, setActivityId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(null);

  const openable = activities.filter((a) => a.status !== 'PAST');

  const toggle = (id) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    );

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data } = await submitNeed({ activityId, categories: selected, note });
      setSent(data);
      setSelected([]);
      setNote('');
      setActivityId('');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.section} aria-labelledby="needs-heading">
      <header className={styles.head}>
        <div>
          <h2 id="needs-heading" className={styles.heading}>
            Raise a need with your SPOC
          </h2>
          <p className={styles.caption}>
            Transport, materials or safety — anything you need sorted before the
            next activity. This goes to your company coordinator, not the NGO.
          </p>
        </div>
      </header>

      <div className={styles.spoc}>
        <span className={styles.avatar} aria-hidden="true">
          {spoc.initials}
        </span>
        <div className={styles.spocText}>
          <p className={styles.spocName}>{spoc.name}</p>
          <p className={styles.spocRole}>{spoc.title}</p>
          <p className={styles.spocNote}>{spoc.respondsWithin}</p>
        </div>
        <div className={styles.spocActions}>
          <Button href={`tel:+91${spoc.phone}`} variant="secondary" icon={Phone}>
            Call
          </Button>
          <Button
            href={`https://wa.me/91${spoc.phone}`}
            variant="secondary"
            icon={MessageCircle}
          >
            WhatsApp
          </Button>
        </div>
      </div>

      {sent ? (
        <div className={styles.sent} role="status">
          <Check className={styles.sentIcon} aria-hidden="true" />
          <div>
            <p className={styles.sentTitle}>
              Sent to {spoc.name.split(' ')[0]} · <strong>{sent.reference}</strong>
            </p>
            <p className={styles.sentBody}>
              {spoc.respondsWithin}. You can raise another need any time.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setSent(null)}>
            Raise another
          </Button>
        </div>
      ) : (
        <div className={styles.form}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>What do you need help with?</legend>
            <p className={styles.legendHint}>
              Choose any that apply — tap again to remove one.
            </p>
            <div className={styles.chips}>
              {needCategories.map((category) => {
                const Icon = CATEGORY_ICON[category.icon] ?? Wrench;
                const active = selected.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="checkbox"
                    aria-checked={active}
                    className={`${styles.chip} ${active ? styles.chipOn : ''}`}
                    onClick={() => toggle(category.id)}
                  >
                    <Icon className={styles.chipIcon} aria-hidden="true" />
                    <span className={styles.chipText}>
                      <span className={styles.chipTitle}>{category.title.EN}</span>
                      <span className={styles.chipHint}>{category.hint}</span>
                    </span>
                    {active && <Check className={styles.chipCheck} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="need-activity">
              Which activity is this about?
            </label>
            <select
              id="need-activity"
              className={styles.select}
              value={activityId}
              onChange={(event) => setActivityId(event.target.value)}
            >
              <option value="">Not about a specific activity</option>
              {openable.map((activity) => (
                <option key={activity.activityId} value={activity.activityId}>
                  {activity.name} — {formatShortDate(activity.date)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="need-note">
              Add a note <span className={styles.optional}>Optional</span>
            </label>
            <textarea
              id="need-note"
              className={styles.textarea}
              rows={3}
              maxLength={400}
              value={note}
              placeholder="Three of us come from Wagholi — could the bus add a stop there?"
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={Send}
            disabled={selected.length === 0 || busy}
            onClick={send}
          >
            {busy ? 'Sending…' : `Send to ${spoc.name.split(' ')[0]}`}
          </Button>

          <p className={styles.formHint} role={error ? 'alert' : undefined}>
            {error ?? (selected.length === 0 ? 'Choose at least one need to send.' : '')}
          </p>
        </div>
      )}

      {needs.length > 0 && (
        <div className={styles.history}>
          <h3 className={styles.historyTitle}>Raised earlier</h3>
          <ul className={styles.historyList}>
            {needs.map((need) => (
              <li key={need.reference} className={styles.need}>
                <div className={styles.needHead}>
                  <span className={styles.needRef}>{need.reference}</span>
                  <Badge tone={need.status === 'OPEN' ? 'open' : 'resolved'} />
                </div>
                <p className={styles.needCategories}>
                  {need.categories
                    .map((id) => needCategories.find((c) => c.id === id)?.title.EN ?? id)
                    .join(' · ')}
                </p>
                {need.note && <p className={styles.needNote}>{need.note}</p>}
                {need.response && (
                  <p className={styles.needResponse}>
                    <strong>{spoc.name.split(' ')[0]}:</strong> {need.response}
                  </p>
                )}
                <p className={styles.needTime}>{formatSubmittedAt(need.raisedAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
