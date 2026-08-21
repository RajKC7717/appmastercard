import { useSearchParams } from 'react-router-dom';
import { CalendarX } from 'lucide-react';
import EventCard from '../components/EventCard.jsx';
import { EmptyState, EventCardSkeleton } from '../components/ui/States.jsx';
import Button from '../components/ui/Button.jsx';
import EVENT_FILTERS from '../data/eventFilters.js';
import { useVolunteer } from '../state/VolunteerProvider.jsx';
import styles from './EventsPage.module.css';

const COPY = {
  current: {
    heading: 'Active & upcoming',
    caption:
      'Today’s activities are marked in green — feedback for those closes at midnight. The rest are open for registration.',
    empty: 'Nothing scheduled right now. Your SPOC adds you to a drive and it appears here.',
  },
  past: {
    heading: 'Past events',
    caption: 'Activities you attended and gave feedback for, newest first.',
    empty: 'Once you give feedback for an activity, it is listed here.',
  },
};

/**
 * The destination behind the Events dropdown. The filter lives in the URL, so
 * the menu items are real, shareable, back-button-safe addresses rather than
 * hidden states of one page.
 */
export default function EventsPage() {
  const [params, setParams] = useSearchParams();
  const { status, current, past, counts } = useVolunteer();

  const requested = params.get('filter');
  const filter = COPY[requested] ? requested : 'current';
  const copy = COPY[filter];
  const loading = status === 'loading';

  const events = filter === 'past' ? past : current;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.heading}>{copy.heading}</h1>
        <p className={styles.caption}>{copy.caption}</p>
      </header>

      {/* The same destinations as the dropdown, visible on the page itself —
          so someone who arrived by link can still see the other one. */}
      <div className={styles.filters} role="tablist" aria-label="Filter events">
        {EVENT_FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={`${styles.filter} ${filter === key ? styles.filterActive : ''}`}
            onClick={() => setParams({ filter: key })}
          >
            <Icon className={styles.filterIcon} aria-hidden="true" />
            {label.replace(' events', '')}
            <span className={styles.filterCount}>{counts[key] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.grid}>
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title={filter === 'past' ? 'No past feedback yet' : 'Nothing scheduled'}
          message={copy.empty}
          action={
            filter === 'past' && (
              <Button to="/volunteer/events?filter=current" variant="secondary">
                See what is coming up
              </Button>
            )
          }
        />
      ) : (
        <div className={styles.grid}>
          {events.map((activity) => (
            <EventCard key={activity.activityId} activity={activity} layout="stack" />
          ))}
        </div>
      )}
    </div>
  );
}
