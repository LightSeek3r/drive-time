import { useSyncExternalStore } from 'react';
import type { Settings } from '../domain/types';
import { settingsStore } from '../storage/stores';

function update(patch: Partial<Settings>): void {
  const next = { ...settingsStore.get(), ...patch };
  settingsStore.set({ ...next, apiKey: next.apiKey.trim() });
}

export function useSettings(): {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
} {
  const settings = useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
  return { settings, update };
}
