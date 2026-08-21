import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone } from 'lucide-react';
import Button from '../../shared/ui/Button.jsx';
import DataTable, { nextSort, sortRows } from '../../shared/ui/DataTable.jsx';
import { SearchInput } from '../../shared/ui/Form.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/States.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { summariseCompany } from '../../shared/lib/analytics.js';
import { spocForCompany, volunteers } from '../../shared/data/orgData.js';
import { formatDate } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * Corporate partners, their SPOC, and how each partnership is actually
 * going — the comparison across companies the problem statement names
 * first among the things the Foundation cannot do.
 *
 * The SPOC's phone number is a tap-to-call link, because a coordinator
 * looking at a partner whose response rate has collapsed is about to ring
 * someone, and WhatsApp and a phone call are the notification layer in
 * this context whatever the software does.
 */
export default function AdminPartners() {
  const navigate = useNavigate();
  const { status, error, reload, companies, events, feedback } = useConsoleData();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'eventCount', direction: 'desc' });

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return companies
      .map((company) => {
        const summary = summariseCompany(company, events, feedback);
        const spoc = spocForCompany(company.companyId);
        return {
          ...summary,
          spocName: spoc?.name ?? null,
          spocEmail: spoc?.email ?? null,
          spocPhone: spoc?.phone ?? null,
          volunteerCount: volunteers.filter((person) => person.companyId === company.companyId)
            .length,
        };
      })
      .filter((company) =>
        needle
          ? `${company.companyName} ${company.spocName ?? ''}`.toLowerCase().includes(needle)
          : true,
      );
  }, [companies, events, feedback, query]);

  const columns = useMemo(
    () => [
      { key: 'companyName', label: 'Corporate partner', sortable: true },
      {
        key: 'spocName',
        label: 'SPOC',
        sortable: true,
        render: (row) =>
          row.spocName ? (
            <span className={styles.stackTight}>
              <span>{row.spocName}</span>
              <span className={styles.muted}>
                <a href={`tel:+91${row.spocPhone}`}>
                  <Phone size={12} aria-hidden="true" /> {row.spocPhone}
                </a>
              </span>
            </span>
          ) : (
            <span className={styles.muted}>Not assigned</span>
          ),
      },
      { key: 'volunteerCount', label: 'Volunteers', align: 'right', sortable: true },
      { key: 'eventCount', label: 'Activities', align: 'right', sortable: true },
      { key: 'upcomingCount', label: 'Upcoming', align: 'right', sortable: true },
      { key: 'responses', label: 'Responses', align: 'right', sortable: true },
      {
        key: 'responseRate',
        label: 'Response rate',
        align: 'right',
        sortable: true,
        render: (row) => (
          <span className={row.responseRate < 60 ? styles.countWarn : undefined}>
            {row.responseRate}%
          </span>
        ),
      },
      {
        key: 'avgRating',
        label: 'Score',
        align: 'right',
        sortable: true,
        render: (row) => (row.avgRating == null ? '—' : `${row.avgRating}/5`),
      },
      {
        key: 'onboardedOn',
        label: 'Partner since',
        sortable: true,
        render: (row) => formatDate(row.onboardedOn),
      },
    ],
    [],
  );

  const sorted = sortRows(rows, columns, sort);

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const weakest = [...rows]
    .filter((row) => row.responses > 0)
    .sort((a, b) => a.responseRate - b.responseRate)[0];

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.title}>Corporate partners</h1>
          <p className={styles.caption}>
            Every company the Foundation runs activities with, its SPOC, and how much the
            volunteers there are telling us. Click a partner to see its activities.
          </p>
        </div>
        <div className={styles.headActions}>
          <SearchInput
            value={query}
            onChange={setQuery}
            label="Find a partner"
            placeholder="Company or SPOC name"
          />
        </div>
      </header>

      {status === 'loading' ? (
        <Skeleton height={280} radius="md" />
      ) : (
        <>
          <DataTable
            caption="Corporate partners"
            columns={columns}
            rows={sorted}
            getRowKey={(row) => row.companyId}
            onRowClick={(row) => navigate(`/admin/activities?company=${row.companyId}`)}
            sort={sort}
            onSort={(key) => setSort((current) => nextSort(current, key))}
            empty={
              <EmptyState
                icon={Building2}
                title="No partner by that name"
                message="Clear the search to see every corporate partner."
                action={
                  <Button variant="secondary" onClick={() => setQuery('')}>
                    Clear search
                  </Button>
                }
              />
            }
          />

          {weakest && (
            <p className={styles.finding}>
              {weakest.companyName} has the lowest response rate at {weakest.responseRate}% —{' '}
              {weakest.spocName
                ? `worth a call to ${weakest.spocName} before the next activity, because a low rate makes every score for that partner unreliable.`
                : 'and no SPOC is assigned, which is almost certainly why.'}
            </p>
          )}

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Reaching a SPOC</h2>
                <p className={styles.cardCaption}>
                  Coordination in this context happens on the phone and on WhatsApp. These are
                  live links, not printed text.
                </p>
              </div>
            </div>
            <ul className={styles.stackTight}>
              {rows
                .filter((row) => row.spocName)
                .map((row) => (
                  <li key={row.companyId} className={styles.row}>
                    <strong style={{ minWidth: 140 }}>{row.companyName}</strong>
                    <span>{row.spocName}</span>
                    <span className={styles.spacer} />
                    <a href={`tel:+91${row.spocPhone}`} className={styles.backLink}>
                      <Phone size={14} aria-hidden="true" /> Call
                    </a>
                    <a href={`mailto:${row.spocEmail}`} className={styles.backLink}>
                      <Mail size={14} aria-hidden="true" /> Email
                    </a>
                    <a
                      href={`https://wa.me/91${row.spocPhone}`}
                      className={styles.backLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
