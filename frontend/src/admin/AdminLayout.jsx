import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  Tags,
  FileBarChart,
} from 'lucide-react';
import ConsoleLayout from '../shared/console/ConsoleLayout.jsx';
import { ConsoleDataProvider } from '../shared/console/ConsoleDataProvider.jsx';

/**
 * The NGO admin console shell. No companyId is passed to the data
 * provider, so this app sees every corporate partner — that scope
 * difference is the entire distinction between this console and the
 * SPOC's, and it lives in one line rather than in every screen.
 *
 * The sidebar is grouped by what someone came here to do, not by which
 * database table a page reads. "Today" is first because it is where a
 * coordinator lands, and it answers "what needs me?" before anything
 * else on the screen.
 */
const NAV = [
  {
    title: 'Work',
    items: [
      { to: '/admin', label: 'Today', icon: LayoutDashboard, end: true },
      { to: '/admin/activities', label: 'Activities', icon: CalendarDays },
      { to: '/admin/feedback', label: 'Feedback', icon: MessageSquareText },
    ],
  },
  {
    title: 'Learn from it',
    items: [
      { to: '/admin/themes', label: 'Themes', icon: Tags },
      { to: '/admin/action-plans', label: 'Action plans', icon: Sparkles },
      { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
    ],
  },
  {
    title: 'People',
    items: [{ to: '/admin/partners', label: 'Corporate partners', icon: Building2 }],
  },
];

export default function AdminLayout() {
  return (
    <ConsoleDataProvider>
      <ConsoleLayout nav={NAV} sub="NGO admin" appName="Seva Sahayog admin console" />
    </ConsoleDataProvider>
  );
}
