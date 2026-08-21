// =============================================================================
//  prisma/seed.js — Comprehensive seed for the Volunteer Feedback System
// =============================================================================
//
//  DEMO CREDENTIALS (for hackathon judges / development login):
//  ┌──────────────────────────────────────┬──────────────┬───────────┐
//  │ Email                                │ Role         │ Password  │
//  ├──────────────────────────────────────┼──────────────┼───────────┤
//  │ priya.deshmukh@sevasahayog.org       │ NGO ADMIN    │ admin@123 │
//  │ rohit.kapoor@sevasahayog.org         │ NGO ADMIN    │ admin@123 │
//  │ meera.joshi@sevasahayog.org          │ NGO STAFF    │ admin@123 │
//  │ rahul.mehta@mastercard.example       │ SPOC (MC)    │ admin@123 │
//  │ anita.rao@bnymellon.example          │ SPOC (BNY)   │ admin@123 │
//  │ vikram.joshi@infosys.example         │ SPOC (INF)   │ admin@123 │
//  └──────────────────────────────────────┴──────────────┴───────────┘
//
//  Run:  npx prisma db seed
//  Or:   npm run db:seed
//
//  This seed is IDEMPOTENT — re-running it will not create duplicates.
// =============================================================================

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 10;
const REFERENCE = new Date('2026-08-21T00:00:00Z');

const daysFromRef = (days, hour = 9) => {
  const d = new Date(REFERENCE);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};

// ── Nine mandatory themes ────────────────────────────────────────────────────

const QUALITY_LABELS = { '1': 'Very Poor', '2': 'Poor', '3': 'Average', '4': 'Good', '5': 'Excellent' };
const LIKELIHOOD_LABELS = { '1': 'Very Unlikely', '2': 'Unlikely', '3': 'Neutral', '4': 'Likely', '5': 'Very Likely' };

const MANDATORY_THEMES = [
  {
    themeCode: 'IMPACT',
    themeName: 'Meaningfulness & Impact',
    question: 'How meaningful was the impact of this event on the community you served?',
    description: 'Perceived social impact and personal fulfilment from the volunteering activity.',
    scaleLabels: QUALITY_LABELS,
    displayOrder: 1,
  },
  {
    themeCode: 'TIMELINE_PLANNING',
    themeName: 'Timeline Planning',
    question: 'How well was the event timeline planned in advance (scheduling, duration, dates communicated ahead of time)?',
    description: 'Quality of advance scheduling, duration estimation, and date communication.',
    scaleLabels: QUALITY_LABELS,
    displayOrder: 2,
  },
  {
    themeCode: 'REQUIREMENTS_PLANNING',
    themeName: 'Requirements Planning',
    question: 'How well were the requirements for this event planned in advance (roles, tasks, materials briefed beforehand)?',
    description: 'Preparedness of role assignments, task breakdown, and material provisioning.',
    scaleLabels: QUALITY_LABELS,
    displayOrder: 3,
  },
  {
    themeCode: 'FINANCIAL_PLANNING',
    themeName: 'Financial Planning',
    question: 'How well was the financial/budgetary planning handled for this event (resources, expenses, funding readiness)?',
    description: 'Budget adequacy, expense transparency, and resource funding.',
    scaleLabels: QUALITY_LABELS,
    displayOrder: 4,
  },
  {
    themeCode: 'PRE_EVENT_COMMUNICATION',
    themeName: 'Pre-Event Communication',
    question: 'How clear and timely was communication from the NGO before the event (instructions, updates, expectations)?',
    description: 'Clarity, timeliness, and completeness of pre-event information.',
    scaleLabels: QUALITY_LABELS,
    displayOrder: 5,
  },
  {
    themeCode: 'DAY_OF_COMMUNICATION',
    themeName: 'Day-of Communication',
    question: 'How clear was communication on the day of the event (instructions on-site, updates during the activity)?',
    description: 'On-ground coordination clarity and real-time update quality.',
    scaleLabels: QUALITY_LABELS,
    displayOrder: 6,
  },
  {
    themeCode: 'SKILL_UTILIZATION',
    themeName: 'Skill Utilization',
    question: 'How well were your skills and abilities utilized during the event?',
    description: 'Whether volunteers felt their professional or personal skills were put to good use.',
    scaleLabels: QUALITY_LABELS,
    displayOrder: 7,
  },
  {
    themeCode: 'STAFF_SUPPORT',
    themeName: 'Staff Support & Responsiveness',
    question: 'How would you rate the NGO staff\'s coordination, support, and responsiveness to your queries?',
    description: 'Helpfulness and approachability of the NGO coordinators on the ground.',
    scaleLabels: QUALITY_LABELS,
    displayOrder: 8,
  },
  {
    themeCode: 'PARTICIPATION_LIKELIHOOD',
    themeName: 'Likelihood to Recommend Participation',
    question: 'How likely are you to recommend participating in this event to others?',
    description: 'Behavioural-intention metric — scale wording differs (Very Unlikely → Very Likely).',
    scaleLabels: LIKELIHOOD_LABELS,
    displayOrder: 9,
  },
];

const THEME_CODES = MANDATORY_THEMES.map((t) => t.themeCode);

// =============================================================================
//  Main seed
// =============================================================================

const main = async () => {
  // Hash the demo password once — all seed users share it.
  const hash = await bcrypt.hash('admin@123', SALT_ROUNDS);

  // ── 1. Feedback Themes ────────────────────────────────────────────────────
  for (const t of MANDATORY_THEMES) {
    await prisma.feedbackTheme.upsert({
      where: { themeCode: t.themeCode },
      update: {
        themeName: t.themeName,
        question: t.question,
        description: t.description,
        scaleLabels: t.scaleLabels,
        displayOrder: t.displayOrder,
        isMandatory: true,
        isActive: true,
      },
      create: { ...t, isMandatory: true, isActive: true },
    });
  }

  const themeRows = await prisma.feedbackTheme.findMany({ where: { isMandatory: true } });
  const themeByCode = new Map(themeRows.map((t) => [t.themeCode, t]));

  const missing = THEME_CODES.filter((c) => !themeByCode.has(c));
  if (missing.length) throw new Error(`Missing themes after upsert: ${missing.join(', ')}`);

  // ── 2. Companies ──────────────────────────────────────────────────────────
  const mastercard = await prisma.company.upsert({
    where: { companyName: 'Mastercard' },
    update: {},
    create: { companyName: 'Mastercard' },
  });
  const bnyMellon = await prisma.company.upsert({
    where: { companyName: 'BNY Mellon' },
    update: {},
    create: { companyName: 'BNY Mellon' },
  });
  const infosys = await prisma.company.upsert({
    where: { companyName: 'Infosys' },
    update: {},
    create: { companyName: 'Infosys' },
  });

  // ── 3. NGO Users (2 ADMINs + 1 STAFF) ─────────────────────────────────────
  const admin1 = await prisma.ngoUser.upsert({
    where: { email: 'priya.deshmukh@sevasahayog.org' },
    update: {},
    create: {
      name: 'Priya Deshmukh',
      email: 'priya.deshmukh@sevasahayog.org',
      phone: '+919876543210',
      passwordHash: hash,
      role: 'ADMIN',
    },
  });
  const admin2 = await prisma.ngoUser.upsert({
    where: { email: 'rohit.kapoor@sevasahayog.org' },
    update: {},
    create: {
      name: 'Rohit Kapoor',
      email: 'rohit.kapoor@sevasahayog.org',
      phone: '+919876543211',
      passwordHash: hash,
      role: 'ADMIN',
    },
  });
  await prisma.ngoUser.upsert({
    where: { email: 'meera.joshi@sevasahayog.org' },
    update: {},
    create: {
      name: 'Meera Joshi',
      email: 'meera.joshi@sevasahayog.org',
      phone: '+919876543212',
      passwordHash: hash,
      role: 'STAFF',
    },
  });

  // ── 4. Company Users — SPOCs ──────────────────────────────────────────────
  const upsertCompanyUser = async (data) =>
    prisma.companyUser.upsert({
      where: { companyId_email: { companyId: data.companyId, email: data.email } },
      update: {},
      create: { ...data, passwordHash: hash },
    });

  const mcSpoc = await upsertCompanyUser({
    name: 'Rahul Mehta', email: 'rahul.mehta@mastercard.example',
    phone: '+919800000001', companyId: mastercard.companyId, role: 'SPOC',
  });
  const bnySpoc = await upsertCompanyUser({
    name: 'Anita Rao', email: 'anita.rao@bnymellon.example',
    phone: '+919800000002', companyId: bnyMellon.companyId, role: 'SPOC',
  });
  const infSpoc = await upsertCompanyUser({
    name: 'Vikram Joshi', email: 'vikram.joshi@infosys.example',
    phone: '+919800000003', companyId: infosys.companyId, role: 'SPOC',
  });

  // ── 5. Company Users — Volunteers ─────────────────────────────────────────
  const volSeeds = [
    // Mastercard (4)
    { name: 'Amit Sharma',    email: 'amit.sharma@mastercard.example',    phone: '+919811111001', companyId: mastercard.companyId, role: 'VOLUNTEER' },
    { name: 'Sneha Patil',    email: 'sneha.patil@mastercard.example',    phone: '+919811111002', companyId: mastercard.companyId, role: 'VOLUNTEER' },
    { name: 'Fatima Shaikh',  email: 'fatima.shaikh@mastercard.example',  phone: '+919811111003', companyId: mastercard.companyId, role: 'VOLUNTEER' },
    { name: 'Arjun Desai',    email: 'arjun.desai@mastercard.example',    phone: '+919811111004', companyId: mastercard.companyId, role: 'VOLUNTEER' },
    // BNY Mellon (4)
    { name: 'Meera Nair',     email: 'meera.nair@bnymellon.example',      phone: '+919822222001', companyId: bnyMellon.companyId, role: 'VOLUNTEER' },
    { name: 'Arjun Singh',    email: 'arjun.singh@bnymellon.example',     phone: '+919822222002', companyId: bnyMellon.companyId, role: 'VOLUNTEER' },
    { name: 'Divya Menon',    email: 'divya.menon@bnymellon.example',     phone: '+919822222003', companyId: bnyMellon.companyId, role: 'VOLUNTEER' },
    { name: 'Siddharth Rao',  email: 'siddharth.rao@bnymellon.example',   phone: '+919822222004', companyId: bnyMellon.companyId, role: 'VOLUNTEER' },
    // Infosys (3)
    { name: 'Sanjay Gupta',   email: 'sanjay.gupta@infosys.example',      phone: '+919833333001', companyId: infosys.companyId, role: 'VOLUNTEER' },
    { name: 'Kavita Pillai',  email: 'kavita.pillai@infosys.example',     phone: '+919833333002', companyId: infosys.companyId, role: 'VOLUNTEER' },
    { name: 'Rajesh Kumar',   email: 'rajesh.kumar@infosys.example',      phone: '+919833333003', companyId: infosys.companyId, role: 'VOLUNTEER' },
  ];

  const vols = [];
  for (const v of volSeeds) vols.push(await upsertCompanyUser(v));
  const [mcV1, mcV2, mcV3, mcV4] = vols.slice(0, 4);
  const [bnyV1, bnyV2, bnyV3, bnyV4] = vols.slice(4, 8);
  const [infV1, infV2, infV3] = vols.slice(8, 11);

  // ── 6. Events (6 events, mix of statuses, past + future) ──────────────────
  const findOrCreateEvent = async (data) => {
    const existing = await prisma.event.findFirst({ where: { eventName: data.eventName } });
    return existing ?? (await prisma.event.create({ data }));
  };

  // MC — completed, past, has feedback
  const mcEvent1 = await findOrCreateEvent({
    eventName: 'Riverside Tree Plantation Drive',
    description: 'Plant 200 saplings along the Mula-Mutha riverbank in partnership with the forest department.',
    location: 'Mula-Mutha Riverside, Pune',
    companyId: mastercard.companyId, adminId: admin1.userId, spocId: mcSpoc.userId,
    status: 'COMPLETED', eventDate: daysFromRef(-21),
    feedbackStart: daysFromRef(-20), feedbackEnd: daysFromRef(-14),
  });

  // MC — upcoming, no feedback (empty-state test)
  const mcEvent2 = await findOrCreateEvent({
    eventName: 'Digital Literacy Workshop for Municipal Schools',
    description: 'Teach basic computer skills and internet safety to grade 6-8 students.',
    location: 'PMC School No. 42, Kothrud, Pune',
    companyId: mastercard.companyId, adminId: admin1.userId, spocId: mcSpoc.userId,
    status: 'UPCOMING', eventDate: daysFromRef(14),
  });

  // BNY — completed, past, has feedback
  const bnyEvent1 = await findOrCreateEvent({
    eventName: 'Community Kitchen Meal Packaging',
    description: 'Pack and distribute 1000 meal kits for families in need across three wards.',
    location: 'SevaSahayog Centre, Hadapsar, Pune',
    companyId: bnyMellon.companyId, adminId: admin1.userId, spocId: bnySpoc.userId,
    status: 'COMPLETED', eventDate: daysFromRef(-10),
    feedbackStart: daysFromRef(-9), feedbackEnd: daysFromRef(-3),
  });

  // BNY — registration open, no feedback yet
  const bnyEvent2 = await findOrCreateEvent({
    eventName: 'Senior Citizen Home Companionship Day',
    description: 'Spend the day with residents — games, music and conversation.',
    location: 'Aashiyana Old Age Home, Pune',
    companyId: bnyMellon.companyId, adminId: admin2.userId, spocId: bnySpoc.userId,
    status: 'REGISTRATION_OPEN', eventDate: daysFromRef(26),
  });

  // INF — completed, past, has feedback (including non-English)
  const infEvent1 = await findOrCreateEvent({
    eventName: 'Beach Cleanup Drive',
    description: 'Clean up 2 km of Juhu Beach shoreline, sort recyclables, and educate local vendors.',
    location: 'Juhu Beach, Mumbai',
    companyId: infosys.companyId, adminId: admin1.userId, spocId: infSpoc.userId,
    status: 'COMPLETED', eventDate: daysFromRef(-7),
    feedbackStart: daysFromRef(-6), feedbackEnd: daysFromRef(-1),
  });

  // INF — ongoing, ZERO feedback (empty-state test #2)
  const infEvent2 = await findOrCreateEvent({
    eventName: 'Blood Donation Camp',
    description: 'Voluntary blood donation in partnership with Indian Red Cross Society.',
    location: 'Infosys Pune Campus, Hinjewadi',
    companyId: infosys.companyId, adminId: admin2.userId, spocId: infSpoc.userId,
    status: 'ONGOING', eventDate: daysFromRef(0),
  });

  // ── 7. Registrations ─────────────────────────────────────────────────────
  const reg = async (eventId, userId, status = 'REGISTERED') => {
    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    return existing ?? (await prisma.eventRegistration.create({
      data: { eventId, userId, attendanceStatus: status },
    }));
  };

  // MC event 1 — all 4 attended
  const mcR1 = await reg(mcEvent1.eventId, mcV1.userId, 'ATTENDED');
  const mcR2 = await reg(mcEvent1.eventId, mcV2.userId, 'ATTENDED');
  const mcR3 = await reg(mcEvent1.eventId, mcV3.userId, 'ATTENDED');
  const mcR4 = await reg(mcEvent1.eventId, mcV4.userId, 'ATTENDED');

  // MC event 2 — 2 registered (upcoming, no feedback possible)
  await reg(mcEvent2.eventId, mcV1.userId);
  await reg(mcEvent2.eventId, mcV2.userId);

  // BNY event 1 — 4 volunteers: 3 attended, 1 absent
  const bnyR1 = await reg(bnyEvent1.eventId, bnyV1.userId, 'ATTENDED');
  const bnyR2 = await reg(bnyEvent1.eventId, bnyV2.userId, 'ATTENDED');
  const bnyR3 = await reg(bnyEvent1.eventId, bnyV3.userId, 'ATTENDED');
  await reg(bnyEvent1.eventId, bnyV4.userId, 'ABSENT');

  // BNY event 2 — 2 registered
  await reg(bnyEvent2.eventId, bnyV1.userId);
  await reg(bnyEvent2.eventId, bnyV2.userId);

  // INF event 1 — 3 attended
  const infR1 = await reg(infEvent1.eventId, infV1.userId, 'ATTENDED');
  const infR2 = await reg(infEvent1.eventId, infV2.userId, 'ATTENDED');
  const infR3 = await reg(infEvent1.eventId, infV3.userId, 'ATTENDED');

  // INF event 2 — 2 registered (ongoing, zero feedback)
  await reg(infEvent2.eventId, infV1.userId);
  await reg(infEvent2.eventId, infV2.userId);

  // ── 8. Feedback + Ratings ─────────────────────────────────────────────────
  //
  // Coverage plan:
  //   • Full 1-5 rating range represented across feedback entries
  //   • Hindi and Marathi comments with & without translation
  //   • One 200+ word comment for UI truncation stress test
  //   • All five Sentiment values in AI insights
  //   • Insights with empty themes array vs 3+ themes
  //   • mcR4 (Arjun Desai) has registration but NO feedback -> query 16 test
  //   • infR3 (Rajesh Kumar) has registration but NO feedback -> query 16 test

  const createFeedback = async (registration, ratings, overallComment, language = 'EN', processingStatus = 'COMPLETED') => {
    let fb = await prisma.feedback.findUnique({ where: { registrationId: registration.registrationId } });
    if (!fb) {
      fb = await prisma.feedback.create({
        data: {
          registrationId: registration.registrationId,
          overallComment,
          language,
          processingStatus,
        },
      });
      await prisma.eventRegistration.update({
        where: { registrationId: registration.registrationId },
        data: { feedbackSubmittedAt: fb.submittedAt },
      });
    }
    // Upsert ratings
    for (const [i, code] of THEME_CODES.entries()) {
      const theme = themeByCode.get(code);
      await prisma.feedbackRating.upsert({
        where: { feedbackId_themeId: { feedbackId: fb.feedbackId, themeId: theme.themeId } },
        update: { rating: ratings[i], source: 'EXPLICIT' },
        create: { feedbackId: fb.feedbackId, themeId: theme.themeId, rating: ratings[i], source: 'EXPLICIT' },
      });
    }
    return fb;
  };

  // --- MC Event 1 feedback ---

  // FB1: All 5s — glowing review (English)
  const fb1 = await createFeedback(
    mcR1,
    [5, 5, 5, 5, 5, 5, 5, 5, 5],
    'The event was incredibly well planned and executed. The timeline was communicated weeks in advance, every volunteer knew their role, and the NGO staff were superb. Planting 200 saplings felt genuinely meaningful — you could see the impact right there on the riverbank. I would absolutely recommend this to everyone.',
  );

  // FB2: Mixed ratings, Marathi comment, translation NOT yet done (processingStatus = PENDING)
  const fb2 = await createFeedback(
    mcR2,
    [4, 3, 3, 2, 2, 3, 4, 3, 4],
    'खूप छान अनुभव होता पण कार्यक्रमापूर्वी संवाद अत्यंत कमी होता. आम्हाला वेळापत्रक उशिरा कळले आणि साहित्याची माहिती दिली नव्हती. तरीही, प्रत्यक्ष कार्यक्रमात कर्मचाऱ्यांनी चांगले सहकार्य केले.',
    'MR',
    'PENDING', // Translation / AI not run yet
  );

  // FB3: Low ratings (1-2 range), English — stresses rating floor
  const fb3 = await createFeedback(
    mcR3,
    [2, 1, 1, 2, 1, 2, 2, 1, 1],
    'Extremely disappointing. The bus arrived 90 minutes late, nobody had a clear plan, and the materials ran out halfway through. The staff seemed overwhelmed and unresponsive. I would not recommend this to anyone.',
  );

  // mcR4 (Arjun Desai) — NO feedback submitted. Tests "registered but didn't give feedback".

  // --- BNY Event 1 feedback ---

  // FB4: Good ratings, Hindi comment WITH translation populated
  const fb4 = await createFeedback(
    bnyR1,
    [5, 4, 4, 4, 4, 5, 3, 5, 5],
    'बच्चों के लिए खाना पैक करना बहुत संतोषजनक था। सब कुछ बहुत अच्छी तरह से व्यवस्थित था, हालांकि मुझे लगा कि मेरे कौशल का पूरा उपयोग नहीं हो पाया — मैं एक सॉफ्टवेयर इंजीनियर हूं और मुख्य रूप से बक्से ढो रहा था।',
    'HI',
  );

  // FB5: All 3s — perfectly average, English
  const fb5 = await createFeedback(
    bnyR2,
    [3, 3, 3, 3, 3, 3, 3, 3, 3],
    'It was okay. Nothing particularly stood out as great or terrible. The event happened, we did the work, and went home. Average experience overall.',
  );

  // FB6: Very long comment (200+ words) — UI truncation stress test
  const fb6 = await createFeedback(
    bnyR3,
    [4, 4, 3, 4, 3, 2, 4, 4, 4],
    `This was my third volunteering event with SevaSahayog and overall I think the organization continues to improve. The meal packaging activity itself was well-structured — we had clear stations for sorting, packing, and labeling, and the flow was efficient once everyone found their rhythm. The NGO staff were incredibly helpful and patient, especially with first-time volunteers who needed extra guidance on the packaging standards.

However, I do have some concerns about communication. The pre-event email arrived only two days before the event, which made it difficult to plan around my work schedule. Several colleagues who wanted to join couldn't because of the short notice. On the day itself, the initial briefing was rushed and some volunteers were confused about which station they were assigned to for the first thirty minutes.

The financial planning seemed adequate — there were enough materials and supplies for everyone, and the quality of the meal kits was good. I appreciated that the NGO provided a detailed breakdown of where the funds went.

One suggestion: it would be great to see photos or follow-up stories about the families who received the meal kits. That kind of feedback loop would make the experience feel even more impactful and would probably encourage more people to sign up for future events.

Despite the minor communication hiccups, I would definitely participate again and would recommend it to colleagues who are looking for a meaningful way to give back to the community.`,
  );

  // --- INF Event 1 feedback ---

  // FB7: High ratings, Hindi, translation done
  const fb7 = await createFeedback(
    infR1,
    [5, 5, 4, 4, 5, 4, 5, 5, 5],
    'समुद्र तट की सफाई एक अद्भुत अनुभव था। हमने दो किलोमीटर तट साफ किया और स्थानीय दुकानदारों को कचरा प्रबंधन के बारे में शिक्षित किया। कर्मचारियों ने बहुत अच्छा समर्थन दिया।',
    'HI',
  );

  // FB8: Mixed, English
  const fb8 = await createFeedback(
    infR2,
    [3, 2, 3, 3, 4, 1, 3, 4, 3],
    'The beach cleanup was decent but the day-of communication was terrible. Nobody told us where to deposit the sorted recyclables, and we spent the first hour just figuring out logistics. The pre-event instructions were good though.',
  );

  // infR3 (Rajesh Kumar) — NO feedback. Tests "registered but didn't submit".

  // ── 9. Feedback Insights (AI-classified) ──────────────────────────────────
  //
  // Coverage: all five Sentiment values, empty vs 3+ insights per feedback,
  // mandatory themes with themeId + analytics-only themes with themeId = null.

  const createInsight = async (feedbackId, detectedTheme, sentiment, confidence, evidenceText, themeCode = null) => {
    const themeId = themeCode ? themeByCode.get(themeCode)?.themeId ?? null : null;
    const existing = await prisma.feedbackInsight.findFirst({
      where: { feedbackId, detectedTheme, evidenceText },
    });
    if (existing) return existing;
    return prisma.feedbackInsight.create({
      data: {
        feedbackId,
        themeId,
        detectedTheme,
        sentiment,
        sentimentScore: null,
        confidence,
        evidenceText,
        extractionMethod: confidence >= 0.75 ? 'AI' : 'HEURISTIC',
        modelName: confidence >= 0.75 ? 'gemini-2.5-flash' : null,
        modelVersion: confidence >= 0.75 ? 'v1.0' : null,
      },
    });
  };

  // FB1 — 3+ insights (POSITIVE, VERY_POSITIVE)
  await createInsight(fb1.feedbackId, 'TIMELINE_PLANNING', 'POSITIVE', 0.93, 'timeline was communicated weeks in advance', 'TIMELINE_PLANNING');
  await createInsight(fb1.feedbackId, 'REQUIREMENTS_PLANNING', 'POSITIVE', 0.91, 'every volunteer knew their role', 'REQUIREMENTS_PLANNING');
  await createInsight(fb1.feedbackId, 'STAFF_SUPPORT', 'VERY_POSITIVE', 0.95, 'NGO staff were superb', 'STAFF_SUPPORT');
  await createInsight(fb1.feedbackId, 'IMPACT', 'VERY_POSITIVE', 0.92, 'felt genuinely meaningful', 'IMPACT');

  // FB2 — no insights yet (processingStatus = PENDING, zero insights = empty-state)

  // FB3 — 3+ insights (VERY_NEGATIVE, NEGATIVE)
  await createInsight(fb3.feedbackId, 'TIMELINE_PLANNING', 'VERY_NEGATIVE', 0.94, 'bus arrived 90 minutes late', 'TIMELINE_PLANNING');
  await createInsight(fb3.feedbackId, 'REQUIREMENTS_PLANNING', 'NEGATIVE', 0.89, 'nobody had a clear plan', 'REQUIREMENTS_PLANNING');
  await createInsight(fb3.feedbackId, 'EQUIPMENT', 'NEGATIVE', 0.87, 'materials ran out halfway through');  // analytics-only theme, no themeId
  await createInsight(fb3.feedbackId, 'STAFF_SUPPORT', 'VERY_NEGATIVE', 0.91, 'staff seemed overwhelmed and unresponsive', 'STAFF_SUPPORT');

  // FB4 — 2 insights (POSITIVE + low-confidence HEURISTIC for NEUTRAL)
  await createInsight(fb4.feedbackId, 'IMPACT', 'POSITIVE', 0.88, 'खाना पैक करना बहुत संतोषजनक था', 'IMPACT');
  await createInsight(fb4.feedbackId, 'SKILL_UTILIZATION', 'NEUTRAL', 0.62, 'मेरे कौशल का पूरा उपयोग नहीं हो पाया', 'SKILL_UTILIZATION'); // HEURISTIC (< 0.75)

  // FB5 — 1 insight (NEUTRAL — average all around)
  await createInsight(fb5.feedbackId, 'IMPACT', 'NEUTRAL', 0.78, 'Nothing particularly stood out', 'IMPACT');

  // FB6 — 4+ insights covering the long comment
  await createInsight(fb6.feedbackId, 'STAFF_SUPPORT', 'POSITIVE', 0.90, 'NGO staff were incredibly helpful and patient', 'STAFF_SUPPORT');
  await createInsight(fb6.feedbackId, 'PRE_EVENT_COMMUNICATION', 'NEGATIVE', 0.92, 'pre-event email arrived only two days before', 'PRE_EVENT_COMMUNICATION');
  await createInsight(fb6.feedbackId, 'DAY_OF_COMMUNICATION', 'NEGATIVE', 0.86, 'initial briefing was rushed', 'DAY_OF_COMMUNICATION');
  await createInsight(fb6.feedbackId, 'FINANCIAL_PLANNING', 'POSITIVE', 0.81, 'enough materials and supplies for everyone', 'FINANCIAL_PLANNING');
  await createInsight(fb6.feedbackId, 'BENEFICIARY_INTERACTION', 'POSITIVE', 0.70, 'photos or follow-up stories about the families'); // HEURISTIC

  // FB7 — 3 insights
  await createInsight(fb7.feedbackId, 'IMPACT', 'VERY_POSITIVE', 0.94, 'अद्भुत अनुभव', 'IMPACT');
  await createInsight(fb7.feedbackId, 'STAFF_SUPPORT', 'POSITIVE', 0.89, 'कर्मचारियों ने बहुत अच्छा समर्थन दिया', 'STAFF_SUPPORT');
  await createInsight(fb7.feedbackId, 'BENEFICIARY_INTERACTION', 'POSITIVE', 0.85, 'स्थानीय दुकानदारों को शिक्षित किया');

  // FB8 — 3 insights
  await createInsight(fb8.feedbackId, 'DAY_OF_COMMUNICATION', 'VERY_NEGATIVE', 0.93, 'day-of communication was terrible', 'DAY_OF_COMMUNICATION');
  await createInsight(fb8.feedbackId, 'VENUE', 'NEGATIVE', 0.80, 'spent the first hour just figuring out logistics');
  await createInsight(fb8.feedbackId, 'PRE_EVENT_COMMUNICATION', 'POSITIVE', 0.85, 'pre-event instructions were good', 'PRE_EVENT_COMMUNICATION');

  // ── 10. AI Analysis Runs ──────────────────────────────────────────────────
  const completedFeedbacks = [fb1, fb3, fb4, fb5, fb6, fb7, fb8]; // fb2 is PENDING
  for (const fb of completedFeedbacks) {
    const existing = await prisma.aIAnalysisRun.findFirst({ where: { feedbackId: fb.feedbackId } });
    if (!existing) {
      await prisma.aIAnalysisRun.create({
        data: {
          feedbackId: fb.feedbackId,
          modelName: 'gemini-2.5-flash',
          modelVersion: 'v1.0',
          promptVersion: 'v1.0',
          processingStatus: 'COMPLETED',
          processingTimeMs: 500 + Math.floor(Math.random() * 2000),
          completedAt: new Date(),
        },
      });
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const counts = {
    companies: await prisma.company.count(),
    ngoUsers: await prisma.ngoUser.count(),
    companyUsers: await prisma.companyUser.count(),
    events: await prisma.event.count(),
    registrations: await prisma.eventRegistration.count(),
    feedback: await prisma.feedback.count(),
    themes: await prisma.feedbackTheme.count({ where: { isMandatory: true } }),
    ratings: await prisma.feedbackRating.count(),
    insights: await prisma.feedbackInsight.count(),
    analysisRuns: await prisma.aIAnalysisRun.count(),
  };

  console.log('');
  console.log('✅  Seed complete!');
  console.log('    ──────────────────────────────────────');
  console.table(counts);
  console.log('');
  console.log('    Login credentials (password: admin@123):');
  console.log('      NGO ADMIN  →  priya.deshmukh@sevasahayog.org');
  console.log('      NGO ADMIN  →  rohit.kapoor@sevasahayog.org');
  console.log('      MC SPOC    →  rahul.mehta@mastercard.example');
  console.log('      BNY SPOC   →  anita.rao@bnymellon.example');
  console.log('      INF SPOC   →  vikram.joshi@infosys.example');
  console.log('');
};

// =============================================================================
//  APPENDIX: Duplicate-contact constraint demonstration
// =============================================================================
//
//  The following block demonstrates that the UNIQUE(eventId, userId) constraint
//  correctly rejects a second registration by the same volunteer for the same
//  event. Uncomment and run to verify — it WILL throw Prisma error P2002.
//
//  // --- EXPECTED TO FAIL: duplicate registration ---
//  // try {
//  //   await prisma.eventRegistration.create({
//  //     data: {
//  //       eventId: mcEvent1.eventId,
//  //       userId: mcV1.userId,
//  //       attendanceStatus: 'REGISTERED',
//  //     },
//  //   });
//  //   console.error('❌ Should have thrown P2002!');
//  // } catch (err) {
//  //   console.log('✅ Correctly rejected duplicate registration:', err.code);
//  // }
//  //
//  // --- EXPECTED TO FAIL: duplicate feedback on same registration ---
//  // try {
//  //   await prisma.feedback.create({
//  //     data: {
//  //       registrationId: mcR1.registrationId,
//  //       overallComment: 'Second feedback attempt',
//  //       language: 'EN',
//  //       processingStatus: 'PENDING',
//  //     },
//  //   });
//  //   console.error('❌ Should have thrown P2002!');
//  // } catch (err) {
//  //   console.log('✅ Correctly rejected duplicate feedback:', err.code);
//  // }

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
