import { formatClock } from '../../format/time';
import { useT } from '../../i18n';
import { Clock } from '../Clock/Clock';
import { RoadBar } from '../RoadBar/RoadBar';
import styles from './ResultsTable.module.css';
import { PEAK_INLINE_MIN_SHARE, type ResultRow } from './rows';

interface ResultsTableProps {
  rows: readonly ResultRow[];
  /** Changes when the bars should draw in again (first data, new start time). */
  drawKey: string;
  reducedMotion: boolean;
}

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
}: {
  row: ResultRow;
  index: number;
  reducedMotion: boolean;
}) {
  const t = useT();
  const dash = <span className={styles.dash}>—</span>;

  return (
    <tr className={rowClass(row)} aria-busy={row.status === 'loading'}>
      <th scope="row" className={styles.leave}>
        <Clock date={row.departAt} />
      </th>
      <td className={styles.barCell}>
        {row.status === 'loading' && <span className={styles.skeleton} aria-hidden="true" />}
        {row.status === 'error' && <span className={styles.hint}>{t('row_error_hint')}</span>}
        {row.status === 'ready' && (
          <RoadBar
            trip={row.trip}
            over={row.over}
            emphasis={row.emphasis}
            index={index}
            still={reducedMotion}
            tagText={
              row.emphasis === 'best'
                ? t('best_tag')
                : row.emphasis === 'peak'
                  ? t('peak_tag')
                  : null
            }
            tagInside={row.over >= PEAK_INLINE_MIN_SHARE}
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

export function ResultsTable({ rows, drawKey, reducedMotion }: ResultsTableProps) {
  const t = useT();
  const first = rows[0];

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
        <tbody key={drawKey}>
          {rows.map((row, index) => (
            <ResultRowView
              key={row.offsetMin}
              row={row}
              index={index}
              reducedMotion={reducedMotion}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
