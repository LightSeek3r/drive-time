import { useState, type ReactNode } from 'react';
import { deltaMin, toDisplayMinutes, type DepartureSummary } from '../../domain/departures';
import type { StartTime } from '../../domain/types';
import { formatClock } from '../../format/time';
import { useT } from '../../i18n';
import { Marked, mark } from '../Marked/Marked';
import styles from './AnswerPanel.module.css';

type AnswerPanelProps = { isSample: boolean } & (
  | { state: 'loading' }
  | {
      state: 'ready';
      summary: DepartureSummary;
      startMode: StartTime['mode'];
      /** Identifies the route and start time; a change re-announces the answer. */
      announceKey: string;
    }
);

/** One quiet live region: it speaks when the answer is new, not on every refresh or clock tick. */
function Announcer({ text, changeKey }: { text: string | null; changeKey: string | null }) {
  const [announced, setAnnounced] = useState<{ key: string; text: string } | null>(null);
  if (text !== null && changeKey !== null && announced?.key !== changeKey) {
    setAnnounced({ key: changeKey, text });
  }
  return (
    <p role="status" className="sr-only">
      {announced?.text ?? ''}
    </p>
  );
}

function useLines(summary: DepartureSummary, startMode: StartTime['mode']): string[] {
  const t = useT();
  const { best, first, peak, bestIsFirst, savedVsFirstMin } = summary;
  const min = mark(toDisplayMinutes(best.durationSec));
  const arrive = formatClock(best.arriveAt);
  const peakLine =
    peak === undefined
      ? null
      : t('answer_line_vs_peak', {
          delta: mark(deltaMin(peak, best)),
          peak: formatClock(peak.slot.departAt),
        });

  const lines = bestIsFirst
    ? [
        t('answer_trip', { min, arrive }),
        t(startMode === 'now' ? 'answer_line_best_first' : 'answer_line_best_start'),
        peakLine,
      ]
    : [
        t('answer_line_best_later', {
          min,
          arrive,
          delta: mark(savedVsFirstMin),
          first: formatClock(first.slot.departAt),
        }),
        peakLine,
      ];
  return lines.filter((line): line is string => line !== null);
}

function ReadyAnswer({
  summary,
  startMode,
  tag,
}: {
  summary: DepartureSummary;
  startMode: StartTime['mode'];
  tag: ReactNode;
}) {
  const t = useT();
  const lines = useLines(summary, startMode);
  return (
    <>
      <div className={styles.top}>
        <h2 className={styles.headline}>
          <Marked
            text={t('answer_headline', { time: mark(formatClock(summary.best.slot.departAt)) })}
            markClassName={styles.time ?? ''}
          />
        </h2>
        {tag}
      </div>
      <div className={styles.lines}>
        {lines.map((line) => (
          <p key={line} className={styles.line}>
            <Marked text={line} markClassName={styles.figure ?? ''} />
          </p>
        ))}
      </div>
    </>
  );
}

export function AnswerPanel(props: AnswerPanelProps) {
  const t = useT();
  const tag = props.isSample ? <span className={styles.tag}>{t('sample_data_tag')}</span> : null;
  const spoken =
    props.state === 'ready'
      ? `${t('answer_headline', { time: formatClock(props.summary.best.slot.departAt) })}. ${t(
          'answer_trip',
          {
            min: toDisplayMinutes(props.summary.best.durationSec),
            arrive: formatClock(props.summary.best.arriveAt),
          },
        )}`
      : null;
  // The best slot's offset (not its clock time) keeps a 'now' refresh quiet when the same slot still wins.
  const changeKey =
    props.state === 'ready' ? `${props.announceKey}|${props.summary.best.slot.offsetMin}` : null;
  return (
    <section className={styles.panel} aria-busy={props.state === 'loading'}>
      {props.state === 'ready' ? (
        <ReadyAnswer summary={props.summary} startMode={props.startMode} tag={tag} />
      ) : (
        <>
          <div className={styles.top}>
            <span className="sr-only">{t('loading')}</span>
            <span className={`${styles.bone} ${styles.boneHeadline}`} />
            {tag}
          </div>
          <div className={styles.lines}>
            <span className={`${styles.bone} ${styles.boneLine}`} />
            <span className={`${styles.bone} ${styles.boneLineShort}`} />
          </div>
        </>
      )}
      <Announcer text={spoken} changeKey={changeKey} />
    </section>
  );
}
