import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { useAuth } from '../../auth/AuthProvider.jsx';
import styles from './ConsoleLayout.module.css';

/**
 * The staff shell, shared by the NGO admin console and the corporate SPOC
 * console. Both are Register B — a person at a desk asking "what needs me
 * today?" — so both get the same furniture:
 *
 *   240px sidebar, labels always visible, on the left
 *   a top bar carrying only global things: who you are, and signing out
 *   the routed page filling the rest
 *
 * Labels, not icons alone. A coordinator opens this a few times a week,
 * not hourly, and will not have memorised anyone's icon set. Clarity beats
 * compactness at this frequency of use.
 *
 * Below 768px the sidebar pattern stops working, so it becomes a drawer
 * behind a button that says "Menu" in words. A coordinator on a phone is
 * an edge case here, not the design target — but "unusable" is not an
 * acceptable way to treat an edge case.
 */
export default function ConsoleLayout({ nav, sub, appName }) {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* A page change closes the drawer and starts at the top, rather than
     halfway down the previous page with the menu still covering it. */
  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  const linkClass = ({ isActive }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

  const navigation = (
    <nav className={styles.nav} aria-label="Sections">
      {nav.map((group) => (
        <div key={group.title} className={styles.navGroup}>
          <p className={styles.navTitle}>{group.title}</p>
          {group.items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className={styles.navIcon} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link to={nav[0].items[0].to} className={styles.brand}>
          <Logo sub={sub} />
        </Link>
        {navigation}
        <div className={styles.sidebarFoot}>
          <p className={styles.footNote}>{appName}</p>
        </div>
      </aside>

      <div className={styles.body}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((open) => !open)}
          >
            {drawerOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            Menu
          </button>

          <span className={styles.topbarBrand}>{appName}</span>

          <div className={styles.account}>
            <span className={styles.avatar} aria-hidden="true">
              {user?.initials}
            </span>
            <span className={styles.accountText}>
              <span className={styles.accountName}>{user?.name}</span>
              <span className={styles.accountRole}>
                {user?.companyName ? `${user.companyName} · ` : ''}
                {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'STAFF' ? 'Staff' : 'SPOC'}
              </span>
            </span>
            <button type="button" className={styles.signOut} onClick={signOut}>
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </header>

        {drawerOpen && (
          <div className={styles.drawer}>
            {navigation}
            <button type="button" className={styles.drawerSignOut} onClick={signOut}>
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </div>
        )}

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
