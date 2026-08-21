import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EVENT_FILTERS from '../data/eventFilters.js';
import styles from './EventsMenu.module.css';

/**
 * Dropdown for the Events tab. Closes on Escape, on outside click and on
 * choosing an item, and returns focus to the trigger so keyboard users are
 * never stranded.
 */
export default function EventsMenu({ open, onClose, triggerRef, placement = 'down', counts = {} }) {
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (
        !menuRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        onClose();
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  const choose = (key) => {
    onClose();
    navigate(`/volunteer/events?filter=${key}`);
  };

  return (
    <div
      ref={menuRef}
      className={`${styles.menu} ${placement === 'up' ? styles.up : styles.down}`}
      role="menu"
      aria-label="Events"
    >
      {EVENT_FILTERS.map(({ key, label, hint, icon: Icon }) => (
        <button
          key={key}
          type="button"
          role="menuitem"
          className={styles.item}
          onClick={() => choose(key)}
        >
          <span className={styles.itemIcon}>
            <Icon aria-hidden="true" />
          </span>
          <span className={styles.itemText}>
            <span className={styles.itemLabel}>
              {label}
              {counts[key] != null && <span className={styles.count}>{counts[key]}</span>}
            </span>
            <span className={styles.itemHint}>{hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
