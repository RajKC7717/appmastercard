import { forwardRef } from 'react';
import { Check } from 'lucide-react';
import styles from './QuestionCard.module.css';

/**
 * The wrapper every question sits in. Numbered, so the volunteer can see
 * how far along they are without reading the progress rule, and marked with
 * a tick the moment it is answered.
 *
 * Answered cards stay open and stay editable — going back must never cost
 * someone their answers.
 */
const QuestionCard = forwardRef(function QuestionCard(
  { index, total, question, hint, answered, optional, children },
  ref,
) {
  return (
    <section
      ref={ref}
      className={`${styles.card} ${answered ? styles.answered : ''}`}
      aria-labelledby={`q-${index}`}
    >
      <header className={styles.head}>
        <span className={styles.number} aria-hidden="true">
          {answered ? <Check className={styles.check} /> : index}
        </span>
        <div className={styles.headText}>
          <h2 id={`q-${index}`} className={styles.question}>
            {question}
            {optional && <span className={styles.optional}>Optional</span>}
          </h2>
          <p className={styles.hint}>{hint}</p>
        </div>
        <span className={styles.step} aria-hidden="true">
          {index}/{total}
        </span>
      </header>

      <div className={styles.body}>{children}</div>
    </section>
  );
});

export default QuestionCard;
