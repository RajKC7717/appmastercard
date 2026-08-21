/* ============================================================
   DEMO DATA — frontend only.
   The ONLY place that fakes a backend. Field names mirror the Prisma
   schema so swapping in the real API is a change to lib/api.js alone.

     activityId          -> events.event_id
     name                -> events.event_name
     status              -> events.status (EventStatus)
     corporatePartner    -> companies.company_name
     volunteersNeeded    -> capacity target for the drive
     volunteersRegistered-> COUNT(event_registrations)
     isRegistered        -> this volunteer has an event_registrations row
     attendanceStatus    -> event_registrations.attendance_status
   ============================================================ */

/** The date the demo pretends "today" is. Events are laid out around it. */
export const TODAY = '2026-08-21';

/* ---------- The signed-in volunteer (company_users, role VOLUNTEER) ----- */

export const volunteer = {
  volunteerId: 'VOL-2026-0147',
  volunteerName: 'Rajesh Kulkarni',
  shortName: 'Rajesh',
  initials: 'RK',
  volunteerEmail: 'rajesh.kulkarni@amdocs.com',
  volunteerPhone: '9822014785',
  corporatePartner: 'Amdocs',
  area: 'Kharadi',
  joinedOn: '2025-03-14',
  hoursVolunteered: 46,
  preferredLanguage: 'EN',
};

/* ---------- The company SPOC (company_users, role SPOC) -----------------
   Deliberately NOT shown on event cards. The SPOC is who you go to with a
   need, not a label on a listing — so they appear once, in the section
   built for exactly that.
   ---------------------------------------------------------------------- */

export const spoc = {
  spocId: 'SPOC-2026-0009',
  name: 'Anjali Mehta',
  initials: 'AM',
  title: 'CSR Lead, Amdocs Pune',
  email: 'anjali.mehta@amdocs.com',
  phone: '9881204457',
  respondsWithin: 'Usually replies the same day',
};

/* ---------- Activities -------------------------------------------------
   ACTIVE   -> held today. Feedback is open.
   UPCOMING -> not yet held. Open for registration.
   PAST     -> finished earlier.
   ---------------------------------------------------------------------- */

export const activities = [
  /* ===== ACTIVE — attended today, feedback open ======================== */
  {
    activityId: 'ACT-2026-0231',
    name: 'Miyawaki Tree Plantation Drive',
    activityType: 'Environment',
    date: '2026-08-21',
    startTime: '08:00',
    endTime: '11:30',
    venue: 'EON IT Park grounds',
    area: 'Kharadi',
    corporatePartner: 'Amdocs',
    volunteersNeeded: 90,
    volunteersRegistered: 84,
    isRegistered: true,
    attendanceStatus: 'ATTENDED',
    description:
      'Planting 400 native saplings in a dense Miyawaki block behind the IT park, with the Seva Sahayog green team.',
    status: 'ACTIVE',
    attended: true,
    feedbackOpen: true,
  },
  {
    activityId: 'ACT-2026-0232',
    name: 'School Kit Assembly',
    activityType: 'Education',
    date: '2026-08-21',
    startTime: '10:00',
    endTime: '14:00',
    venue: 'Seva Sahayog collection centre',
    area: 'Hadapsar',
    corporatePartner: 'Amdocs',
    volunteersNeeded: 140,
    volunteersRegistered: 132,
    isRegistered: true,
    attendanceStatus: 'ATTENDED',
    description:
      'Assembly line packing of 2,000 school kits — notebooks, drawing book, compass box — for ZP schools in Purandar block.',
    status: 'ACTIVE',
    attended: true,
    feedbackOpen: true,
  },
  {
    /* Edge case: feedback ALREADY submitted. Proves duplicate prevention. */
    activityId: 'ACT-2026-0229',
    name: 'Menstrual Health Awareness Session',
    activityType: 'Health',
    date: '2026-08-21',
    startTime: '14:00',
    endTime: '16:30',
    venue: 'ZP Girls High School',
    area: 'Wagholi',
    corporatePartner: 'Amdocs',
    volunteersNeeded: 30,
    volunteersRegistered: 26,
    isRegistered: true,
    attendanceStatus: 'ATTENDED',
    description:
      'Adolescent-girl session on menstrual health and hygiene, run with the Seva Sahayog health educators.',
    status: 'ACTIVE',
    attended: true,
    feedbackOpen: true,
  },

  /* ===== UPCOMING — open for registration ============================== */
  {
    activityId: 'ACT-2026-0240',
    name: 'Digital Literacy Session',
    activityType: 'Education',
    date: '2026-08-28',
    startTime: '09:30',
    endTime: '12:30',
    venue: 'ZP Primary School, Ambegaon',
    area: 'Katraj',
    corporatePartner: 'Amdocs',
    volunteersNeeded: 24,
    volunteersRegistered: 18,
    isRegistered: false,
    attendanceStatus: null,
    description:
      'Teaching Std VII and VIII students to use a keyboard, a browser and a search box, on 20 refurbished laptops.',
    status: 'UPCOMING',
    attended: false,
    feedbackOpen: false,
  },
  {
    /* Edge case: already registered, so the card shows the registered state. */
    activityId: 'ACT-2026-0244',
    name: 'Learning Centre Wall Painting',
    activityType: 'Community',
    date: '2026-09-03',
    startTime: '08:30',
    endTime: '13:00',
    venue: 'Community Learning Centre 4',
    area: 'Yerawada',
    corporatePartner: 'Amdocs',
    volunteersNeeded: 45,
    volunteersRegistered: 40,
    isRegistered: true,
    attendanceStatus: 'REGISTERED',
    description:
      'Repainting two classrooms and the reading corner with educational murals — alphabet, numbers and a Marathi story wall.',
    status: 'UPCOMING',
    attended: false,
    feedbackOpen: false,
  },
  {
    activityId: 'ACT-2026-0251',
    name: 'Ration Kit Distribution',
    activityType: 'Community',
    date: '2026-09-12',
    startTime: '10:00',
    endTime: '15:00',
    venue: 'Landewadi community hall',
    area: 'Bhosari',
    corporatePartner: 'Amdocs',
    volunteersNeeded: 60,
    volunteersRegistered: 55,
    isRegistered: false,
    attendanceStatus: null,
    description:
      'Handing over monthly ration kits to 300 registered families, with verification against the beneficiary register.',
    status: 'UPCOMING',
    attended: false,
    feedbackOpen: false,
  },
  {
    /* Edge case: full. Register must be refused, clearly, not by failing. */
    activityId: 'ACT-2026-0258',
    name: 'Blood Donation Camp',
    activityType: 'Health',
    date: '2026-09-19',
    startTime: '09:00',
    endTime: '16:00',
    venue: 'Phase 2 tech park atrium',
    area: 'Hinjewadi',
    corporatePartner: 'Amdocs',
    volunteersNeeded: 25,
    volunteersRegistered: 25,
    isRegistered: false,
    attendanceStatus: null,
    description:
      'Camp run with Jankalyan Blood Bank. Volunteers handle registration, refreshments and the post-donation rest area.',
    status: 'UPCOMING',
    attended: false,
    feedbackOpen: false,
  },

  /* ===== PAST ========================================================== */
  {
    activityId: 'ACT-2026-0198',
    name: 'School Kit Distribution',
    activityType: 'Education',
    date: '2026-07-24',
    startTime: '09:00',
    endTime: '13:30',
    venue: 'ZP School, Sus village',
    area: 'Baner',
    corporatePartner: 'Amdocs',
    volunteersNeeded: 65,
    volunteersRegistered: 62,
    isRegistered: true,
    attendanceStatus: 'ATTENDED',
    description:
      'Handing 780 assembled kits to students across four ZP schools, with a short reading session in each classroom.',
    status: 'PAST',
    attended: true,
    feedbackOpen: false,
  },
  {
    activityId: 'ACT-2026-0176',
    name: 'Miyawaki Plantation — Round 2',
    activityType: 'Environment',
    date: '2026-07-10',
    startTime: '07:30',
    endTime: '11:00',
    venue: 'Warje riverside plot',
    area: 'Warje',
    corporatePartner: 'Amdocs',
    volunteersNeeded: 75,
    volunteersRegistered: 71,
    isRegistered: true,
    attendanceStatus: 'ATTENDED',
    description:
      'Second-round maintenance and infill planting on last season’s Miyawaki block along the Mutha riverside.',
    status: 'PAST',
    attended: true,
    feedbackOpen: false,
  },
  {
    /* Attended but never gave feedback. Kept in the data because it is a real
       record — and hidden from the Past list, which only shows activities the
       volunteer actually has feedback for. */
    activityId: 'ACT-2026-0150',
    name: 'Adolescent Girls Workshop',
    activityType: 'Health',
    date: '2026-06-21',
    startTime: '10:00',
    endTime: '14:00',
    venue: 'Nehru Nagar centre',
    area: 'Pimpri',
    corporatePartner: 'Amdocs',
    volunteersNeeded: 40,
    volunteersRegistered: 34,
    isRegistered: true,
    attendanceStatus: 'ATTENDED',
    description:
      'Career-awareness and confidence workshop for 120 girls from the Seva Sahayog adolescent programme.',
    status: 'PAST',
    attended: true,
    feedbackOpen: false,
  },
  {
    activityId: 'ACT-2026-0121',
    name: 'Diwali Kit Packing',
    activityType: 'Community',
    date: '2026-05-30',
    startTime: '11:00',
    endTime: '16:00',
    venue: 'Chinchwad godown',
    area: 'Chinchwad',
    corporatePartner: 'Amdocs',
    volunteersNeeded: 50,
    volunteersRegistered: 48,
    isRegistered: true,
    attendanceStatus: 'ATTENDED',
    description:
      'Packing sweets, a diya set and a new set of clothes into 900 festival kits for community learning centre families.',
    status: 'PAST',
    attended: true,
    feedbackOpen: false,
  },
];

/* ---------- Feedback already given -------------------------------------
   Shaped exactly like a submission: a rating per themeCode, an optional
   reason for every low rating, and the verbatim overall comment.
   ---------------------------------------------------------------------- */

export const seededFeedback = [
  {
    reference: 'FB-2026-0102',
    activityId: 'ACT-2026-0198',
    submittedAt: '2026-07-24T14:12:00+05:30',
    status: 'COMPLETE',
    language: 'EN',
    ratings: {
      IMPACT: 5,
      TIMELINE_PLANNING: 4,
      REQUIREMENTS_PLANNING: 5,
      FINANCIAL_PLANNING: 4,
      PRE_EVENT_COMMUNICATION: 5,
      DAY_OF_COMMUNICATION: 4,
      SKILL_UTILIZATION: 4,
      STAFF_SUPPORT: 5,
      PARTICIPATION_LIKELIHOOD: 5,
    },
    themeComments: {},
    overallComment:
      'Seeing the children open the kits made the whole morning worth it. The school staff had everything ready for us.',
  },
  {
    reference: 'FB-2026-0089',
    activityId: 'ACT-2026-0176',
    submittedAt: '2026-07-10T11:40:00+05:30',
    status: 'COMPLETE',
    language: 'EN',
    ratings: {
      IMPACT: 5,
      TIMELINE_PLANNING: 3,
      REQUIREMENTS_PLANNING: 2,
      FINANCIAL_PLANNING: 3,
      PRE_EVENT_COMMUNICATION: 4,
      DAY_OF_COMMUNICATION: 2,
      SKILL_UTILIZATION: 4,
      STAFF_SUPPORT: 4,
      PARTICIPATION_LIKELIHOOD: 4,
    },
    themeComments: {
      REQUIREMENTS_PLANNING: 'We ran out of gloves by 9 am and had to share.',
      DAY_OF_COMMUNICATION:
        'The briefing was rushed — half of us did not know how deep to dig.',
    },
    overallComment:
      'Good turnout and the plot was well prepared beforehand. Just brief us properly before we start.',
  },
  {
    reference: 'FB-2026-0041',
    activityId: 'ACT-2026-0121',
    submittedAt: '2026-05-30T16:25:00+05:30',
    status: 'COMPLETE',
    language: 'EN',
    ratings: {
      IMPACT: 4,
      TIMELINE_PLANNING: 2,
      REQUIREMENTS_PLANNING: 3,
      FINANCIAL_PLANNING: 3,
      PRE_EVENT_COMMUNICATION: 3,
      DAY_OF_COMMUNICATION: 3,
      SKILL_UTILIZATION: 3,
      STAFF_SUPPORT: 2,
      PARTICIPATION_LIKELIHOOD: 3,
    },
    themeComments: {
      TIMELINE_PLANNING: 'It ran two hours past the stated end time.',
      STAFF_SUPPORT: 'Nobody could tell us when the return bus would arrive.',
    },
    overallComment:
      'The packing line itself moved quickly once it got going. The return bus never came and eight of us waited outside the godown until 7 pm. Please confirm transport before the next one.',
  },
];

/* ---------- Volunteering needs raised with the SPOC ---------------------
   Category ids are InsightTheme enum values, so a need and an AI-detected
   aspect from a comment land in the same reporting bucket.
   ---------------------------------------------------------------------- */

export const needCategories = [
  {
    id: 'TRANSPORT',
    icon: 'bus',
    title: { EN: 'Transport', HI: 'यातायात', MR: 'वाहतूक' },
    hint: 'Pickup, drop-off or the route to the venue',
  },
  {
    id: 'EQUIPMENT',
    icon: 'tool',
    title: { EN: 'Materials and equipment', HI: 'सामग्री और उपकरण', MR: 'साहित्य व उपकरणे' },
    hint: 'Gloves, tools, kits — anything short on site',
  },
  {
    id: 'SAFETY',
    icon: 'shield',
    title: { EN: 'Safety and access', HI: 'सुरक्षा और पहुँच', MR: 'सुरक्षा व प्रवेश' },
    hint: 'Site safety, first aid, or an accessibility need',
  },
];

export const seededNeeds = [
  {
    reference: 'REQ-2026-0018',
    activityId: 'ACT-2026-0198',
    categories: ['TRANSPORT'],
    note: 'Three of us come from Wagholi — could the bus add a stop there?',
    raisedAt: '2026-07-18T10:05:00+05:30',
    status: 'RESOLVED',
    response: 'Wagholi stop added to the pickup route from August onwards.',
  },
  {
    reference: 'REQ-2026-0024',
    activityId: 'ACT-2026-0231',
    categories: ['EQUIPMENT'],
    note: 'Please keep spare gloves in the larger size at the plantation site.',
    raisedAt: '2026-08-19T18:40:00+05:30',
    status: 'OPEN',
    response: null,
  },
];

/* ---------- The closed loop --------------------------------------------
   "Last time volunteers said X, we changed Y." Shown on the confirmation.
   ---------------------------------------------------------------------- */

export const closedLoop = {
  Environment: {
    said: 'the day-of briefing was rushed and it was unclear how deep to plant',
    changed: 'added a 10-minute walkthrough and a demo pit before every drive',
  },
  Education: {
    said: 'the requirements were not briefed in advance and kits arrived late',
    changed: 'moved material loading to the evening before',
  },
  Health: {
    said: 'their skills were underused in large group sessions',
    changed: 'cut the group size so every volunteer now leads one table',
  },
  Community: {
    said: 'the timeline slipped and return transport was unreliable',
    changed: 'made pickup time a confirmed field on every activity record',
  },
};
