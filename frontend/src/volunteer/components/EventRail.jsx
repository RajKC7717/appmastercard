import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import EventCard from './EventCard.jsx';
import styles from './EventRail.module.css';

/**
 * A horizontally sliding row of event cards.
 *
 * The scroller is a real overflow container with CSS scroll-snap, so it
 * works with a thumb, a trackpad, a mouse wheel and the keyboard on its own.
 * The arrow buttons are an addition for mouse users, not the mechanism —
 * they disable themselves at each end rather than silently doing nothing.
 */
export default function EventRail({ title, caption, events, seeAllTo, emptyMessage }) {
  const scrollerRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setEdges({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft >= maxScroll - 2,
    });
  }, []);

  useEffect(() => {
    measure();
    const el = scrollerRef.current;
    if (!el) return undefined;

    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [measure, events.length]);

  const slide = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    /* Move by one card plus its gap, so a card never ends up half-visible. */
    const step = el.querySelector('[data-card]')?.clientWidth ?? 300;
    el.scrollBy({ left: direction * (step + 16), behavior: 'smooth' });
  };

  return (
    <section className={styles.rail} aria-labelledby={`rail-${title.replace(/\s+/g, '-')}`}>
      <header className={styles.header}>
        <div className={styles.headingBlock}>
          <h2 id={`rail-${title.replace(/\s+/g, '-')}`} className={styles.title}>
            {title}
            <span className={styles.count}>{events.length}</span>
          </h2>
          <p className={styles.caption}>{caption}</p>
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => slide(-1)}
            disabled={edges.start}
          >
            <ChevronLeft aria-hidden="true" />
            <span className="srOnly">Scroll {title} left</span>
          </button>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => slide(1)}
            disabled={edges.end}
          >
            <ChevronRight aria-hidden="true" />
            <span className="srOnly">Scroll {title} right</span>
          </button>
          {seeAllTo && (
            <Link to={seeAllTo} className={styles.seeAll}>
              See all
              <ArrowRight className={styles.seeAllIcon} aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>

      {events.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <div className={styles.scroller} ref={scrollerRef} tabIndex={0} role="group">
          {events.map((activity) => (
            <div key={activity.activityId} data-card className={styles.slide}>
              <EventCard activity={activity} layout="rail" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
