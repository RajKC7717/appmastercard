import { AlertCircle } from 'lucide-react';
import { FACES, LOW_RATING_THRESHOLD, SCALES, t, ui } from '../../data/questions.js';
import styles from './Inputs.module.css';

const VALUES = [1, 2, 3, 4, 5];

/** The red * beside a required question. Never colour alone — it has a label. */
export function Required() {
  return (
    <span className={styles.required}>
      <span aria-hidden="true">*</span>
      <span className="srOnly">Required</span>
    </span>
  );
}

/**
 * One rating question — one row of `feedback_ratings`.
 *
 * Three renderings of the same 1..5 value:
 *   faces      — the opener. A face reads the same in every language.
 *   scale      — numbered 1..5 with the theme's own end labels.
 *   likelihood — full labels, because "Very unlikely" is not a number.
 *
 * Two behaviours worth naming:
 *
 *  · A rating at or below LOW_RATING_THRESHOLD opens a "what went wrong?"
 *    box. Asking at the moment of the low score gets a specific answer;
 *    asking at the end of the form gets "it was fine".
 *
 *  · A required rating cannot be cleared. Tapping the selected value again
 *    keeps it, because emptying a required field can only ever put the form
 *    back into an invalid state. Optional inputs elsewhere DO clear on a
 *    second tap.
 */
export function RatingQuestion({
  theme,
  lang,
  value,
  onChange,
  reason,
  onReasonChange,
  variant = 'scale',
  invalid = false,
  fieldRef,
}) {
  const labels = SCALES[theme.scale][lang] ?? SCALES[theme.scale].EN;
  const id = `theme-${theme.themeCode}`;
  const isLow = value != null && value <= LOW_RATING_THRESHOLD;

  const select = (next) => {
    /* Required, so a second tap on the same value is a no-op, not a clear. */
    if (next === value) return;
    onChange(next);
  };

  return (
    <div
      ref={fieldRef}
      className={`${styles.question} ${invalid ? styles.questionInvalid : ''}`}
      data-theme-code={theme.themeCode}
    >
      <p className={styles.questionLabel} id={id}>
        {t(theme.question, lang)}
        {theme.isMandatory && <Required />}
      </p>

      {variant === 'faces' && (
        <div className={styles.faces} role="radiogroup" aria-labelledby={id}>
          {VALUES.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              className={`${styles.face} ${value === n ? styles.faceOn : ''}`}
              onClick={() => select(n)}
            >
              <span className={styles.faceEmoji} aria-hidden="true">
                {FACES[n - 1]}
              </span>
              <span className={styles.faceLabel}>{labels[n - 1]}</span>
            </button>
          ))}
        </div>
      )}

      {variant === 'scale' && (
        <>
          <div className={styles.scale} role="radiogroup" aria-labelledby={id}>
            {VALUES.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value === n}
                aria-label={`${n} — ${labels[n - 1]}`}
                className={`${styles.scaleButton} ${value === n ? styles.scaleOn : ''}`}
                onClick={() => select(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <div className={styles.anchors} aria-hidden="true">
            <span>{labels[0]}</span>
            <span>{labels[4]}</span>
          </div>
        </>
      )}

      {variant === 'likelihood' && (
        <div className={styles.likelihood} role="radiogroup" aria-labelledby={id}>
          {VALUES.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              className={`${styles.likely} ${value === n ? styles.likelyOn : ''}`}
              onClick={() => select(n)}
            >
              <span className={styles.likelyNumber} aria-hidden="true">
                {n}
              </span>
              {labels[n - 1]}
            </button>
          ))}
        </div>
      )}

      {/* Reserved line — an error appearing must not shift the question below. */}
      <p className={styles.error} role={invalid ? 'alert' : undefined}>
        {invalid && (
          <>
            <AlertCircle className={styles.errorIcon} aria-hidden="true" />
            {t(ui.missingAnswer, lang)}
          </>
        )}
      </p>

      {isLow && (
        <div className={styles.followUp}>
          <label className={styles.followUpLabel} htmlFor={`${id}-reason`}>
            {t(ui.lowRatingLabel, lang)}
          </label>
          <p className={styles.followUpHint}>{t(ui.lowRatingHint, lang)}</p>
          <textarea
            id={`${id}-reason`}
            className={styles.followUpInput}
            rows={2}
            maxLength={300}
            value={reason ?? ''}
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </div>
      )}
    </div>
  );
}
