import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import styles from './DataTable.module.css';

/**
 * The dense staff table. Register B — density is correct here, and
 * applying beneficiary spacing to an operations screen is a mistake, not
 * a kindness.
 *
 * columns: [{ key, label, align, width, sortable, render(row), value(row) }]
 *   `value` is what sorting and exporting read; `render` is what the cell
 *   shows. Keeping them separate is what lets a column display a badge and
 *   still sort by the underlying number.
 *
 * The whole row navigates when `onRowClick` is given, and it does so
 * through a real <button> in the first cell rather than a click handler on
 * the <tr>: a clickable row that keyboard users cannot reach is not
 * navigation, it is decoration.
 */
export default function DataTable({
  columns,
  rows,
  getRowKey,
  onRowClick,
  sort,
  onSort,
  empty,
  caption,
  loading = false,
  skeletonRows = 6,
}) {
  const sortIcon = (column) => {
    if (!column.sortable) return null;
    if (sort?.key !== column.key) {
      return <ChevronsUpDown size={14} className={styles.sortIcon} aria-hidden="true" />;
    }
    return sort.direction === 'asc' ? (
      <ChevronUp size={14} className={styles.sortIconActive} aria-hidden="true" />
    ) : (
      <ChevronDown size={14} className={styles.sortIconActive} aria-hidden="true" />
    );
  };

  if (!loading && rows.length === 0) {
    return <div className={styles.emptyWrap}>{empty}</div>;
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        {caption && <caption className="srOnly">{caption}</caption>}
        <thead className={styles.head}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={`${styles.th} ${column.align === 'right' ? styles.right : ''}`}
                aria-sort={
                  sort?.key === column.key
                    ? sort.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                {column.sortable && onSort ? (
                  <button
                    type="button"
                    className={styles.sortButton}
                    onClick={() => onSort(column.key)}
                  >
                    {column.label}
                    {sortIcon(column)}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }, (_, index) => (
                <tr key={index} className={styles.tr}>
                  {columns.map((column) => (
                    <td key={column.key} className={styles.td}>
                      <span className={styles.skeleton} aria-hidden="true" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr key={getRowKey(row)} className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}>
                  {columns.map((column, index) => {
                    const content = column.render ? column.render(row) : row[column.key];
                    return (
                      <td
                        key={column.key}
                        className={`${styles.td} ${column.align === 'right' ? styles.right : ''}`}
                      >
                        {index === 0 && onRowClick ? (
                          <button
                            type="button"
                            className={styles.rowButton}
                            onClick={() => onRowClick(row)}
                          >
                            {content}
                          </button>
                        ) : (
                          content
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

/** Sort a list by a column's `value`, stable and direction-aware. */
export function sortRows(rows, columns, sort) {
  if (!sort?.key) return rows;
  const column = columns.find((candidate) => candidate.key === sort.key);
  if (!column) return rows;

  const read = (row) => (column.value ? column.value(row) : row[column.key]);
  const factor = sort.direction === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => {
    const left = read(a);
    const right = read(b);
    /* Nulls always sink, whichever way the column is pointing — an empty
       cell is not "the smallest value", it is the absence of one. */
    if (left == null && right == null) return 0;
    if (left == null) return 1;
    if (right == null) return -1;
    if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor;
    return String(left).localeCompare(String(right)) * factor;
  });
}

/** Click a column: first click sorts descending, clicking again flips it. */
export function nextSort(current, key) {
  if (current?.key !== key) return { key, direction: 'desc' };
  return { key, direction: current.direction === 'desc' ? 'asc' : 'desc' };
}
