import { useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, ChevronDown, Home, MessageSquareText, User } from 'lucide-react';
import Logo from './Logo.jsx';
import EventsMenu from './EventsMenu.jsx';
import styles from './Navbar.module.css';

/**
 * One navbar, two shapes.
 *
 *  ≥768px  a top bar:    logo · Home · Events ▾ · History · Profile
 *  <768px  a top bar with logo and the profile chip, plus a BOTTOM tab bar
 *          with the same four destinations — thumb-reachable, labels always
 *          visible. No hamburger: hidden navigation is non-existent
 *          navigation for someone who will not go looking.
 */
export default function Navbar({ volunteer, counts = {} }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const desktopTrigger = useRef(null);
  const mobileTrigger = useRef(null);
  const { pathname } = useLocation();

  const eventsActive = pathname.startsWith('/volunteer/events');
  const linkClass = ({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`;

  const profileChip = (
    <NavLink
      to="/volunteer/profile"
      className={({ isActive }) => `${styles.profile} ${isActive ? styles.profileActive : ''}`}
    >
      <span className={styles.avatar} aria-hidden="true">
        {volunteer.initials}
      </span>
      <span className={styles.profileText}>
        <span className={styles.profileName}>{volunteer.shortName}</span>
        <span className={styles.profileOrg}>{volunteer.corporatePartner}</span>
      </span>
    </NavLink>
  );

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/volunteer" className={styles.brand} aria-label="Seva Sahayog volunteer home">
            <Logo />
          </Link>

          {/* Desktop tabs */}
          <nav className={styles.tabs} aria-label="Main">
            <NavLink to="/volunteer" end className={linkClass}>
              <Home className={styles.tabIcon} aria-hidden="true" />
              Home
            </NavLink>

            <div className={styles.tabWrap}>
              <button
                ref={desktopTrigger}
                type="button"
                className={`${styles.tab} ${eventsActive ? styles.tabActive : ''}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <CalendarDays className={styles.tabIcon} aria-hidden="true" />
                Events
                <ChevronDown
                  className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`}
                  aria-hidden="true"
                />
              </button>
              <EventsMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                triggerRef={desktopTrigger}
                counts={counts}
              />
            </div>

            <NavLink to="/volunteer/history" className={linkClass}>
              <MessageSquareText className={styles.tabIcon} aria-hidden="true" />
              History
            </NavLink>
          </nav>

          <div className={styles.profileSlot}>{profileChip}</div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className={styles.tabbar} aria-label="Main">
        <NavLink to="/volunteer" end className={linkClass}>
          <Home className={styles.tabIcon} aria-hidden="true" />
          Home
        </NavLink>

        <div className={styles.tabWrap}>
          <button
            ref={mobileTrigger}
            type="button"
            className={`${styles.tab} ${eventsActive ? styles.tabActive : ''}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <CalendarDays className={styles.tabIcon} aria-hidden="true" />
            Events
          </button>
          <EventsMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            triggerRef={mobileTrigger}
            placement="up"
            counts={counts}
          />
        </div>

        <NavLink to="/volunteer/history" className={linkClass}>
          <MessageSquareText className={styles.tabIcon} aria-hidden="true" />
          History
        </NavLink>

        <NavLink to="/volunteer/profile" className={linkClass}>
          <User className={styles.tabIcon} aria-hidden="true" />
          {volunteer.shortName}
        </NavLink>
      </nav>
    </>
  );
}
