import { CalendarDays, FileBarChart, Inbox, LayoutDashboard, Tags } from 'lucide-react';
import ConsoleLayout from '../shared/console/ConsoleLayout.jsx';
import { ConsoleDataProvider } from '../shared/console/ConsoleDataProvider.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';

/**
 * The corporate SPOC console.
 *
 * Structurally identical to the admin console — same shell, same tables,
 * same cards — with one difference that decides everything: the data
 * provider is scoped to the SPOC's own companyId. A SPOC at Amdocs sees
 * Amdocs activities, Amdocs volunteers and Amdocs feedback, and there is
 * no screen, filter or URL in this app that widens that.
 *
 * That scoping happens once, here. The server enforces the same rule
 * independently on every request, so a SPOC cannot reach another
 * partner's data by editing a URL either.
 */
const NAV = [
  {
    title: 'Your company',
    items: [
      { to: '/spoc', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/spoc/activities', label: 'Activities', icon: CalendarDays },
      { to: '/spoc/requests', label: 'Volunteer requests', icon: Inbox },
    ],
  },
  {
    title: 'Experience',
    items: [
      { to: '/spoc/insights', label: 'Feedback themes', icon: Tags },
      { to: '/spoc/reports', label: 'Reports', icon: FileBarChart },
    ],
  },
];

export default function SpocLayout() {
  const { user } = useAuth();

  return (
    <ConsoleDataProvider companyId={user?.companyId}>
      <ConsoleLayout
        nav={NAV}
        sub="Corporate SPOC"
        appName={`${user?.companyName ?? 'Corporate'} volunteering`}
      />
    </ConsoleDataProvider>
  );
}
