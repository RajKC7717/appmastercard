// DEPRECATED as of the console rebuild. The single source of activity data
// is now shared/data/orgData.js, which is shaped to the Prisma schema and is
// what every admin and SPOC screen reads. This file is kept only because the
// action-plan mock in adminActionPlans.js was written against its 1..5 keys;
// the mapping from those keys to real event ids lives in actionPlanIndex.js.
// Do not import this in a new screen.
// PLACEHOLDER mock data — API_CONTRACT.md has no rows yet for activities/feedback endpoints.
// Swap this for a real services/activityService.js call once the backend team adds those rows.
// feedbackStatus/feedbackDeadline model the automation trigger from the Action Plan spec:
// the AI action plan is only generated once feedbackStatus becomes 'closed'.
export const activities = [
  {
    id: 1,
    category: 'Waste Management',
    title: 'Waste Segregation Drive',
    date: '21 Aug 2026',
    partner: 'Infosys',
    volunteers: 86,
    responses: 72,
    rating: 4.2,
    responseRate: 84,
    issues: 2,
    feedbackStatus: 'closed',
    feedbackDeadline: '23 Aug 2026, 11:59 PM',
    sectionRatings: [
      { label: 'Activity Organization', rating: 3.9 },
      { label: 'Volunteer Coordination', rating: 4.3 },
      { label: 'Activity Timing', rating: 3.8 },
      { label: 'Overall Experience', rating: 4.2 },
    ],
    recentFeedback: [
      { initials: 'RS', name: 'Rahul Sharma', rating: 4, comment: 'Well organized, but the segregation instructions could have been clearer up front.', timeAgo: '2 hours ago' },
      { initials: 'AP', name: 'Ananya Patel', rating: 3, comment: 'Good cause, timing at the start felt a bit rushed.', timeAgo: '5 hours ago' },
    ],
  },
  {
    id: 2,
    category: 'Education',
    title: 'Education Support Program',
    date: '19 Aug 2026',
    partner: 'TCS',
    volunteers: 64,
    responses: 58,
    rating: 4.7,
    responseRate: 91,
    issues: 0,
    feedbackStatus: 'closed',
    feedbackDeadline: '21 Aug 2026, 11:59 PM',
    sectionRatings: [
      { label: 'Activity Organization', rating: 4.6 },
      { label: 'Volunteer Coordination', rating: 4.8 },
      { label: 'Activity Timing', rating: 4.6 },
      { label: 'Overall Experience', rating: 4.7 },
    ],
    recentFeedback: [
      { initials: 'MK', name: 'Meera Kulkarni', rating: 5, comment: 'The activity was well organized and the team coordination was excellent.', timeAgo: '1 hour ago' },
      { initials: 'VS', name: 'Vikram Singh', rating: 5, comment: 'Genuinely felt like we made a difference. Would sign up again.', timeAgo: '4 hours ago' },
    ],
  },
  {
    id: 3,
    category: 'Women Empowerment',
    title: 'Women Digital Literacy Workshop',
    date: '17 Aug 2026',
    partner: 'Accenture',
    volunteers: 52,
    responses: 46,
    rating: 4.4,
    responseRate: 88,
    issues: 1,
    feedbackStatus: 'closed',
    feedbackDeadline: '19 Aug 2026, 11:59 PM',
    sectionRatings: [
      { label: 'Activity Organization', rating: 4.3 },
      { label: 'Volunteer Coordination', rating: 4.5 },
      { label: 'Activity Timing', rating: 3.9 },
      { label: 'Overall Experience', rating: 4.4 },
    ],
    recentFeedback: [
      { initials: 'NP', name: 'Neha Prasad', rating: 4, comment: 'Participants were eager to learn, wish we had more one-on-one time.', timeAgo: '3 hours ago' },
      { initials: 'RJ', name: 'Rohan Joshi', rating: 5, comment: 'Great energy from both volunteers and participants throughout.', timeAgo: '6 hours ago' },
    ],
  },
  {
    id: 4,
    category: 'Environment',
    title: 'Tree Plantation Activity',
    date: '15 Aug 2026',
    partner: 'Wipro',
    volunteers: 91,
    responses: 80,
    rating: 4.1,
    responseRate: 88,
    issues: 3,
    feedbackStatus: 'open',
    feedbackDeadline: '24 Aug 2026, 11:59 PM',
    sectionRatings: [
      { label: 'Activity Organization', rating: 4.2 },
      { label: 'Volunteer Coordination', rating: 3.9 },
      { label: 'Activity Timing', rating: 3.6 },
      { label: 'Overall Experience', rating: 4.1 },
    ],
    recentFeedback: [
      { initials: 'SK', name: 'Sanjay Kumar', rating: 3, comment: 'Meaningful activity, but we waited a long time for tools to be handed out.', timeAgo: '2 hours ago' },
      { initials: 'DT', name: 'Divya Thomas', rating: 4, comment: 'Loved being outdoors and planting with the team.', timeAgo: '7 hours ago' },
    ],
  },
  {
    id: 5,
    category: 'Community Development',
    title: 'Community Development Camp',
    date: '12 Aug 2026',
    partner: 'Mastercard',
    volunteers: 73,
    responses: 61,
    rating: 4.5,
    responseRate: 84,
    issues: 0,
    feedbackStatus: 'closed',
    feedbackDeadline: '14 Aug 2026, 11:59 PM',
    sectionRatings: [
      { label: 'Activity Organization', rating: 4.5 },
      { label: 'Volunteer Coordination', rating: 4.3 },
      { label: 'Activity Timing', rating: 4.6 },
      { label: 'Overall Experience', rating: 4.5 },
    ],
    recentFeedback: [
      { initials: 'PA', name: 'Priya Agarwal', rating: 5, comment: 'One of the best-organized camps I have volunteered at.', timeAgo: '1 hour ago' },
      { initials: 'KV', name: 'Karan Verma', rating: 4, comment: 'Great community reception, coordination with the local team was smooth.', timeAgo: '5 hours ago' },
    ],
  },
]

export const categories = ['All Activities', ...new Set(activities.map((activity) => activity.category))]
