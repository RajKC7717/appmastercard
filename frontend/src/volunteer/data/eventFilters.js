import { CalendarCheck, CalendarClock } from 'lucide-react';

/**
 * The destinations behind the Events tab.
 *
 * Active and upcoming are ONE destination on purpose. From the volunteer's
 * side the distinction is the NGO's, not theirs: both are activities that
 * still want something from them — feedback for the one that just finished,
 * a registration for the one that has not. Splitting them made the same
 * person check two lists to answer one question.
 */
const EVENT_FILTERS = [
  {
    key: 'current',
    label: 'Active & upcoming',
    hint: 'Today’s activities and the ones ahead',
    icon: CalendarClock,
  },
  {
    key: 'past',
    label: 'Past events',
    hint: 'Activities you have given feedback for',
    icon: CalendarCheck,
  },
];

export default EVENT_FILTERS;
