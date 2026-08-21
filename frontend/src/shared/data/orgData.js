/* ============================================================
   ORG-WIDE DEMO DATA — the console side of the same records.

   The volunteer app has demoData.js: one volunteer, their activities,
   their feedback. This file is the whole Foundation's view of the same
   world — every corporate partner, every activity, every submission.

   IT IMPORTS THE VOLUNTEER'S DATA RATHER THAN RESTATING IT. Rajesh
   Kulkarni's Amdocs activities and the three feedbacks he has already
   given are the SAME rows here that they are there. That is deliberate:
   showing one record from both sides — the volunteer's "FB-2026-0089"
   and the admin's row for it — is the strongest available proof that
   this is one system and not two mockups.

   Field names mirror the Prisma schema so swapping in the REST API is a
   change to shared/lib/orgApi.js alone:

     companyId / companyName      -> companies
     userId / role / companyId    -> company_users (SPOC | VOLUNTEER)
     userId / role                -> ngo_users     (ADMIN | STAFF)
     eventId / status / eventDate -> events (EventStatus)
     registrationId / attendance  -> event_registrations (AttendanceStatus)
     feedbackId / overallComment  -> feedback (stored verbatim, RULE 20)
     ratings[themeCode]           -> feedback_ratings (1..5, RULE 16)
   ============================================================ */

import {
  activities as volunteerActivities,
  seededFeedback as volunteerFeedback,
  volunteer as rajesh,
  spoc as amdocsSpoc,
} from '../../volunteer/data/demoData.js';
import { THEMES } from '../../volunteer/data/questions.js';

export const TODAY = '2026-08-21';

/* ---------- Deterministic randomness -----------------------------------
   A seeded LCG, not Math.random. The demo must look identical on every
   reload — a judge who refreshes and sees different numbers stops
   believing the numbers.
   ---------------------------------------------------------------------- */

function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

const pick = (rand, list) => list[Math.floor(rand() * list.length) % list.length];
const between = (rand, min, max) => min + Math.floor(rand() * (max - min + 1));

/* ---------- NGO staff — ngo_users -------------------------------------- */

export const ngoUsers = [
  {
    userId: 'NGO-0001',
    name: 'Sunita Deshpande',
    shortName: 'Sunita',
    initials: 'SD',
    role: 'ADMIN',
    email: 'sunita.deshpande@sevasahayog.org',
    phone: '9822004471',
  },
  {
    userId: 'NGO-0002',
    name: 'Amit Gaikwad',
    shortName: 'Amit',
    initials: 'AG',
    role: 'STAFF',
    email: 'amit.gaikwad@sevasahayog.org',
    phone: '9822004472',
  },
];

export const ADMIN_ID = ngoUsers[0].userId;

/* ---------- Corporate partners — companies ------------------------------ */

export const companies = [
  { companyId: 'CMP-0001', companyName: 'Amdocs', sector: 'Technology', onboardedOn: '2025-01-18', deletedAt: null },
  { companyId: 'CMP-0002', companyName: 'Mastercard', sector: 'Financial services', onboardedOn: '2024-11-04', deletedAt: null },
  { companyId: 'CMP-0003', companyName: 'TCS', sector: 'Technology', onboardedOn: '2024-06-22', deletedAt: null },
  { companyId: 'CMP-0004', companyName: 'Infosys', sector: 'Technology', onboardedOn: '2025-02-11', deletedAt: null },
  { companyId: 'CMP-0005', companyName: 'Wipro', sector: 'Technology', onboardedOn: '2025-04-09', deletedAt: null },
  { companyId: 'CMP-0006', companyName: 'Accenture', sector: 'Consulting', onboardedOn: '2025-07-30', deletedAt: null },
];

export const companyName = (companyId) =>
  companies.find((c) => c.companyId === companyId)?.companyName ?? 'Unknown partner';

/* ---------- SPOCs — company_users, role SPOC ---------------------------
   RULE 11: a SPOC belongs to exactly one company, and only that company's
   events can point at them. One SPOC per partner here.
   ---------------------------------------------------------------------- */

export const spocs = [
  {
    userId: amdocsSpoc.spocId,
    companyId: 'CMP-0001',
    role: 'SPOC',
    name: amdocsSpoc.name,
    initials: amdocsSpoc.initials,
    title: amdocsSpoc.title,
    email: amdocsSpoc.email,
    phone: amdocsSpoc.phone,
  },
  {
    userId: 'SPOC-2026-0002',
    companyId: 'CMP-0002',
    role: 'SPOC',
    name: 'Rahul Sharma',
    initials: 'RS',
    title: 'CSR Lead, Mastercard Pune',
    email: 'rahul.sharma@mastercard.com',
    phone: '9820114466',
  },
  {
    userId: 'SPOC-2026-0003',
    companyId: 'CMP-0003',
    role: 'SPOC',
    name: 'Priya Nair',
    initials: 'PN',
    title: 'CSR Manager, TCS Hinjewadi',
    email: 'priya.nair@tcs.com',
    phone: '9822556677',
  },
  {
    userId: 'SPOC-2026-0004',
    companyId: 'CMP-0004',
    role: 'SPOC',
    name: 'Vikram Joshi',
    initials: 'VJ',
    title: 'Community Lead, Infosys Pune',
    email: 'vikram.joshi@infosys.com',
    phone: '9881223344',
  },
  {
    userId: 'SPOC-2026-0005',
    companyId: 'CMP-0005',
    role: 'SPOC',
    name: 'Meera Kulkarni',
    initials: 'MK',
    title: 'CSR Partner, Wipro Pune',
    email: 'meera.kulkarni@wipro.com',
    phone: '9890445566',
  },
  {
    userId: 'SPOC-2026-0006',
    companyId: 'CMP-0006',
    role: 'SPOC',
    name: 'Farhan Shaikh',
    initials: 'FS',
    title: 'CSR Lead, Accenture Pune',
    email: 'farhan.shaikh@accenture.com',
    phone: '9765889900',
  },
];

export const spocForCompany = (companyId) => spocs.find((s) => s.companyId === companyId) ?? null;

/* ---------- Volunteers — company_users, role VOLUNTEER ------------------ */

const FIRST_NAMES = [
  'Aarti', 'Nikhil', 'Sneha', 'Rohan', 'Pooja', 'Kunal', 'Shweta', 'Aditya',
  'Manasi', 'Sagar', 'Devika', 'Harsh', 'Trupti', 'Omkar', 'Ishita', 'Prasad',
  'Neha', 'Yash', 'Ketki', 'Siddharth', 'Radhika', 'Abhijit', 'Sayali', 'Tanmay',
  'Gauri', 'Vivek', 'Anjali', 'Mayur', 'Shruti', 'Nilesh',
];

const LAST_NAMES = [
  'Kulkarni', 'Deshmukh', 'Patil', 'Joshi', 'Shinde', 'Bhosale', 'Kale', 'Pawar',
  'Nadkarni', 'Jadhav', 'Chavan', 'Sawant', 'Gokhale', 'Rane', 'Phadke', 'Salunkhe',
];

const AREAS = [
  'Kothrud', 'Hadapsar', 'Wagholi', 'Pimpri', 'Chinchwad', 'Katraj',
  'Bhosari', 'Kharadi', 'Warje', 'Baner', 'Hinjewadi', 'Yerawada',
];

const EMAIL_DOMAIN = {
  'CMP-0001': 'amdocs.com',
  'CMP-0002': 'mastercard.com',
  'CMP-0003': 'tcs.com',
  'CMP-0004': 'infosys.com',
  'CMP-0005': 'wipro.com',
  'CMP-0006': 'accenture.com',
};

/* NOTE ON ORDER: volunteers are built AFTER events, further down, because
   how many employees a company needs on its books is decided by its
   largest activity. A company with a 140-volunteer school-kit drive
   cannot have a 35-person roster; if it does, the response rate for that
   activity is capped at 25% no matter what anyone submits, and every
   number on every dashboard quietly becomes wrong. */

/* ---------- Events ------------------------------------------------------
   The Amdocs events come straight from the volunteer's data, mapped into
   the schema-shaped record the consoles read. Everything else is the rest
   of the Foundation's month.
   ---------------------------------------------------------------------- */

/** volunteer status vocabulary -> EventStatus enum. */
const STATUS_FROM_VOLUNTEER = {
  ACTIVE: 'ONGOING',
  UPCOMING: 'REGISTRATION_OPEN',
  PAST: 'COMPLETED',
};

function fromVolunteerActivity(activity) {
  return {
    eventId: activity.activityId,
    companyId: 'CMP-0001',
    adminId: ADMIN_ID,
    spocId: amdocsSpoc.spocId,
    eventName: activity.name,
    description: activity.description,
    location: activity.venue,
    area: activity.area,
    activityType: activity.activityType,
    status: STATUS_FROM_VOLUNTEER[activity.status] ?? 'UPCOMING',
    eventDate: `${activity.date}T${activity.startTime}:00+05:30`,
    startTime: activity.startTime,
    endTime: activity.endTime,
    feedbackStart: `${activity.date}T${activity.endTime}:00+05:30`,
    feedbackEnd: `${activity.date}T23:59:00+05:30`,
    volunteersNeeded: activity.volunteersNeeded,
    volunteersRegistered: activity.volunteersRegistered,
  };
}

const otherEvents = [
  {
    eventId: 'ACT-2026-0230', companyId: 'CMP-0002', spocId: 'SPOC-2026-0002',
    eventName: 'School Kit Assembly — Mastercard Day 1', activityType: 'Education',
    description: 'Assembly line packing of 1,600 school kits for ZP schools in Mulshi block, with 120 Mastercard volunteers across two shifts.',
    location: 'Seva Sahayog collection centre', area: 'Hadapsar',
    status: 'COMPLETED', date: '2026-08-18', startTime: '09:00', endTime: '13:30',
    volunteersNeeded: 120, volunteersRegistered: 118,
  },
  {
    eventId: 'ACT-2026-0227', companyId: 'CMP-0003', spocId: 'SPOC-2026-0003',
    eventName: 'Digital Literacy Session — Std VIII', activityType: 'Education',
    description: 'Teaching browser, keyboard and safe-search basics to Std VIII students on 24 refurbished laptops.',
    location: 'ZP Primary School, Ambegaon', area: 'Katraj',
    status: 'COMPLETED', date: '2026-08-14', startTime: '10:00', endTime: '13:00',
    volunteersNeeded: 30, volunteersRegistered: 28,
  },
  {
    eventId: 'ACT-2026-0224', companyId: 'CMP-0004', spocId: 'SPOC-2026-0004',
    eventName: 'Waste Segregation Drive', activityType: 'Environment',
    description: 'Household waste segregation awareness and a clean-up sweep across four lanes of the Kharadi settlement.',
    location: 'Kharadi settlement, lanes 3–6', area: 'Kharadi',
    status: 'COMPLETED', date: '2026-08-12', startTime: '07:30', endTime: '11:00',
    volunteersNeeded: 90, volunteersRegistered: 86,
  },
  {
    eventId: 'ACT-2026-0221', companyId: 'CMP-0005', spocId: 'SPOC-2026-0005',
    eventName: 'Tree Plantation — Warje Riverside', activityType: 'Environment',
    description: 'Planting 500 native saplings along the Mutha riverside stretch with the Seva Sahayog green team.',
    location: 'Warje riverside plot', area: 'Warje',
    status: 'COMPLETED', date: '2026-08-08', startTime: '07:00', endTime: '11:30',
    volunteersNeeded: 95, volunteersRegistered: 91,
  },
  {
    eventId: 'ACT-2026-0218', companyId: 'CMP-0006', spocId: 'SPOC-2026-0006',
    eventName: 'Women Digital Literacy Workshop', activityType: 'Community',
    description: 'Smartphone, UPI and government-scheme navigation workshop for 90 women from the community learning centres.',
    location: 'Community Learning Centre 2', area: 'Yerawada',
    status: 'COMPLETED', date: '2026-08-05', startTime: '10:00', endTime: '14:00',
    volunteersNeeded: 55, volunteersRegistered: 52,
  },
  {
    eventId: 'ACT-2026-0212', companyId: 'CMP-0002', spocId: 'SPOC-2026-0002',
    eventName: 'Community Development Camp', activityType: 'Community',
    description: 'Health check-up desks, Aadhaar assistance and a ration-card help desk run jointly with the ward office.',
    location: 'Landewadi community hall', area: 'Bhosari',
    status: 'COMPLETED', date: '2026-07-29', startTime: '09:30', endTime: '15:00',
    volunteersNeeded: 75, volunteersRegistered: 73,
  },
  {
    eventId: 'ACT-2026-0206', companyId: 'CMP-0003', spocId: 'SPOC-2026-0003',
    eventName: 'Menstrual Health Awareness — Cohort 4', activityType: 'Health',
    description: 'Adolescent-girl session on menstrual health and hygiene across three ZP schools in the Purandar block.',
    location: 'ZP Girls High School', area: 'Wagholi',
    status: 'COMPLETED', date: '2026-07-22', startTime: '11:00', endTime: '15:00',
    volunteersNeeded: 40, volunteersRegistered: 36,
  },
  {
    eventId: 'ACT-2026-0203', companyId: 'CMP-0004', spocId: 'SPOC-2026-0004',
    eventName: 'Blood Donation Camp', activityType: 'Health',
    description: 'Camp run with Jankalyan Blood Bank. Volunteers handle registration, refreshments and the post-donation rest area.',
    location: 'Infosys Phase 2 atrium', area: 'Hinjewadi',
    status: 'COMPLETED', date: '2026-07-16', startTime: '09:00', endTime: '16:00',
    volunteersNeeded: 35, volunteersRegistered: 34,
  },
  /* ---- Still to come ---- */
  {
    eventId: 'ACT-2026-0246', companyId: 'CMP-0002', spocId: 'SPOC-2026-0002',
    eventName: 'School Kit Distribution — Mulshi', activityType: 'Education',
    description: 'Handing 1,600 assembled kits to students across six ZP schools, with a short reading session in each classroom.',
    location: 'ZP School cluster, Mulshi', area: 'Baner',
    status: 'REGISTRATION_OPEN', date: '2026-08-29', startTime: '08:30', endTime: '14:00',
    volunteersNeeded: 80, volunteersRegistered: 61,
  },
  {
    eventId: 'ACT-2026-0249', companyId: 'CMP-0003', spocId: 'SPOC-2026-0003',
    eventName: 'Miyawaki Plantation — Phase 3', activityType: 'Environment',
    description: 'Third-phase infill planting and mulching on the Hinjewadi Miyawaki block, with a soil-preparation briefing.',
    location: 'Hinjewadi Phase 1 green belt', area: 'Hinjewadi',
    status: 'REGISTRATION_OPEN', date: '2026-09-05', startTime: '07:00', endTime: '11:00',
    volunteersNeeded: 70, volunteersRegistered: 44,
  },
  {
    eventId: 'ACT-2026-0253', companyId: 'CMP-0006', spocId: 'SPOC-2026-0006',
    eventName: 'Career Awareness Workshop', activityType: 'Education',
    description: 'Career-path and confidence workshop for 150 Std IX and X students from the adolescent programme.',
    location: 'Nehru Nagar centre', area: 'Pimpri',
    status: 'UPCOMING', date: '2026-09-10', startTime: '10:00', endTime: '14:30',
    volunteersNeeded: 45, volunteersRegistered: 12,
  },
  {
    eventId: 'ACT-2026-0256', companyId: 'CMP-0005', spocId: 'SPOC-2026-0005',
    eventName: 'Ration Kit Packing — Festival Drive', activityType: 'Community',
    description: 'Packing 1,200 festival ration kits for community learning centre families ahead of Diwali.',
    location: 'Chinchwad godown', area: 'Chinchwad',
    status: 'UPCOMING', date: '2026-09-17', startTime: '10:30', endTime: '16:00',
    volunteersNeeded: 60, volunteersRegistered: 8,
  },
  {
    /* Edge case: a cancelled event. Never deleted, so its registrations and
       feedback stay auditable — exactly what the schema comment says. */
    eventId: 'ACT-2026-0242', companyId: 'CMP-0004', spocId: 'SPOC-2026-0004',
    eventName: 'Lake Clean-up Drive', activityType: 'Environment',
    description: 'Shoreline clean-up at Pashan lake. Cancelled after the municipal corporation closed the access road for repairs.',
    location: 'Pashan lake shoreline', area: 'Baner',
    status: 'CANCELLED', date: '2026-08-26', startTime: '07:30', endTime: '11:00',
    volunteersNeeded: 50, volunteersRegistered: 31,
  },
];

function fromOtherEvent(raw) {
  return {
    eventId: raw.eventId,
    companyId: raw.companyId,
    adminId: ADMIN_ID,
    spocId: raw.spocId,
    eventName: raw.eventName,
    description: raw.description,
    location: raw.location,
    area: raw.area,
    activityType: raw.activityType,
    status: raw.status,
    eventDate: `${raw.date}T${raw.startTime}:00+05:30`,
    startTime: raw.startTime,
    endTime: raw.endTime,
    feedbackStart: `${raw.date}T${raw.endTime}:00+05:30`,
    feedbackEnd: `${raw.date}T23:59:00+05:30`,
    volunteersNeeded: raw.volunteersNeeded,
    volunteersRegistered: raw.volunteersRegistered,
  };
}

export const events = [
  ...volunteerActivities.map(fromVolunteerActivity),
  ...otherEvents.map(fromOtherEvent),
].sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

/** Statuses whose feedback is collectable or already collected. */
export const FEEDBACK_STATUSES = ['ONGOING', 'COMPLETED'];

/* ---------- Volunteers — company_users, role VOLUNTEER ------------------
   Sized to the company's biggest activity, so a 140-volunteer drive has
   140 people who could have attended it.
   ---------------------------------------------------------------------- */

function buildVolunteers() {
  const rand = makeRandom(20260821);
  const people = [
    /* The volunteer whose portal is the other half of this product. Same
       id, same email, same corporate partner — one person, two views. */
    {
      userId: rajesh.volunteerId,
      companyId: 'CMP-0001',
      role: 'VOLUNTEER',
      name: rajesh.volunteerName,
      initials: rajesh.initials,
      email: rajesh.volunteerEmail,
      phone: rajesh.volunteerPhone,
      area: rajesh.area,
      joinedOn: rajesh.joinedOn,
    },
  ];

  companies.forEach((company, companyIndex) => {
    const largest = events
      .filter((event) => event.companyId === company.companyId)
      .reduce((most, event) => Math.max(most, event.volunteersRegistered), 0);

    const count = Math.max(30, largest + between(rand, 8, 20));

    for (let i = 0; i < count; i += 1) {
      const first = pick(rand, FIRST_NAMES);
      const last = pick(rand, LAST_NAMES);
      const serial = companyIndex * 1000 + i + 1;
      people.push({
        userId: `VOL-2026-${String(serial).padStart(4, '0')}`,
        companyId: company.companyId,
        role: 'VOLUNTEER',
        name: `${first} ${last}`,
        initials: `${first[0]}${last[0]}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@${EMAIL_DOMAIN[company.companyId]}`,
        phone: `9${between(rand, 700000000, 899999999)}`,
        area: pick(rand, AREAS),
        joinedOn: `2025-${String(between(rand, 1, 12)).padStart(2, '0')}-${String(
          between(rand, 1, 28),
        ).padStart(2, '0')}`,
      });
    }
  });

  return people;
}

export const volunteers = buildVolunteers();

/** Everyone in company_users — both roles, one table, as in the schema. */
export const companyUsers = [...spocs, ...volunteers];

/* ---------- The comment pool -------------------------------------------
   Real sentences with real complaints in them, because the classifier has
   to have something to classify. Each carries the tone it was written in,
   so the generated 1-5 ratings and the free text never contradict each
   other — a 5-star row next to "we waited two hours" reads as fake, and a
   judge will spot it.
   ---------------------------------------------------------------------- */

const COMMENTS = {
  positive: [
    { language: 'EN', text: 'Seeing the children open the kits made the whole morning worth it. The school staff had everything ready for us.' },
    { language: 'EN', text: 'Very well organised from start to finish. The briefing was clear and the coordinators were helpful throughout.' },
    { language: 'EN', text: 'The team put my skills to good use and the impact on the community was obvious. I would join again.' },
    { language: 'EN', text: 'Started exactly on time and the materials were ready. Best run drive I have volunteered at.' },
    { language: 'EN', text: 'Excellent coordination on the day and the staff answered every question quickly. Genuinely meaningful work.' },
    { language: 'MR', text: 'सर्व नियोजन चांगले होते आणि कर्मचाऱ्यांची मदत उत्तम होती. मी पुन्हा सहभागी होईन.' },
    { language: 'HI', text: 'बहुत अच्छा आयोजन था, निर्देश स्पष्ट थे और समय पर शुरुआत हुई।' },
    { language: 'EN', text: 'Loved interacting with the students directly. The facilitator kept everyone engaged and nothing felt rushed.' },
  ],
  mixed: [
    { language: 'EN', text: 'Good cause and the on-ground team was helpful, but we ran out of gloves by 9 am and had to share.' },
    { language: 'EN', text: 'The packing line moved quickly once it got going. The return bus was late and eight of us waited outside until 7 pm.' },
    { language: 'EN', text: 'Meaningful activity and the community reception was warm, but the day-of briefing was rushed and half of us did not know what to do.' },
    { language: 'EN', text: 'Impact was clear, though the venue was cramped for the number of volunteers who turned up.' },
    { language: 'EN', text: 'Staff were supportive. Timing slipped by almost two hours and the lunch arrangement fell short.' },
    { language: 'MR', text: 'कार्यक्रम अर्थपूर्ण होता, पण वेळापत्रक उशिरा सुरू झाले आणि साहित्य कमी पडले.' },
    { language: 'EN', text: 'Great to be outdoors with the team, but there was a lot of waiting around before tools were handed out.' },
    { language: 'EN', text: 'The requirements were not briefed in advance so the first hour was confusing. After that it ran smoothly.' },
  ],
  negative: [
    { language: 'EN', text: 'We waited over an hour with nothing to do and no one told us where to report. The instructions were never sent beforehand.' },
    { language: 'EN', text: 'Very poor planning. It started late, the materials were short, and the return transport was never confirmed.' },
    { language: 'EN', text: 'My skills were completely underused. I stood around for most of the session while the staff sorted out the schedule.' },
    { language: 'EN', text: 'The venue was crowded and unsafe in places, and there was no first aid point that anyone could point to.' },
    { language: 'HI', text: 'समय पर कुछ भी शुरू नहीं हुआ, निर्देश स्पष्ट नहीं थे और सामग्री कम पड़ गई।' },
    { language: 'EN', text: 'Nobody coordinated the handover, so we duplicated work. Communication on the day was the weakest part.' },
    { language: 'MR', text: 'बस उशिरा आली आणि पाण्याची व्यवस्था नव्हती. नियोजन खूप कमी पडले.' },
  ],
  none: [{ language: 'EN', text: '' }],
};

/* Tone -> plausible rating band per theme group. Planning-heavy complaints
   should drag the planning themes down, not the impact score — that is the
   difference between data and noise. */
const BAND = {
  positive: { impact: [4, 5], planning: [4, 5], communication: [4, 5], support: [4, 5], recommendation: [4, 5] },
  mixed: { impact: [4, 5], planning: [2, 3], communication: [2, 4], support: [3, 4], recommendation: [3, 4] },
  negative: { impact: [2, 4], planning: [1, 2], communication: [1, 2], support: [1, 3], recommendation: [1, 2] },
  none: { impact: [3, 5], planning: [3, 4], communication: [3, 4], support: [3, 5], recommendation: [3, 5] },
};

/** Per-event tone mix. Some events genuinely went badly; that is the point. */
const TONE_MIX = {
  'ACT-2026-0224': ['negative', 'negative', 'mixed', 'mixed', 'positive', 'none'],
  'ACT-2026-0221': ['mixed', 'mixed', 'negative', 'positive', 'positive', 'none'],
  'ACT-2026-0203': ['negative', 'mixed', 'mixed', 'positive', 'none', 'none'],
  'ACT-2026-0230': ['positive', 'positive', 'mixed', 'positive', 'none', 'positive'],
  'ACT-2026-0227': ['positive', 'positive', 'positive', 'mixed', 'none', 'positive'],
  'ACT-2026-0218': ['positive', 'mixed', 'positive', 'none', 'positive', 'mixed'],
  'ACT-2026-0212': ['positive', 'positive', 'mixed', 'none', 'positive', 'none'],
  'ACT-2026-0206': ['mixed', 'positive', 'positive', 'none', 'mixed', 'positive'],
  DEFAULT: ['positive', 'mixed', 'positive', 'none', 'positive', 'mixed'],
};

const THEME_GROUP = Object.fromEntries(THEMES.map((theme) => [theme.themeCode, theme.group]));
export const THEME_CODES = THEMES.map((theme) => theme.themeCode);
export const THEME_LABEL = Object.fromEntries(
  THEMES.map((theme) => [theme.themeCode, theme.themeName.EN]),
);
export const THEME_QUESTION = Object.fromEntries(
  THEMES.map((theme) => [theme.themeCode, theme.question.EN]),
);

function ratingsFor(tone, rand) {
  const bands = BAND[tone];
  return Object.fromEntries(
    THEME_CODES.map((code) => {
      const [min, max] = bands[THEME_GROUP[code]] ?? [3, 4];
      return [code, between(rand, min, max)];
    }),
  );
}

/* ---------- Generated feedback ----------------------------------------
   One row per responding volunteer per completed or ongoing event. The
   response rate is deliberately NOT 100% — "registered but never gave
   feedback" is a real state the Foundation needs to see.
   ---------------------------------------------------------------------- */

function buildFeedback() {
  const rand = makeRandom(770021);
  const rows = [];
  let sequence = 200;

  events
    .filter((event) => FEEDBACK_STATUSES.includes(event.status))
    .forEach((event) => {
      /* Rajesh is excluded from the generated pool on purpose: his rows
         come from the volunteer app alone — the three he has already
         given, plus anything submitted live during the demo. Generating
         one for him too would produce two feedbacks for one (event,
         volunteer) pair, which the database makes impossible and which
         would make the response-rate arithmetic a lie. */
      const pool = volunteers.filter(
        (v) => v.companyId === event.companyId && v.userId !== rajesh.volunteerId,
      );
      if (!pool.length) return;

      const mix = TONE_MIX[event.eventId] ?? TONE_MIX.DEFAULT;
      /* Ongoing events are mid-collection, so their rate is naturally lower. */
      const rate = event.status === 'ONGOING' ? 0.34 : between(rand, 72, 93) / 100;
      const responders = Math.min(
        pool.length,
        Math.max(3, Math.round(event.volunteersRegistered * rate)),
      );
      const hours = Number(event.endTime.slice(0, 2));

      /* A different slice of the roster per event, so the same handful of
         people are not the only ones who ever respond. Walking the pool
         with `i` rather than a stride is what guarantees RULE 13: one
         registration, and therefore one feedback, per (event, volunteer).
         A stride whose step shares a factor with the pool length silently
         revisits the same few people — which is exactly the duplicate the
         database would reject. */
      const offset = between(rand, 0, pool.length - 1);

      for (let i = 0; i < responders; i += 1) {
        const person = pool[(offset + i) % pool.length];
        const tone = mix[i % mix.length];
        const comment = pick(rand, COMMENTS[tone]);
        const day = event.eventDate.slice(0, 10);
        const minute = between(rand, 0, 59);

        sequence += 1;
        rows.push({
          feedbackId: `FBK-${sequence}`,
          reference: `FB-2026-${String(sequence).padStart(4, '0')}`,
          registrationId: `REG-${event.eventId}-${person.userId}`,
          eventId: event.eventId,
          companyId: event.companyId,
          volunteerId: person.userId,
          volunteerName: person.name,
          volunteerInitials: person.initials,
          volunteerEmail: person.email,
          submittedAt: `${day}T${String(Math.min(23, hours + (i % 6))).padStart(2, '0')}:${String(
            minute,
          ).padStart(2, '0')}:00+05:30`,
          language: comment.language,
          overallComment: comment.text,
          themeComments: {},
          ratings: ratingsFor(tone, rand),
          processingStatus: 'COMPLETED',
          source: 'SEED',
        });
      }
    });

  return rows;
}

/* Rajesh's own three submissions, expressed as console rows. Same
   reference, same comment, same nine ratings the volunteer app shows. */
const rajeshFeedback = volunteerFeedback.map((record, index) => ({
  feedbackId: `FBK-RK-${index + 1}`,
  reference: record.reference,
  registrationId: `REG-${record.activityId}-${rajesh.volunteerId}`,
  eventId: record.activityId,
  companyId: 'CMP-0001',
  volunteerId: rajesh.volunteerId,
  volunteerName: rajesh.volunteerName,
  volunteerInitials: rajesh.initials,
  volunteerEmail: rajesh.volunteerEmail,
  submittedAt: record.submittedAt,
  language: record.language,
  overallComment: record.overallComment,
  themeComments: record.themeComments ?? {},
  ratings: record.ratings,
  processingStatus: 'COMPLETED',
  source: 'VOLUNTEER_APP',
}));

export const feedbackSeed = [...rajeshFeedback, ...buildFeedback()];

/* ---------- Volunteering needs raised with a SPOC -----------------------
   The other half of the volunteer app's "raise a need" flow. A need raised
   in the portal has to land somewhere a SPOC can actually see it.
   ---------------------------------------------------------------------- */

export const needsSeed = [
  {
    reference: 'REQ-2026-0024', eventId: 'ACT-2026-0231', companyId: 'CMP-0001',
    volunteerId: rajesh.volunteerId, volunteerName: rajesh.volunteerName,
    volunteerPhone: rajesh.volunteerPhone,
    categories: ['EQUIPMENT'], note: 'Please keep spare gloves in the larger size at the plantation site.',
    raisedAt: '2026-08-19T18:40:00+05:30', status: 'OPEN', response: null,
  },
  {
    reference: 'REQ-2026-0018', eventId: 'ACT-2026-0198', companyId: 'CMP-0001',
    volunteerId: rajesh.volunteerId, volunteerName: rajesh.volunteerName,
    volunteerPhone: rajesh.volunteerPhone,
    categories: ['TRANSPORT'], note: 'Three of us come from Wagholi — could the bus add a stop there?',
    raisedAt: '2026-07-18T10:05:00+05:30', status: 'RESOLVED',
    response: 'Wagholi stop added to the pickup route from August onwards.',
  },
  {
    reference: 'REQ-2026-0027', eventId: 'ACT-2026-0246', companyId: 'CMP-0002',
    volunteerId: 'VOL-1003', volunteerName: 'Sneha Patil', volunteerPhone: '9820114477',
    categories: ['TRANSPORT'], note: 'Is there a pickup from the Baner side, or should we reach the school directly?',
    raisedAt: '2026-08-20T09:15:00+05:30', status: 'OPEN', response: null,
  },
  {
    reference: 'REQ-2026-0029', eventId: 'ACT-2026-0249', companyId: 'CMP-0003',
    volunteerId: 'VOL-2007', volunteerName: 'Omkar Jadhav', volunteerPhone: '9822556688',
    categories: ['SAFETY', 'EQUIPMENT'], note: 'Last plantation had no first aid kit on site. Can we confirm one for this drive?',
    raisedAt: '2026-08-20T17:02:00+05:30', status: 'OPEN', response: null,
  },
  {
    reference: 'REQ-2026-0021', eventId: 'ACT-2026-0212', companyId: 'CMP-0002',
    volunteerId: 'VOL-1012', volunteerName: 'Gauri Sawant', volunteerPhone: '9820114488',
    categories: ['ACCESSIBILITY'], note: 'One of our volunteers uses a wheelchair — is the community hall step-free?',
    raisedAt: '2026-07-26T11:30:00+05:30', status: 'RESOLVED',
    response: 'Ramp access confirmed at the rear entrance; the ward office keeps it unlocked on event days.',
  },
];

/* ---------- Activity types, for filters --------------------------------- */

export const ACTIVITY_TYPES = ['Environment', 'Education', 'Health', 'Community'];

export const EVENT_STATUSES = [
  'UPCOMING',
  'REGISTRATION_OPEN',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
];

export const STATUS_LABEL = {
  UPCOMING: 'Upcoming',
  REGISTRATION_OPEN: 'Registration open',
  ONGOING: 'Happening now',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
