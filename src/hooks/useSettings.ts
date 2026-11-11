import { useSyncExternalStore } from 'react';
import type { Settings } from '../domain/types';
import { settingsStore } from '../storage/stores';

function update(patch: Partial<Settings>): void {
  settingsStore.set({ ...settingsStore.get(), ...patch });
}

export function useSettings(): {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
} {
  const settings = useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
  return { settings, update };
}
