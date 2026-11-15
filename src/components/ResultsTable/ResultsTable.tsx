import { useRef } from 'react';
import { formatClock } from '../../format/time';
import { useT } from '../../i18n';
import { Clock } from '../Clock/Clock';
import { RoadBar } from '../RoadBar/RoadBar';
import styles from './ResultsTable.module.css';
import type { ResultRow } from './rows';

interface ResultsTableProps {
  rows: readonly ResultRow[];
  /** Changes when the bars should draw in again (first data, new start time). */
  drawKey: string;
  reducedMotion: boolean;
  /** Makes rows tappable: the list restarts at that departure. Omit for a read-only table. */
  onSelect?: (departAt: Date) => void;
}

// A long list would otherwise delay its last bar by close to a second.
const MAX_STAGGER_INDEX = 12;

function formatDelta(delta: number | null): string {
  if (delta === null) return '—';
  if (delta === 0) return '0';
  return delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`;
}

function deltaClass(row: ResultRow): string {
  if (row.status !== 'ready' || row.delta === null || row.delta === 0) return '';
  return row.delta > 0 ? (styles.up ?? '') : (styles.down ?? '');
}

function rowClass(row: ResultRow): string {
  const state = row.status === 'ready' ? row.emphasis : row.status;
  return [styles.row, styles[state], row.spent ? styles.spent : ''].filter(Boolean).join(' ');
}

function ResultRowView({
  row,
  index,
  reducedMotion,
  onSelect,
}: {
  row: ResultRow;
  index: number;
  reducedMotion: boolean;
  onSelect: ((departAt: Date) => void) | undefined;
}) {
  const t = useT();
  const dash = <span className={styles.dash}>—</span>;

  // The first row is already the start, and a departure in the past would just snap back to now.
  const selectable = onSelect !== undefined && index > 0 && !row.spent;
  const select = selectable ? () => onSelect(row.departAt) : undefined;

  return (
    <tr
      className={`${rowClass(row)} ${selectable ? styles.selectable : ''}`}
      aria-busy={row.status === 'loading'}
      data-best={row.status === 'ready' && row.emphasis === 'best' ? '' : undefined}
      // Pointer users get the whole row; the button below is the keyboard and screen reader path.
      onClick={select}
    >
      <th scope="row" className={styles.leave}>
        {select === undefined ? (
          <Clock date={row.departAt} />
        ) : (
          <button
            type="button"
            className={styles.select}
            aria-label={t('row_select', { time: formatClock(row.departAt) })}
            onClick={(event) => {
              event.stopPropagation();
              select();
            }}
          >
            <Clock date={row.departAt} />
          </button>
        )}
      </th>
      <td className={styles.barCell}>
        {row.status === 'loading' && <span className={styles.skeleton} aria-hidden="true" />}
        {row.status === 'error' && <span className={styles.hint}>{t('row_error_hint')}</span>}
        {row.status === 'ready' && (
          <RoadBar
            trip={row.trip}
            over={row.over}
            emphasis={row.emphasis}
            index={Math.min(index, MAX_STAGGER_INDEX)}
            still={reducedMotion}
            tagText={
              row.emphasis === 'best'
                ? t('best_tag')
                : row.emphasis === 'peak'
                  ? t('peak_tag')
                  : null
            }
          />
        )}
      </td>
      <td className={styles.minutes}>{row.status === 'ready' ? row.minutes : dash}</td>
      <td className={styles.arrive}>
        {row.status === 'ready' ? <Clock date={row.arriveAt} /> : dash}
      </td>
      <td className={`${styles.delta} ${deltaClass(row)}`}>
        {row.status === 'ready' ? formatDelta(row.delta) : dash}
      </td>
    </tr>
  );
}

export function ResultsTable({ rows, drawKey, reducedMotion, onSelect }: ResultsTableProps) {
  const t = useT();
  const first = rows[0];
  const body = useRef<HTMLTableSectionElement>(null);
  const bestIndex = rows.findIndex((row) => row.status === 'ready' && row.emphasis === 'best');

  const jumpToBest = () => {
    body.current?.querySelector('[data-best]')?.scrollIntoView?.({
      block: 'center',
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <div className={styles.results}>
      <ul className={styles.legend}>
        <li className={styles.legendItem}>
          <i className={`${styles.swatch} ${styles.swatchTrip}`} />
          {t('legend_trip')}
        </li>
        <li className={styles.legendItem}>
          <i className={`${styles.swatch} ${styles.swatchExtra}`} />
          {t('legend_extra')}
        </li>
        <li className={styles.legendJump}>
          {/* Always laid out, only hidden: the link appearing must not push the table down. */}
          <button
            type="button"
            className={styles.jump}
            onClick={jumpToBest}
            disabled={bestIndex <= 0}
            tabIndex={bestIndex > 0 ? undefined : -1}
            aria-hidden={bestIndex > 0 ? undefined : true}
          >
            {t('jump_to_best')}
          </button>
        </li>
      </ul>
      <table className={styles.table}>
        <caption className="sr-only">{t('table_caption')}</caption>
        <thead>
          <tr className={styles.head}>
            <th scope="col" className={styles.leave}>
              {t('column_leave')}
            </th>
            <th scope="col" className={styles.barHead}>
              {t('column_duration')}
            </th>
            <th scope="col" className={styles.minutes}>
              {t('column_min')}
            </th>
            <th scope="col" className={styles.arrive}>
              {t('column_arrive')}
            </th>
            <th scope="col" className={styles.delta}>
              {first === undefined
                ? t('column_vs', { time: '' }).trim()
                : t('column_vs', { time: formatClock(first.departAt) })}
            </th>
          </tr>
        </thead>
        <tbody key={drawKey} ref={body}>
          {rows.map((row, index) => (
            <ResultRowView
              key={row.offsetMin}
              row={row}
              index={index}
              reducedMotion={reducedMotion}
              onSelect={onSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
