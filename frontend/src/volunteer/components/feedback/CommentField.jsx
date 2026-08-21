import { Mic, Square } from 'lucide-react';
import { t, ui } from '../../data/questions.js';
import useSpeech from '../../lib/useSpeech.js';
import styles from './CommentField.module.css';

const MAX_LENGTH = 600;

/**
 * `feedback.overall_comment` — the one free-text answer, and the only
 * optional question on the form.
 *
 * Whatever is typed here is stored EXACTLY as written: the AI pipeline reads
 * this column to extract themes and sentiment, but nothing rewrites,
 * translates or truncates it. All derived text lives in feedback_insights.
 *
 * The microphone only renders where the browser actually supports speech
 * recognition — a dead button is worse than no button. It matters most in
 * Marathi and Hindi, where typing Devanagari on a phone is slow enough that
 * people simply skip the field.
 */
export default function CommentField({ value, onChange, lang }) {
  const speech = useSpeech(lang);
  const listening = speech.listeningFor === 'overallComment';

  const append = (transcript) => {
    const next = value ? `${value} ${transcript}` : transcript;
    onChange(next.slice(0, MAX_LENGTH));
  };

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor="overall-comment">
        {t(ui.commentLabel, lang)}
      </label>

      <div className={`${styles.wrap} ${listening ? styles.listening : ''}`}>
        <textarea
          id="overall-comment"
          className={styles.textarea}
          value={value}
          rows={4}
          maxLength={MAX_LENGTH}
          placeholder={t(ui.commentPlaceholder, lang)}
          onChange={(event) => onChange(event.target.value)}
        />

        {speech.supported && (
          <button
            type="button"
            className={`${styles.mic} ${listening ? styles.micOn : ''}`}
            onClick={() =>
              listening ? speech.stop() : speech.start('overallComment', append)
            }
          >
            {listening ? (
              <Square className={styles.micIcon} aria-hidden="true" />
            ) : (
              <Mic className={styles.micIcon} aria-hidden="true" />
            )}
            {listening ? t(ui.listening, lang) : t(ui.speak, lang)}
          </button>
        )}
      </div>

      <div className={styles.helper}>
        <span className={styles.helperText} role="status">
          {speech.error ?? (listening ? t(ui.listening, lang) : '')}
        </span>
        <span className={styles.counter}>
          {value.length}/{MAX_LENGTH}
        </span>
      </div>
    </div>
  );
}
