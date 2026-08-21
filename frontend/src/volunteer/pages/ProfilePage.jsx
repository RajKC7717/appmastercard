import { useState } from 'react';
import {
  Award,
  Building2,
  Clock3,
  Languages,
  LogOut,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
} from 'lucide-react';
import Button from '../../shared/ui/Button.jsx';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { Skeleton } from '../../shared/ui/States.jsx';
import { useVolunteer } from '../state/VolunteerProvider.jsx';
import { LANGUAGES } from '../data/questions.js';
import { loadLanguage, resetDemoState, saveLanguage } from '../lib/storage.js';
import { formatDate } from '../lib/format.js';
import { volunteer as fallbackVolunteer } from '../data/demoData.js';
import styles from './ProfilePage.module.css';

/**
 * Read-only by design. Volunteer records are maintained by the coordinator
 * against the attendance register — letting a volunteer edit their own
 * corporate partner or phone here would break the dedupe key the backend
 * relies on. The one thing they DO control is language.
 */
export default function ProfilePage() {
  const { signOut } = useAuth();
  const { volunteer, status, feedback, activities, reload } = useVolunteer();
  const [language, setLanguage] = useState(() => loadLanguage('EN'));
  const [resetDone, setResetDone] = useState(false);

  const person = volunteer ?? fallbackVolunteer;
  const loading = status === 'loading';
  /* Every activity actually attended, including ones with no feedback —
     the Past list hides those, but they still happened. */
  const attended = activities.filter((a) => a.attended).length;

  const chooseLanguage = (code) => {
    setLanguage(code);
    saveLanguage(code);
  };

  const resetDemo = () => {
    resetDemoState(activities.map((a) => a.activityId));
    setResetDone(true);
    reload();
    window.setTimeout(() => setResetDone(false), 4000);
  };

  return (
    <div className={styles.page}>
      <header className={styles.identity}>
        <span className={styles.avatar} aria-hidden="true">
          {person.initials}
        </span>
        <div>
          <h1 className={styles.name}>{person.volunteerName}</h1>
          <p className={styles.role}>
            Volunteer · {person.corporatePartner} · Since {formatDate(person.joinedOn)}
          </p>
          <p className={styles.reference}>{person.volunteerId}</p>
        </div>
      </header>

      <section className={styles.stats} aria-label="Your contribution">
        <div className={styles.stat}>
          <Award className={styles.statIcon} aria-hidden="true" />
          <span className={styles.statValue}>
            {loading ? <Skeleton height={26} width={32} /> : attended}
          </span>
          <span className={styles.statLabel}>Activities attended</span>
        </div>
        <div className={styles.stat}>
          <Clock3 className={styles.statIcon} aria-hidden="true" />
          <span className={styles.statValue}>{person.hoursVolunteered}</span>
          <span className={styles.statLabel}>Hours volunteered</span>
        </div>
        <div className={styles.stat}>
          <Building2 className={styles.statIcon} aria-hidden="true" />
          <span className={styles.statValue}>
            {loading ? <Skeleton height={26} width={32} /> : feedback.length}
          </span>
          <span className={styles.statLabel}>Feedbacks given</span>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="contact-heading">
        <h2 id="contact-heading" className={styles.cardTitle}>
          Your details
        </h2>
        <p className={styles.cardCaption}>
          These come from the attendance register. Ask your coordinator to change
          anything that is wrong.
        </p>
        <dl className={styles.details}>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>
              <Phone className={styles.detailIcon} aria-hidden="true" />
              Mobile number
            </dt>
            <dd className={styles.detailValue}>{person.volunteerPhone}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>
              <Mail className={styles.detailIcon} aria-hidden="true" />
              Email
            </dt>
            <dd className={styles.detailValue}>{person.volunteerEmail}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>
              <MapPin className={styles.detailIcon} aria-hidden="true" />
              Area
            </dt>
            <dd className={styles.detailValue}>{person.area}, Pune</dd>
          </div>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>
              <Building2 className={styles.detailIcon} aria-hidden="true" />
              Corporate partner
            </dt>
            <dd className={styles.detailValue}>{person.corporatePartner}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.card} aria-labelledby="language-heading">
        <h2 id="language-heading" className={styles.cardTitle}>
          <Languages className={styles.cardIcon} aria-hidden="true" />
          Feedback language
        </h2>
        <p className={styles.cardCaption}>
          The feedback form opens in this language. You can still switch on the
          form itself.
        </p>
        <div className={styles.languages} role="radiogroup" aria-labelledby="language-heading">
          {LANGUAGES.map(({ code, name }) => (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={language === code}
              className={`${styles.language} ${language === code ? styles.languageActive : ''}`}
              onClick={() => chooseLanguage(code)}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      {/* Signing out lives here rather than in the navbar. The navbar has
          four destinations and a fifth control on it would compete with
          them; this is the one screen that is about the person. */}
      <section className={styles.card} aria-labelledby="session-heading">
        <h2 id="session-heading" className={styles.cardTitle}>
          Your session
        </h2>
        <p className={styles.cardCaption}>
          Signed in as {person.volunteerEmail}. Signing out keeps everything you have already
          submitted — it is stored against your activity, not against this device.
        </p>
        <Button variant="secondary" icon={LogOut} onClick={signOut}>
          Sign out
        </Button>
      </section>

      <section className={styles.demoCard} aria-labelledby="demo-heading">
        <h2 id="demo-heading" className={styles.cardTitle}>
          Demo controls
        </h2>
        <p className={styles.cardCaption}>
          This build runs on sample data held in your browser. Resetting clears
          every feedback you submitted here so you can walk the flow again.
        </p>
        <div className={styles.demoActions}>
          <Button variant="secondary" icon={RotateCcw} onClick={resetDemo}>
            Reset demo data
          </Button>
          <span className={styles.resetNote} role="status">
            {resetDone ? 'Cleared. Every activity is open for feedback again.' : ''}
          </span>
        </div>
      </section>
    </div>
  );
}
