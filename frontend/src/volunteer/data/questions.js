/* ============================================================
   THE FEEDBACK FORM — driven by the database schema.

   Every rating question here is one row of `feedback_themes`. The nine
   mandatory themes, their `themeCode`, their exact `question` text and their
   `displayOrder` all come straight from the Prisma schema, so the form and
   the database cannot drift apart.

     themeCode          -> feedback_themes.theme_code   (stable machine key)
     question           -> feedback_themes.question
     scaleLabels        -> feedback_themes.scale_labels (JSONB)
     isMandatory        -> feedback_themes.is_mandatory
     displayOrder       -> feedback_themes.display_order
     rating 1..5        -> feedback_ratings.rating      (CHECK 1..5)
     overallComment     -> feedback.overall_comment     (stored verbatim)
     language           -> feedback.language            (EN | MR | HI)

   THE GROUPING is the analytics layer. Each theme belongs to exactly one
   topic group, so "how is our communication doing across all events?" is a
   GROUP BY over three themes rather than a hand-maintained list. The group
   keys mirror the InsightTheme families the AI pipeline classifies into.
   ============================================================ */

/** Matches the FeedbackLanguage enum: EN | MR | HI. */
export const LANGUAGES = [
  { code: 'EN', label: 'EN', name: 'English' },
  { code: 'HI', label: 'हिं', name: 'हिंदी' },
  { code: 'MR', label: 'मरा', name: 'मराठी' },
];

/** Pick the string for the active language, falling back to English. */
export const t = (node, lang) => (node ? node[lang] || node.EN : '');

/* ---------- Scale labels ------------------------------------------------
   Two sets, not nine. PARTICIPATION_LIKELIHOOD is a behavioural-intention
   question, so its scale runs Very unlikely..Very likely rather than
   Very poor..Excellent — which is exactly why the schema stores
   scale_labels per theme instead of hardcoding one scale in the UI.
   ---------------------------------------------------------------------- */

export const SCALES = {
  QUALITY: {
    EN: ['Very poor', 'Poor', 'Okay', 'Good', 'Excellent'],
    HI: ['बहुत खराब', 'खराब', 'ठीक', 'अच्छा', 'उत्कृष्ट'],
    MR: ['खूप वाईट', 'वाईट', 'ठीक', 'चांगले', 'उत्कृष्ट'],
  },
  LIKELIHOOD: {
    EN: ['Very unlikely', 'Unlikely', 'Not sure', 'Likely', 'Very likely'],
    HI: ['बहुत कम संभावना', 'कम संभावना', 'पक्का नहीं', 'संभावना है', 'बहुत संभावना'],
    MR: ['फार कमी शक्यता', 'कमी शक्यता', 'खात्री नाही', 'शक्यता आहे', 'खूप शक्यता'],
  },
};

/** Faces read the same in every language and at every literacy level. */
export const FACES = ['😞', '😐', '🙂', '😃', '🤩'];

/** Any rating at or below this opens a "what went wrong?" box. */
export const LOW_RATING_THRESHOLD = 2;

/* ---------- The nine mandatory themes ---------------------------------- */

export const THEMES = [
  {
    themeCode: 'IMPACT',
    displayOrder: 1,
    isMandatory: true,
    group: 'impact',
    scale: 'QUALITY',
    themeName: { EN: 'Impact', HI: 'प्रभाव', MR: 'परिणाम' },
    question: {
      EN: 'How meaningful was the impact of this event on the community you served?',
      HI: 'आपने जिस समुदाय की सेवा की, उस पर इस कार्यक्रम का प्रभाव कितना सार्थक रहा?',
      MR: 'तुम्ही सेवा दिलेल्या समुदायावर या कार्यक्रमाचा परिणाम किती अर्थपूर्ण होता?',
    },
  },
  {
    themeCode: 'TIMELINE_PLANNING',
    displayOrder: 2,
    isMandatory: true,
    group: 'planning',
    scale: 'QUALITY',
    themeName: { EN: 'Timeline', HI: 'समय नियोजन', MR: 'वेळेचे नियोजन' },
    question: {
      EN: 'How well was the event timeline planned in advance — scheduling, duration, dates communicated ahead of time?',
      HI: 'कार्यक्रम की समय-सारणी पहले से कितनी अच्छी तरह नियोजित थी — समय, अवधि, तारीखें पहले बताई गईं?',
      MR: 'कार्यक्रमाचे वेळापत्रक आधीच किती चांगले नियोजित होते — वेळ, कालावधी, तारखा आधी कळवल्या?',
    },
  },
  {
    themeCode: 'REQUIREMENTS_PLANNING',
    displayOrder: 3,
    isMandatory: true,
    group: 'planning',
    scale: 'QUALITY',
    themeName: { EN: 'Requirements', HI: 'आवश्यकताएँ', MR: 'गरजा' },
    question: {
      EN: 'How well were the requirements for this event planned in advance — roles, tasks and materials briefed beforehand?',
      HI: 'इस कार्यक्रम की आवश्यकताएँ पहले से कितनी अच्छी तरह नियोजित थीं — भूमिकाएँ, काम और सामग्री पहले बताई गई?',
      MR: 'या कार्यक्रमाच्या गरजा आधीच किती चांगल्या नियोजित होत्या — भूमिका, कामे आणि साहित्य आधी सांगितले?',
    },
  },
  {
    themeCode: 'FINANCIAL_PLANNING',
    displayOrder: 4,
    isMandatory: true,
    group: 'planning',
    scale: 'QUALITY',
    themeName: { EN: 'Budget', HI: 'बजट', MR: 'अर्थसंकल्प' },
    question: {
      EN: 'How well was the financial and budgetary planning handled — resources, expenses and funding readiness?',
      HI: 'वित्तीय और बजट नियोजन कितनी अच्छी तरह संभाला गया — संसाधन, खर्च और धन की तैयारी?',
      MR: 'आर्थिक व अर्थसंकल्पीय नियोजन किती चांगले हाताळले गेले — संसाधने, खर्च आणि निधीची तयारी?',
    },
  },
  {
    themeCode: 'PRE_EVENT_COMMUNICATION',
    displayOrder: 5,
    isMandatory: true,
    group: 'communication',
    scale: 'QUALITY',
    themeName: { EN: 'Before the event', HI: 'कार्यक्रम से पहले', MR: 'कार्यक्रमापूर्वी' },
    question: {
      EN: 'How clear and timely was communication from the NGO before the event — instructions, updates and expectations?',
      HI: 'कार्यक्रम से पहले संस्था की ओर से संवाद कितना स्पष्ट और समय पर था — निर्देश, अपडेट और अपेक्षाएँ?',
      MR: 'कार्यक्रमापूर्वी संस्थेकडून संवाद किती स्पष्ट व वेळेवर होता — सूचना, अपडेट आणि अपेक्षा?',
    },
  },
  {
    themeCode: 'DAY_OF_COMMUNICATION',
    displayOrder: 6,
    isMandatory: true,
    group: 'communication',
    scale: 'QUALITY',
    themeName: { EN: 'On the day', HI: 'कार्यक्रम के दिन', MR: 'कार्यक्रमाच्या दिवशी' },
    question: {
      EN: 'How clear was communication on the day of the event — instructions on-site and updates during the activity?',
      HI: 'कार्यक्रम के दिन संवाद कितना स्पष्ट था — मौके पर निर्देश और गतिविधि के दौरान अपडेट?',
      MR: 'कार्यक्रमाच्या दिवशी संवाद किती स्पष्ट होता — जागेवरील सूचना आणि उपक्रमादरम्यान अपडेट?',
    },
  },
  {
    themeCode: 'SKILL_UTILIZATION',
    displayOrder: 7,
    isMandatory: true,
    group: 'support',
    scale: 'QUALITY',
    themeName: { EN: 'Your skills', HI: 'आपके कौशल', MR: 'तुमची कौशल्ये' },
    question: {
      EN: 'How well were your skills and abilities utilised during the event?',
      HI: 'कार्यक्रम के दौरान आपके कौशल और क्षमताओं का कितना अच्छा उपयोग हुआ?',
      MR: 'कार्यक्रमादरम्यान तुमच्या कौशल्यांचा व क्षमतांचा किती चांगला उपयोग झाला?',
    },
  },
  {
    themeCode: 'STAFF_SUPPORT',
    displayOrder: 8,
    isMandatory: true,
    group: 'support',
    scale: 'QUALITY',
    themeName: { EN: 'Staff support', HI: 'कर्मचारी सहयोग', MR: 'कर्मचारी पाठिंबा' },
    question: {
      EN: "How would you rate the NGO staff's coordination, support and responsiveness to your queries?",
      HI: 'संस्था के कर्मचारियों का समन्वय, सहयोग और आपके प्रश्नों पर प्रतिक्रिया आप कैसी मानते हैं?',
      MR: 'संस्थेच्या कर्मचाऱ्यांचा समन्वय, पाठिंबा व तुमच्या प्रश्नांना प्रतिसाद तुम्ही कसा मानाल?',
    },
  },
  {
    themeCode: 'PARTICIPATION_LIKELIHOOD',
    displayOrder: 9,
    isMandatory: true,
    group: 'recommendation',
    scale: 'LIKELIHOOD',
    themeName: { EN: 'Recommend', HI: 'सिफ़ारिश', MR: 'शिफारस' },
    question: {
      EN: 'How likely are you to recommend participating in this event to others?',
      HI: 'आप दूसरों को इस कार्यक्रम में भाग लेने की सिफ़ारिश कितनी संभावना से करेंगे?',
      MR: 'तुम्ही इतरांना या कार्यक्रमात सहभागी होण्याची शिफारस किती शक्यतेने कराल?',
    },
  },
];

/* ---------- Topic groups = the cards, and the analytics buckets --------
   Each group is one card in the form AND one reporting dimension. Adding a
   theme to a group makes it roll up automatically on the admin side.
   ---------------------------------------------------------------------- */

export const GROUPS = [
  {
    key: 'impact',
    kind: 'faces', // single question, rendered as faces — the easy opener
    title: { EN: 'The difference you made', HI: 'आपने जो फ़र्क़ किया', MR: 'तुम्ही केलेला फरक' },
    hint: { EN: 'Tap one', HI: 'एक चुनें', MR: 'एक निवडा' },
  },
  {
    key: 'planning',
    kind: 'scales',
    title: { EN: 'Planning', HI: 'नियोजन', MR: 'नियोजन' },
    hint: {
      EN: 'Rate each from 1 to 5',
      HI: 'हर एक को 1 से 5 तक चुनें',
      MR: 'प्रत्येकाला 1 ते 5 पैकी निवडा',
    },
  },
  {
    key: 'communication',
    kind: 'scales',
    title: { EN: 'Communication', HI: 'संवाद', MR: 'संवाद' },
    hint: {
      EN: 'Rate each from 1 to 5',
      HI: 'हर एक को 1 से 5 तक चुनें',
      MR: 'प्रत्येकाला 1 ते 5 पैकी निवडा',
    },
  },
  {
    key: 'support',
    kind: 'scales',
    title: { EN: 'Your role and support', HI: 'आपकी भूमिका और सहयोग', MR: 'तुमची भूमिका व पाठिंबा' },
    hint: {
      EN: 'Rate each from 1 to 5',
      HI: 'हर एक को 1 से 5 तक चुनें',
      MR: 'प्रत्येकाला 1 ते 5 पैकी निवडा',
    },
  },
  {
    key: 'recommendation',
    kind: 'likelihood',
    title: { EN: 'Would you recommend it', HI: 'क्या आप सिफ़ारिश करेंगे', MR: 'तुम्ही शिफारस कराल का' },
    hint: { EN: 'Tap one', HI: 'एक चुनें', MR: 'एक निवडा' },
  },
  {
    key: 'comment',
    kind: 'comment', // feedback.overall_comment — optional, stored verbatim
    title: { EN: 'In your words', HI: 'आपके शब्दों में', MR: 'तुमच्या शब्दांत' },
    hint: {
      EN: 'Optional — you can submit without this',
      HI: 'वैकल्पिक — इसके बिना भी भेज सकते हैं',
      MR: 'ऐच्छिक — याशिवायही पाठवू शकता',
    },
  },
];

/** Themes belonging to a group, in display order. */
export const themesInGroup = (groupKey) =>
  THEMES.filter((theme) => theme.group === groupKey).sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

export const TOTAL_CARDS = GROUPS.length;
export const MANDATORY_THEMES = THEMES.filter((theme) => theme.isMandatory);

/* ---------- Everything on the page that is not a question -------------- */

export const ui = {
  youVolunteeredAt: { EN: 'You volunteered at', HI: 'आपने सेवा दी', MR: 'तुम्ही सहभागी झालात' },
  fixedNote: {
    EN: 'Taken from your attendance — nothing to fill in here.',
    HI: 'आपकी उपस्थिति से लिया गया — यहाँ कुछ भरना नहीं है।',
    MR: 'तुमच्या उपस्थितीवरून घेतले — येथे काही भरायचे नाही.',
  },
  requiredLegend: {
    EN: 'Questions marked * are required',
    HI: '* वाले प्रश्न अनिवार्य हैं',
    MR: '* असलेले प्रश्न अनिवार्य आहेत',
  },
  requiredCount: {
    EN: 'required answers left',
    HI: 'अनिवार्य उत्तर बाक़ी',
    MR: 'अनिवार्य उत्तरे बाकी',
  },
  allAnswered: {
    EN: 'All required questions answered',
    HI: 'सभी अनिवार्य प्रश्न पूरे',
    MR: 'सर्व अनिवार्य प्रश्न पूर्ण',
  },
  missingAnswer: {
    EN: 'Please answer this before submitting',
    HI: 'भेजने से पहले यह भरें',
    MR: 'पाठवण्यापूर्वी हे भरा',
  },
  jumpedToMissing: {
    EN: 'Please answer the highlighted question',
    HI: 'कृपया चिह्नित प्रश्न का उत्तर दें',
    MR: 'कृपया अधोरेखित प्रश्नाचे उत्तर द्या',
  },
  lockedHint: {
    EN: 'Required — you can change it, but not clear it',
    HI: 'अनिवार्य — बदल सकते हैं, हटा नहीं सकते',
    MR: 'अनिवार्य — बदलू शकता, काढू शकत नाही',
  },
  clearableHint: {
    EN: 'Tap again to clear',
    HI: 'हटाने के लिए फिर से चुनें',
    MR: 'काढण्यासाठी पुन्हा निवडा',
  },
  lowRatingLabel: {
    EN: 'What went wrong?',
    HI: 'क्या ठीक नहीं रहा?',
    MR: 'काय बरोबर नव्हते?',
  },
  lowRatingHint: {
    EN: 'One line is enough — this goes straight to the coordinator.',
    HI: 'एक पंक्ति काफ़ी है — यह सीधे समन्वयक तक जाएगी।',
    MR: 'एक ओळ पुरेशी आहे — हे थेट समन्वयकाकडे जाईल.',
  },
  commentLabel: {
    EN: 'Any other recommendations or comments?',
    HI: 'कोई और सुझाव या टिप्पणी?',
    MR: 'इतर काही सूचना किंवा टिप्पणी?',
  },
  commentPlaceholder: {
    EN: 'We ran out of gloves by 9 am, and the return bus was late…',
    HI: '9 बजे तक दस्ताने ख़त्म हो गए, और लौटने वाली बस देर से आई…',
    MR: 'सकाळी ९ पर्यंत हातमोजे संपले, आणि परतीची बस उशिरा आली…',
  },
  submit: { EN: 'Submit feedback', HI: 'प्रतिक्रिया भेजें', MR: 'अभिप्राय पाठवा' },
  submitting: { EN: 'Sending…', HI: 'भेजा जा रहा है…', MR: 'पाठवत आहे…' },
  back: { EN: 'Back', HI: 'वापस', MR: 'मागे' },
  speak: { EN: 'Speak', HI: 'बोलें', MR: 'बोला' },
  listening: { EN: 'Listening…', HI: 'सुन रहे हैं…', MR: 'ऐकत आहोत…' },
  of: { EN: 'of', HI: 'में से', MR: 'पैकी' },
};
