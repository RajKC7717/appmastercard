import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CalendarX, CheckCircle2, Link2Off, Send } from 'lucide-react';
import Logo from '../../shared/ui/Logo.jsx';
import Button from '../../shared/ui/Button.jsx';
import { EmptyState, Skeleton } from '../../shared/ui/States.jsx';
import ProgressRule from '../components/feedback/ProgressRule.jsx';
import QuestionCard from '../components/feedback/QuestionCard.jsx';
import FixedActivityField from '../components/feedback/FixedActivityField.jsx';
import SuccessDialog from '../components/feedback/SuccessDialog.jsx';
import CommentField from '../components/feedback/CommentField.jsx';
import { RatingQuestion, Required } from '../components/feedback/Inputs.jsx';
import {
  GROUPS,
  LANGUAGES,
  MANDATORY_THEMES,
  TOTAL_CARDS,
  t,
  themesInGroup,
  ui,
} from '../data/questions.js';
import { getFeedbackForm, submitFeedback } from '../lib/api.js';
import { loadLanguage, saveLanguage } from '../lib/storage.js';
import { useVolunteer } from '../state/VolunteerProvider.jsx';
import useFeedbackForm from '../state/useFeedbackForm.js';
import { volunteer as fallbackVolunteer } from '../data/demoData.js';
import styles from './FeedbackPage.module.css';

/** Which input a group renders. */
const VARIANT = { faces: 'faces', likelihood: 'likelihood', scales: 'scale' };

/**
 * The feedback flow. Deliberately outside the portal shell: no navbar, no
 * tabs, nothing competing with the one job on this screen.
 *
 * One fixed field, then six cards — five groups of rating questions drawn
 * straight from `feedback_themes`, and one optional comment — each appearing
 * as the one above it is answered.
 */
export default function FeedbackPage() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { volunteer, reload } = useVolunteer();
  const person = volunteer ?? fallbackVolunteer;

  const [load, setLoad] = useState({ status: 'loading', activity: null, error: null });
  const [lang, setLang] = useState(() => loadLanguage('EN'));
  const [submitState, setSubmitState] = useState({ busy: false, error: null, blocked: false });
  const [success, setSuccess] = useState(null);

  const form = useFeedbackForm(activityId);

  const fetchForm = useCallback(async () => {
    setLoad({ status: 'loading', activity: null, error: null });
    try {
      const { data } = await getFeedbackForm(activityId);
      setLoad({ status: 'ready', activity: data, error: null });
    } catch (error) {
      setLoad({
        status: error.code === 'NOT_FOUND' ? 'invalid' : 'error',
        activity: null,
        error: error.message,
      });
    }
  }, [activityId]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  /* The document language matters to screen readers, so keep it honest. */
  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase();
    return () => {
      document.documentElement.lang = 'en';
    };
  }, [lang]);

  const chooseLanguage = (code) => {
    setLang(code);
    saveLanguage(code);
  };

  const goHome = () => navigate('/volunteer');

  const onSubmit = async () => {
    /* Never a silently disabled button. Pressing submit with something
       unanswered takes you to it rather than doing nothing. */
    if (!form.validate()) {
      setSubmitState({ busy: false, error: null, blocked: true });
      return;
    }

    setSubmitState({ busy: true, error: null, blocked: false });
    try {
      const { data } = await submitFeedback({
        activityId,
        language: lang,
        /* One feedback_ratings row per theme, source EXPLICIT. */
        ratings: form.answers.ratings,
        /* The reason given for each low score. */
        themeComments: form.answers.themeComments,
        /* feedback.overall_comment — stored exactly as typed. */
        overallComment: form.answers.overallComment.trim(),
        volunteerId: person.volunteerId,
        volunteerName: person.volunteerName,
        volunteerEmail: person.volunteerEmail,
        volunteerPhone: person.volunteerPhone,
        corporatePartner: person.corporatePartner,
        source: 'PORTAL',
      });
      setSubmitState({ busy: false, error: null, blocked: false });
      setSuccess({ reference: data.reference, confirmationEmail: data.confirmationEmail });
      reload();
    } catch (error) {
      if (error.code === 'DUPLICATE') {
        setLoad((current) => ({
          ...current,
          activity: {
            ...current.activity,
            alreadySubmitted: true,
            reference: error.data.reference,
          },
        }));
        setSubmitState({ busy: false, error: null, blocked: false });
        return;
      }
      /* Answers are untouched. Retry re-sends the same payload. */
      setSubmitState({ busy: false, error: error.message, blocked: false });
    }
  };

  /* ---- Shell ---------------------------------------------------------- */

  const topbar = (
    <header className={styles.topbar}>
      <button type="button" className={styles.back} onClick={goHome}>
        <ArrowLeft className={styles.backIcon} aria-hidden="true" />
        {t(ui.back, lang)}
      </button>
      <Logo showWordmark={false} />
      <div className={styles.languages} role="group" aria-label="Language">
        {LANGUAGES.map(({ code, label, name }) => (
          <button
            key={code}
            type="button"
            aria-pressed={lang === code}
            className={`${styles.language} ${lang === code ? styles.languageActive : ''}`}
            onClick={() => chooseLanguage(code)}
          >
            <span aria-hidden="true">{label}</span>
            <span className="srOnly">{name}</span>
          </button>
        ))}
      </div>
    </header>
  );

  const shell = (children) => (
    <div className={styles.page}>
      {topbar}
      <div className={styles.content}>{children}</div>
    </div>
  );

  if (load.status === 'loading') {
    return shell(
      <div className={styles.loading}>
        <Skeleton height={20} width="40%" />
        <Skeleton height={150} width="100%" radius="md" />
        <Skeleton height={220} width="100%" radius="md" />
      </div>,
    );
  }

  if (load.status === 'invalid') {
    return shell(
      <EmptyState
        icon={Link2Off}
        title="This feedback link is not valid"
        message="Ask your coordinator for a new link, or open the activity from your home page."
        action={<Button onClick={goHome}>Go to home</Button>}
      />,
    );
  }

  if (load.status === 'error') {
    return shell(
      <EmptyState
        icon={AlertTriangle}
        title={load.error}
        message="Check your connection and try again. Nothing you entered has been lost."
        action={<Button onClick={fetchForm}>Try again</Button>}
      />,
    );
  }

  const { activity } = load;

  /* Friendly, not an error — they did the right thing, just twice. */
  if (activity.alreadySubmitted && !success) {
    return shell(
      <EmptyState
        icon={CheckCircle2}
        title="You have already shared feedback for this activity"
        message={`Thank you — it is recorded under ${activity.reference}. You can read it back any time in your History tab.`}
        action={
          <div className={styles.dualAction}>
            <Button to="/volunteer/history">See what you said</Button>
            <Button variant="secondary" onClick={goHome}>
              Go to home
            </Button>
          </div>
        }
      />,
    );
  }

  if (!activity.isOpen) {
    return shell(
      <EmptyState
        icon={CalendarX}
        title="Feedback for this activity has closed"
        message="Feedback stays open until midnight on the day of the activity, while it is still fresh."
        action={<Button onClick={goHome}>Go to home</Button>}
      />,
    );
  }

  /* ---- The form ------------------------------------------------------- */

  return (
    <div className={styles.page}>
      {topbar}

      <div className={styles.progress}>
        <ProgressRule
          completed={form.completedCount}
          total={TOTAL_CARDS}
          phase={t(form.phase, lang)}
        />
      </div>

      <div className={styles.content}>
        {form.restored && (
          <p className={styles.restored} role="status">
            We kept what you had already answered.
            <button type="button" className={styles.restoredDismiss} onClick={form.dismissRestored}>
              Got it
            </button>
          </p>
        )}

        <FixedActivityField activity={activity} lang={lang} />

        {/* The rule for the whole form, stated once, before anything is asked. */}
        <p className={styles.legend}>
          <Required />
          {t(ui.requiredLegend, lang)} — {MANDATORY_THEMES.length} in total. You can
          change an answer, but not clear it.
        </p>

        <form className={styles.cards} onSubmit={(event) => event.preventDefault()}>
          {GROUPS.map((group, index) => {
            if (form.revealed < index + 1) return null;
            const isComment = group.kind === 'comment';

            return (
              <QuestionCard
                key={group.key}
                ref={form.registerCard(index)}
                index={index + 1}
                total={TOTAL_CARDS}
                question={t(group.title, lang)}
                hint={t(group.hint, lang)}
                answered={form.completion[index]}
                optional={isComment}
              >
                {isComment ? (
                  <CommentField
                    value={form.answers.overallComment}
                    onChange={form.setOverallComment}
                    lang={lang}
                  />
                ) : (
                  themesInGroup(group.key).map((theme) => (
                    <RatingQuestion
                      key={theme.themeCode}
                      theme={theme}
                      lang={lang}
                      variant={VARIANT[group.kind]}
                      value={form.answers.ratings[theme.themeCode] ?? null}
                      onChange={(value) => form.setRating(theme.themeCode, value)}
                      reason={form.answers.themeComments[theme.themeCode]}
                      onReasonChange={(text) => form.setThemeComment(theme.themeCode, text)}
                      invalid={form.invalidThemes.includes(theme.themeCode)}
                      fieldRef={form.registerTheme(theme.themeCode)}
                    />
                  ))
                )}
              </QuestionCard>
            );
          })}
        </form>
      </div>

      {/* Primary action in the thumb zone, pinned so it is always reachable. */}
      <div className={styles.actionBar}>
        <div className={styles.actionInner}>
          {submitState.error && (
            <p className={styles.submitError} role="alert">
              {submitState.error} Your answers are still here — try again.
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={Send}
            disabled={submitState.busy}
            onClick={onSubmit}
          >
            {submitState.busy ? t(ui.submitting, lang) : t(ui.submit, lang)}
          </Button>
          <p
            className={`${styles.actionHint} ${submitState.blocked ? styles.actionHintAlert : ''}`}
            role={submitState.blocked ? 'alert' : 'status'}
          >
            {submitState.blocked
              ? t(ui.jumpedToMissing, lang)
              : form.isComplete
                ? t(ui.allAnswered, lang)
                : `${form.missingCount} ${t(ui.requiredCount, lang)}`}
          </p>
        </div>
      </div>

      {success && (
        <SuccessDialog
          reference={success.reference}
          activity={activity}
          confirmationEmail={success.confirmationEmail}
          onClose={goHome}
        />
      )}
    </div>
  );
}
