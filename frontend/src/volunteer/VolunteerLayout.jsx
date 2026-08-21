import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import { ErrorState } from '../shared/ui/States.jsx';
import { useVolunteer } from './state/VolunteerProvider.jsx';
import { volunteer as fallbackVolunteer } from './data/demoData.js';
import styles from './VolunteerLayout.module.css';

/**
 * The portal shell: navbar on top (bottom tabs on mobile) and the routed
 * page below. The feedback flow renders OUTSIDE this shell — it is a
 * single-purpose task screen and navigation chrome would only compete
 * with the one thing the volunteer is there to do.
 */
export default function VolunteerLayout() {
  const { volunteer, counts, status, error, reload } = useVolunteer();
  const { pathname } = useLocation();

  /* A tab change should start at the top, not halfway down the last page. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className={styles.shell}>
      {/* The navbar renders immediately with the session identity, so the
          chrome never flickers or shifts while the lists are loading. */}
      <Navbar volunteer={volunteer ?? fallbackVolunteer} counts={counts} />

      <main className={styles.main}>
        {status === 'error' ? (
          <div className={styles.errorWrap}>
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          Seva Sahayog Foundation · Volunteer Experience Platform
        </p>
        <p className={styles.footerNote}>
          Your feedback goes straight to the activity coordinator.
        </p>
      </footer>
    </div>
  );
}
