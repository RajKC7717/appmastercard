import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GROUPS,
  LOW_RATING_THRESHOLD,
  MANDATORY_THEMES,
  TOTAL_CARDS,
  themesInGroup,
} from '../data/questions.js';
import { loadDraft } from '../lib/storage.js';
import { savePartial } from '../lib/api.js';

const EMPTY_ANSWERS = {
  /** themeCode -> 1..5. One row of feedback_ratings each. */
  ratings: {},
  /** themeCode -> why this score was low. Only kept while the score is low. */
  themeComments: {},
  /** feedback.overall_comment — optional, stored verbatim. */
  overallComment: '',
};

/** A card is done when every rating in its group is answered. */
function isGroupComplete(group, answers) {
  if (group.kind === 'comment') return answers.overallComment.trim().length > 0;
  return themesInGroup(group.key).every(
    (theme) => answers.ratings[theme.themeCode] != null,
  );
}

/**
 * All the answer state for the feedback form.
 *
 * Four behaviours worth naming:
 *
 *  · Cards reveal as the one above is answered, and the reveal NEVER
 *    retracts. Changing an answer must not make a later card — and the
 *    answers already in it — disappear.
 *
 *  · Required ratings can be changed but not cleared (see RatingQuestion).
 *    Emptying a required field can only put the form back into an invalid
 *    state, so a second tap on the selected value is a no-op.
 *
 *  · A rating at or below the low threshold keeps a reason. Raise the score
 *    again and the reason is dropped, because it no longer describes
 *    anything — leaving it would ship a complaint attached to a 5.
 *
 *  · Every change is written to the draft. If the bus arrives and the tab
 *    closes after two taps, those two taps survive.
 */
export default function useFeedbackForm(activityId) {
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [restored, setRestored] = useState(false);
  const [highWater, setHighWater] = useState(1);
  const [invalidThemes, setInvalidThemes] = useState([]);

  const cardRefs = useRef([]);
  const themeRefs = useRef({});
  const lastScrolled = useRef(1);

  /* Restore a draft left behind by an interrupted attempt. */
  useEffect(() => {
    if (!activityId) return;
    const draft = loadDraft(activityId);
    if (draft?.answers) {
      setAnswers({ ...EMPTY_ANSWERS, ...draft.answers });
      setRestored(true);
    }
  }, [activityId]);

  const completion = useMemo(
    () => GROUPS.map((group) => isGroupComplete(group, answers)),
    [answers],
  );

  /* How many cards from the top are answered, without gaps. */
  const leading = useMemo(() => {
    let count = 0;
    while (count < TOTAL_CARDS && completion[count]) count += 1;
    return count;
  }, [completion]);

  /* A high-water mark: it only ever grows. Adjusted during render rather
     than in an effect, so a newly revealed card paints in the same pass as
     the answer that revealed it and never flashes in late. */
  const revealed = Math.max(highWater, Math.min(TOTAL_CARDS, leading + 1));
  if (revealed !== highWater) setHighWater(revealed);

  /* Bring a freshly revealed card into view — the whole point of "answer
     one, the next appears" is that you can see the next one. */
  useEffect(() => {
    if (revealed === lastScrolled.current) return undefined;
    lastScrolled.current = revealed;
    const node = cardRefs.current[revealed - 1];
    if (!node) return undefined;
    const timer = window.setTimeout(
      () => node.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      120,
    );
    return () => window.clearTimeout(timer);
  }, [revealed]);

  /* Progressive save — after every single change, not at submit. */
  useEffect(() => {
    if (!activityId || answers === EMPTY_ANSWERS) return;
    savePartial(activityId, answers);
  }, [activityId, answers]);

  const setRating = useCallback((themeCode, value) => {
    setAnswers((current) => {
      const themeComments = { ...current.themeComments };
      if (value > LOW_RATING_THRESHOLD) delete themeComments[themeCode];
      return {
        ...current,
        ratings: { ...current.ratings, [themeCode]: value },
        themeComments,
      };
    });
    /* Answering clears its own error immediately, without waiting for a
       second submit attempt. */
    setInvalidThemes((current) => current.filter((code) => code !== themeCode));
  }, []);

  const setThemeComment = useCallback((themeCode, text) => {
    setAnswers((current) => ({
      ...current,
      themeComments: { ...current.themeComments, [themeCode]: text },
    }));
  }, []);

  const setOverallComment = useCallback((text) => {
    setAnswers((current) => ({ ...current, overallComment: text }));
  }, []);

  const registerCard = useCallback(
    (index) => (node) => {
      cardRefs.current[index] = node;
    },
    [],
  );

  const registerTheme = useCallback(
    (themeCode) => (node) => {
      themeRefs.current[themeCode] = node;
    },
    [],
  );

  const missing = useMemo(
    () => MANDATORY_THEMES.filter((theme) => answers.ratings[theme.themeCode] == null),
    [answers.ratings],
  );

  /**
   * Run on submit. If anything required is unanswered, mark every one of
   * them, then take the volunteer to the first — scrolled into view and
   * focused, so the next tap answers it. Returns true when the form is
   * ready to send.
   */
  const validate = useCallback(() => {
    if (missing.length === 0) {
      setInvalidThemes([]);
      return true;
    }

    setInvalidThemes(missing.map((theme) => theme.themeCode));

    const node = themeRefs.current[missing[0].themeCode];
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      /* Focus after the scroll settles, or the browser fights the animation. */
      window.setTimeout(() => {
        node.querySelector('button[role="radio"]')?.focus({ preventScroll: true });
      }, 420);
    }
    return false;
  }, [missing]);

  return {
    answers,
    setRating,
    setThemeComment,
    setOverallComment,
    completion,
    completedCount: completion.filter(Boolean).length,
    revealed,
    missingCount: missing.length,
    isComplete: missing.length === 0,
    invalidThemes,
    validate,
    restored,
    dismissRestored: () => setRestored(false),
    registerCard,
    registerTheme,
    /* The phase name shown on the progress rule. */
    phase: GROUPS[Math.min(leading, TOTAL_CARDS - 1)].title,
  };
}
