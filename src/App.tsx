import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './App.module.css';
import { AnswerPanel } from './components/AnswerPanel/AnswerPanel';
import { Banner } from './components/Banner/Banner';
import { BrandBand } from './components/BrandBand/BrandBand';
import { ErrorBanner } from './components/ErrorBanner/ErrorBanner';
import { ResultsTable } from './components/ResultsTable/ResultsTable';
import { buildRows } from './components/ResultsTable/rows';
import { RouteSection, type RouteFieldName } from './components/RouteSection/RouteSection';
import { SetPlaceDialog } from './components/SetPlaceDialog/SetPlaceDialog';
import { SettingsSheet } from './components/SettingsSheet/SettingsSheet';
import { StatusFooter } from './components/StatusFooter/StatusFooter';
import { WhenSection } from './components/WhenSection/WhenSection';
import { buildSlots, resolveBase } from './domain/departures';
import { slotCount } from './domain/window';
import { currentLocationPlace, samePlace } from './domain/places';
import type { DepartureWindow } from './domain/window';
import type { Place, SavedPlaceKey, SlotState, StartTime } from './domain/types';
import { useDepartureEstimates } from './hooks/useDepartureEstimates';
import { useGeolocation, type GeoState } from './hooks/useGeolocation';
import { useLastTrip } from './hooks/useLastTrip';
import { useNow } from './hooks/useNow';
import { useOnline } from './hooks/useOnline';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useSavedPlaces } from './hooks/useSavedPlaces';
import { useSettings } from './hooks/useSettings';
import { useLang, useT } from './i18n';

const NOW: StartTime = { mode: 'now' };

function loadingSlots(start: StartTime, now: Date, window: DepartureWindow): SlotState[] {
  return buildSlots(resolveBase(start, now), window.step, slotCount(window)).map((slot) => ({
    status: 'loading',
    slot,
  }));
}

export default function App() {
  const t = useT();
  const lang = useLang();
  const { settings, update: updateSettings } = useSettings();
  const { places, save: savePlace } = useSavedPlaces();
  const { trip, setTrip } = useLastTrip();
  const online = useOnline();
  const now = useNow();
  const reducedMotion = useReducedMotion();
  const geolocation = useGeolocation();

  const [start, setStart] = useState<StartTime>(NOW);
  const [activeField, setActiveField] = useState<RouteFieldName>('to');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [setUpKey, setSetUpKey] = useState<SavedPlaceKey | null>(null);

  // First launch has no trip yet: fall back to the saved places without writing them as the trip.
  const from = trip.from ?? places.home ?? null;
  const to = trip.to ?? places.work ?? null;
  const activePlace = activeField === 'from' ? from : to;

  const window = useMemo<DepartureWindow>(
    () => ({ span: settings.span, step: settings.step }),
    [settings.span, settings.step],
  );
  const estimates = useDepartureEstimates({ from, to, start, window });
  const { isSample, summary, error } = estimates;

  const pick = (field: RouteFieldName, place: Place) => {
    setTrip(field === 'from' ? { from: place, to } : { from, to: place });
  };

  // Only a new geolocation result may fill From; later renders with the same result must not undo a manual pick.
  const handledGeo = useRef<GeoState>(geolocation.state);
  useEffect(() => {
    if (geolocation.state === handledGeo.current) return;
    handledGeo.current = geolocation.state;
    if (geolocation.state.status === 'ready') {
      setTrip({ from: currentLocationPlace(geolocation.state.position, t('my_location')), to });
    }
  }, [geolocation.state, setTrip, t, to]);

  const openSettings = () => setSettingsOpen(true);

  const slots = estimates.slots.length > 0 ? estimates.slots : loadingSlots(start, now, window);
  const rows = buildRows(slots, summary, now);
  const drawKey = start.mode === 'at' ? String(start.at.getTime()) : 'now';
  const announceKey = `${from?.id ?? '-'}>${to?.id ?? '-'}@${drawKey}`;

  const answer =
    summary !== undefined ? (
      <AnswerPanel
        state="ready"
        isSample={isSample}
        summary={summary}
        startMode={start.mode}
        announceKey={announceKey}
      />
    ) : error === null ? (
      <AnswerPanel state="loading" isSample={isSample} />
    ) : null;

  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        <div className={styles.top}>
          <BrandBand onOpenSettings={openSettings} />
          {!online && (
            <Banner tone="warning" icon="offline" role="status">
              {t('offline_banner')}
            </Banner>
          )}
          {isSample && (
            <Banner tone="info" icon="pin">
              {t('onboarding_notice')}
            </Banner>
          )}
        </div>

        <main className={styles.main}>
          <div className={styles.controls}>
            <RouteSection
              from={from}
              to={to}
              saved={places}
              activeField={activeField}
              geo={geolocation.state}
              lang={lang}
              isSample={isSample}
              onActivate={setActiveField}
              onPick={pick}
              onSwap={() => setTrip({ from: to, to: from })}
              onLocate={geolocation.locate}
              onSaveAs={(key) => {
                if (activePlace !== null) savePlace(key, activePlace);
              }}
              onSetUp={setSetUpKey}
            />
            <WhenSection start={start} now={now} onChange={setStart} />
            {error !== null && <ErrorBanner kind={error} onRetry={estimates.refresh} />}
            <div className={styles.answerSlot}>{answer}</div>
          </div>

          <div className={styles.results}>
            <ResultsTable
              rows={rows}
              drawKey={drawKey}
              reducedMotion={reducedMotion}
              onSelect={(departAt) => setStart({ mode: 'at', at: departAt })}
            />
            <StatusFooter
              updatedAt={estimates.updatedAt}
              adjustedByMin={estimates.adjustedByMin}
              onRefresh={estimates.refresh}
            />
          </div>
        </main>
      </div>

      <SettingsSheet
        open={settingsOpen}
        settings={settings}
        onSave={(next) => {
          updateSettings(next);
          setSettingsOpen(false);
        }}
        onClose={() => setSettingsOpen(false)}
      />
      <SetPlaceDialog
        target={setUpKey}
        current={setUpKey === null ? undefined : places[setUpKey]}
        lang={lang}
        near={activePlace?.position}
        onSave={(key, place) => {
          const previous = places[key];
          savePlace(key, place);
          if (activePlace === null) pick(activeField, place);
          else if (previous !== undefined) {
            // A field still showing the replaced place would keep an address that is no longer Home or Work.
            const retarget = (p: Place | null) =>
              p !== null && samePlace(p, previous) ? place : p;
            const next = { from: retarget(trip.from), to: retarget(trip.to) };
            if (next.from !== trip.from || next.to !== trip.to) setTrip(next);
          }
          setSetUpKey(null);
        }}
        onClose={() => setSetUpKey(null)}
      />
    </div>
  );
}
