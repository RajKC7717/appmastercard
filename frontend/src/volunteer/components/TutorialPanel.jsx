import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { loadTutorialSeen, saveTutorialSeen } from '../lib/storage.js';
import styles from './TutorialPanel.module.css';

/**
 * "How feedback works", behind an info icon.
 *
 * An inline panel rather than a modal: on a phone a modal traps focus and
 * hides the very cards it is describing, and this is explanatory text, not
 * a decision to make. It opens by itself the first time and stays shut once
 * dismissed — a tutorial that reappears every visit becomes noise.
 */
const STEPS = [
  {
    title: 'Attend an activity',
    body: 'The moment you do, it turns green on this page for the rest of the day.',
  },
  {
    title: 'Tap “Give feedback” on the card',
    body: 'Nothing to look up. The activity, date, venue and company are filled in already — you only answer for your own experience.',
  },
  {
    title: 'Answer five short groups',
    body: 'Impact, planning, communication, your role, and whether you would recommend it. Each group appears as you finish the one above it.',
  },
  {
    title: 'A low score asks one more thing',
    body: 'Rate anything 2 or below and a box opens asking what went wrong. That line goes straight to the coordinator.',
  },
  {
    title: 'The last question is optional',
    body: 'Add a comment in English, हिंदी or मराठी — type it or speak it — then submit. It takes about a minute.',
  },
  {
    title: 'You get a reference and an email',
    body: 'Keep the reference to follow up. Feedback closes at midnight on the day of the activity.',
  },
];

export default function TutorialPanel() {
  const [open, setOpen] = useState(() => !loadTutorialSeen());

  const dismiss = () => {
    setOpen(false);
    saveTutorialSeen();
  };

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls="tutorial-panel"
        onClick={() => (open ? dismiss() : setOpen(true))}
      >
        <Info className={styles.triggerIcon} aria-hidden="true" />
        How feedback works
      </button>

      {open && (
        <section id="tutorial-panel" className={styles.panel}>
          <header className={styles.head}>
            <h2 className={styles.title}>Giving feedback takes about a minute</h2>
            <button type="button" className={styles.close} onClick={dismiss}>
              <X className={styles.closeIcon} aria-hidden="true" />
              <span className="srOnly">Close the guide</span>
            </button>
          </header>

          <ol className={styles.steps}>
            {STEPS.map((step, index) => (
              <li key={step.title} className={styles.step}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepBody}>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <button type="button" className={styles.gotIt} onClick={dismiss}>
            Got it
          </button>
        </section>
      )}
    </div>
  );
}
