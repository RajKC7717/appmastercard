/* ============================================================
   THEME CLASSIFICATION — problem statement use case C.

   "Convert fragmented, multilingual and unstructured human feedback into
   evidence-backed decisions."

   This is the frontend's honest implementation of that: an aspect-based
   keyword classifier that reads one verbatim comment and writes rows
   shaped exactly like `feedback_insights`:

     detectedTheme     -> InsightTheme enum   (normalised — never free text)
     sentiment         -> Sentiment enum      (5-point)
     confidence        -> 0.000 .. 1.000
     evidenceText      -> the exact substring that justifies the row
     extractionMethod  -> HEURISTIC

   RULE 22 in the schema says the pipeline accepts its own AI output above
   AI_CONFIDENCE_THRESHOLD (0.75) and otherwise falls back to keyword
   heuristics. This IS that fallback, running in the browser. When the
   Python service in /ai starts returning real ABSA rows, this file is
   replaced by a fetch and every screen above it keeps working, because
   they consume the same row shape.

   The reason a controlled vocabulary matters, stated once: "started late",
   "the schedule slipped" and "we began an hour behind" are three ways of
   saying TIMELINE_PLANNING. Free-text tagging would make them three
   analytics buckets. The enum makes them one, which is the whole point of
   the exercise.
   ============================================================ */

/** Mirrors the InsightTheme enum. The first nine mirror the rating themes. */
export const INSIGHT_THEMES = {
  IMPACT: 'Impact',
  TIMELINE_PLANNING: 'Timeline planning',
  REQUIREMENTS_PLANNING: 'Requirements planning',
  FINANCIAL_PLANNING: 'Financial planning',
  PRE_EVENT_COMMUNICATION: 'Communication before the event',
  DAY_OF_COMMUNICATION: 'Communication on the day',
  SKILL_UTILIZATION: 'Use of volunteer skills',
  STAFF_SUPPORT: 'Staff support',
  PARTICIPATION_LIKELIHOOD: 'Likelihood to recommend',
  VENUE: 'Venue',
  TRANSPORT: 'Transport',
  FOOD: 'Food',
  SAFETY: 'Safety',
  FACILITATOR: 'Facilitator',
  EQUIPMENT: 'Materials and equipment',
  BENEFICIARY_INTERACTION: 'Beneficiary interaction',
  ACTIVITY_DIFFICULTY: 'Activity difficulty',
  WAITING_TIME: 'Waiting time',
  ACCESSIBILITY: 'Accessibility',
  OTHER: 'Other',
};

/** The nine that also exist as a rateable feedback_theme. */
export const MANDATORY_INSIGHT_THEMES = [
  'IMPACT',
  'TIMELINE_PLANNING',
  'REQUIREMENTS_PLANNING',
  'FINANCIAL_PLANNING',
  'PRE_EVENT_COMMUNICATION',
  'DAY_OF_COMMUNICATION',
  'SKILL_UTILIZATION',
  'STAFF_SUPPORT',
  'PARTICIPATION_LIKELIHOOD',
];

export const SENTIMENT_LABEL = {
  VERY_NEGATIVE: 'Very negative',
  NEGATIVE: 'Negative',
  NEUTRAL: 'Neutral',
  POSITIVE: 'Positive',
  VERY_POSITIVE: 'Very positive',
};

/** Sentiment values that an admin has to act on. */
export const NEGATIVE_SENTIMENTS = ['NEGATIVE', 'VERY_NEGATIVE'];

/* ---------- Aspect vocabulary ------------------------------------------
   English, Hindi and Marathi cues per aspect. Multilingual matching is
   what makes use case D more than a language toggle: a Marathi comment
   lands in the same analytics bucket as its English equivalent.

   A cue ending in `*` is a PREFIX ("confus*" catches confused, confusing,
   confusion). Everything else must match a whole word or phrase.

   That distinction is not fussiness. Matching cues as bare substrings
   quietly ruins the analytics: "tea" fires inside "team", so every
   comment praising the team gets filed under FOOD, and nobody notices
   because the theme counts still look plausible.
   ---------------------------------------------------------------------- */

const CUES = {
  TIMELINE_PLANNING: [
    'late', 'delay*', 'ran over', 'overran', 'schedule*', 'timing',
    'start time', 'end time', 'finished', 'punctual', 'on time', 'past the',
    'उशिरा', 'वेळ', 'वेळापत्रक', 'देर', 'समय',
  ],
  REQUIREMENTS_PLANNING: [
    'brief*', 'instruction*', 'roles', 'task', 'tasks',
    'planned', 'planning', 'prepared', 'preparation', 'organis*', 'organiz*',
    'नियोजन', 'तयारी', 'सूचना', 'योजना',
  ],
  FINANCIAL_PLANNING: [
    'budget*', 'cost', 'costs', 'expense*', 'funding', 'reimburse*', 'sponsor*',
    'अर्थसंकल्प', 'खर्च', 'बजट',
  ],
  PRE_EVENT_COMMUNICATION: [
    'beforehand', 'before the event', 'in advance', 'prior', 'email',
    'told us earlier', 'no information', 'details were sent', 'confirmation',
    'आधी', 'पूर्वी', 'पहले',
  ],
  DAY_OF_COMMUNICATION: [
    'on the day', 'on site', 'nobody told', 'no one told', 'announce*',
    'unclear', 'confus*', 'did not know where', 'communication', 'coordination',
    'जागेवर', 'सांगितले', 'बताया',
  ],
  STAFF_SUPPORT: [
    'staff', 'coordinator*', 'the team was', 'supportive', 'helpful',
    'responsive', 'rude', 'ignored', 'no one helped',
    'कर्मचारी', 'समन्वयक', 'मदत',
  ],
  SKILL_UTILIZATION: [
    'skill', 'skills', 'underused', 'under used', 'nothing to do', 'idle',
    'my experience', 'put to use', 'kept busy', 'कौशल्य', 'कौशल',
  ],
  IMPACT: [
    'impact*', 'meaningful', 'difference', 'worth it', 'purpose', 'rewarding',
    'community', 'families', 'beneficiar*', 'परिणाम', 'प्रभाव', 'अर्थपूर्ण',
  ],
  PARTICIPATION_LIKELIHOOD: [
    'again', 'recommend*', 'sign up', 'next time i', 'would join', 'will join',
    'पुन्हा', 'शिफारस',
  ],
  VENUE: [
    'venue', 'hall', 'grounds', 'space was', 'cramped', 'crowded', 'seating',
    'shade', 'जागा', 'सभागृह',
  ],
  TRANSPORT: [
    'bus', 'transport*', 'pickup', 'pick up', 'drop', 'cab', 'travel', 'commute',
    'parking', 'बस', 'वाहतूक', 'प्रवास',
  ],
  FOOD: [
    'food', 'lunch', 'snack', 'snacks', 'water', 'tea', 'breakfast', 'meal',
    'meals', 'refreshment*', 'जेवण', 'पाणी', 'नाश्ता', 'खाना',
  ],
  SAFETY: [
    'safety', 'safe', 'unsafe', 'first aid', 'injury', 'injured', 'hurt',
    'accident', 'सुरक्षा', 'सुरक्षित',
  ],
  EQUIPMENT: [
    'glove*', 'tools', 'material*', 'equipment', 'supplies', 'kit', 'kits',
    'ran out of', 'shortage', 'spade*', 'laptop*', 'साहित्य', 'उपकरण', 'सामग्री',
  ],
  BENEFICIARY_INTERACTION: [
    'student*', 'girls', 'kids', 'children', 'villager*', 'participants',
    'interact*', 'मुले', 'विद्यार्थी', 'बच्चे',
  ],
  ACTIVITY_DIFFICULTY: [
    'physically', 'tiring', 'exhausting', 'heavy', 'too easy', 'too hard',
    'strenuous', 'थकवा', 'कठीण',
  ],
  WAITING_TIME: [
    'waiting', 'waited', 'queue', 'standing around', 'idle for', 'no work for',
    'प्रतीक्षा', 'इंतजार',
  ],
  ACCESSIBILITY: [
    'wheelchair', 'accessible', 'accessibility', 'stairs', 'ramp', 'elderly',
    'सुलभ',
  ],
  FACILITATOR: [
    'trainer*', 'facilitator*', 'speaker', 'the teacher', 'instructor', 'शिक्षक',
  ],
};

/* ---------- Polarity vocabulary ---------------------------------------- */

const POSITIVE = [
  'good', 'great', 'excellent', 'well', 'clear', 'clearly', 'smooth', 'smoothly',
  'helpful', 'supportive', 'meaningful', 'wonderful', 'perfect', 'best',
  'enjoyed', 'loved', 'appreciate*', 'impressed', 'thank*', 'worth', 'rewarding',
  'on time', 'punctual', 'ready', 'organised', 'organized', 'prepared', 'quickly',
  'easy', 'friendly', 'warm', 'excited', 'eager',
  'चांगले', 'चांगला', 'उत्तम', 'छान', 'अच्छा', 'स्पष्ट',
];

const NEGATIVE = [
  'not', 'never', 'poor', 'bad', 'worst', 'late', 'delay*', 'unclear', 'confus*',
  'rushed', 'shortage', 'ran out', 'missing', 'lacking', 'waiting', 'waited',
  'cramped', 'crowded', 'rude', 'ignored', 'disappoint*', 'problem*', 'issue*',
  'difficult', 'unsafe', 'nobody', 'no one', 'could have', 'should have', 'wish',
  'chaotic', 'mismatch*', 'stuck', 'short',
  'वाईट', 'खराब', 'उशिरा', 'गोंधळ', 'देर', 'कमी', 'नाही', 'नहीं',
];

const INTENSIFIERS = ['very', 'extremely', 'really', 'completely', 'totally', 'खूप', 'बहुत'];

/* ---------- Matching ----------------------------------------------------
   Normalise a clause to space-separated words first: every character that
   is not a letter or a digit becomes a space. That makes "on-site" and
   "on site" the same thing, and it lets one matcher handle Latin and
   Devanagari alike — a `\b` word boundary in JavaScript is defined
   against [A-Za-z0-9_] and simply does not work for मराठी.
   ---------------------------------------------------------------------- */

/* \p{M} — combining marks — must be kept alongside letters and digits.
   Devanagari vowel signs are marks, not letters: strip them and वेळापत्रक
   becomes "व ळ प त र क", every Marathi cue stops matching, and the
   multilingual claim quietly becomes false while the code still runs. */
const normalise = (text) => ` ${text.toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ').trim()} `;

const matches = (padded, cue) =>
  cue.endsWith('*')
    ? padded.includes(` ${cue.slice(0, -1)}`)
    : padded.includes(` ${cue} `);

const countHits = (padded, cues) =>
  cues.reduce((total, cue) => (matches(padded, cue) ? total + 1 : total), 0);

/* ---------- Clause splitting -------------------------------------------
   Evidence has to be a real fragment of the volunteer's own words (RULE 20
   — the original comment is never modified), so the unit of classification
   is a clause, split on sentence enders AND on the contrastive conjunctions
   where a comment usually turns: "X was great, but Y was a mess" has to
   become two rows with opposite sentiment, not one averaged-out "mixed".
   The Marathi पण and the Hindi लेकिन do the same work as "but" and are
   split on for the same reason.
   ---------------------------------------------------------------------- */

const CONTRASTIVE = /(?:[.!?।]+\s+)|(?:\s+(?:but|however|although|though|whereas|पण|परंतु|मात्र|लेकिन|मगर|किंतु)\s+)|(?:\s*[;\n]\s*)/i;

function toClauses(comment) {
  return comment
    .split(CONTRASTIVE)
    .map((part) => part.trim())
    .filter((part) => part.length > 3);
}

function scoreSentiment(clause) {
  const text = normalise(clause);
  const positive = countHits(text, POSITIVE);
  const negative = countHits(text, NEGATIVE);
  const intensified = countHits(text, INTENSIFIERS) > 0;

  /* "not clear", "never on time" — a negator directly ahead of a positive
     word flips it, which a bag of words alone gets backwards. */
  const negated =
    /\b(not|never|hardly|no)\b[^.!?]{0,18}\b(good|great|clear|helpful|well|ready|easy)\b/.test(
      text,
    );

  let score = positive - negative - (negated ? 2 : 0);
  if (intensified) score *= 1.5;

  if (score >= 2) return { sentiment: 'VERY_POSITIVE', score: 0.85 };
  if (score > 0) return { sentiment: 'POSITIVE', score: 0.45 };
  if (score <= -2) return { sentiment: 'VERY_NEGATIVE', score: -0.85 };
  if (score < 0) return { sentiment: 'NEGATIVE', score: -0.45 };
  return { sentiment: 'NEUTRAL', score: 0 };
}

/** Trim a clause to something an admin can read in a table cell. */
function toEvidence(clause) {
  const clean = clause.replace(/\s+/g, ' ').trim().replace(/[,;]$/, '');
  return clean.length <= 120 ? clean : `${clean.slice(0, 117)}…`;
}

/**
 * Classify one verbatim comment into feedback_insights rows.
 *
 * Returns [] for an empty comment — a feedback with no free text simply has
 * no insights, which is a normal state, not an error.
 */
export function classifyComment(comment, { feedbackId = null } = {}) {
  if (!comment || !comment.trim()) return [];

  const rows = [];
  const seen = new Set();

  toClauses(comment).forEach((clause) => {
    const text = normalise(clause);
    const { sentiment, score } = scoreSentiment(clause);

    /* Every aspect the clause mentions gets its own row — one comment
       yielding four rows is the point, not a bug. */
    const matched = Object.entries(CUES)
      .map(([theme, cues]) => ({ theme, hits: countHits(text, cues) }))
      .filter(({ hits }) => hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 3);

    const aspects = matched.length ? matched : [{ theme: 'OTHER', hits: 0 }];

    aspects.forEach(({ theme, hits }) => {
      const key = `${theme}:${sentiment}`;
      if (seen.has(key)) return;
      seen.add(key);

      /* Confidence rises with how many cues fired and how decisive the
         polarity was, and is capped below the 0.75 AI threshold band so a
         heuristic row never masquerades as a model-grade one. */
      const confidence = Math.min(
        0.74,
        Math.round((0.38 + hits * 0.12 + Math.abs(score) * 0.2) * 1000) / 1000,
      );

      rows.push({
        insightId: `INS-${feedbackId ?? 'X'}-${rows.length + 1}`,
        feedbackId,
        detectedTheme: theme,
        themeId: MANDATORY_INSIGHT_THEMES.includes(theme) ? theme : null,
        sentiment,
        sentimentScore: score,
        confidence,
        evidenceText: toEvidence(clause),
        extractionMethod: 'HEURISTIC',
        modelName: null,
        modelVersion: null,
      });
    });
  });

  return rows;
}

/**
 * Roll insights up into "recurring themes" — the thing the Foundation says
 * it cannot do today. Sorted by negative volume, because a theme fifteen
 * people complained about outranks one thirty people praised when you are
 * deciding what to fix next.
 */
export function summariseThemes(insights) {
  const buckets = new Map();

  insights.forEach((insight) => {
    const current = buckets.get(insight.detectedTheme) ?? {
      theme: insight.detectedTheme,
      label: INSIGHT_THEMES[insight.detectedTheme] ?? insight.detectedTheme,
      total: 0,
      negative: 0,
      positive: 0,
      neutral: 0,
      evidence: [],
    };

    current.total += 1;
    if (NEGATIVE_SENTIMENTS.includes(insight.sentiment)) {
      current.negative += 1;
      if (current.evidence.length < 4) current.evidence.push(insight);
    } else if (insight.sentiment === 'NEUTRAL') {
      current.neutral += 1;
    } else {
      current.positive += 1;
    }

    buckets.set(insight.detectedTheme, current);
  });

  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      negativeShare: bucket.total ? Math.round((bucket.negative / bucket.total) * 100) : 0,
    }))
    .sort((a, b) => b.negative - a.negative || b.total - a.total);
}

/** Themes urgent enough to surface on a dashboard: 3+ negatives, mostly negative. */
export function urgentThemes(summary, { minimum = 3 } = {}) {
  return summary.filter((row) => row.negative >= minimum && row.negativeShare >= 50);
}
