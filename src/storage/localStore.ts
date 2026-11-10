export interface LocalStore<T> {
  get(): T;
  set(value: T): void;
  subscribe(listener: () => void): () => void;
}

export interface LocalStoreOptions<T> {
  /** Full storage key, e.g. `ht:v1:settings`. */
  key: string;
  /** Bump when the stored shape changes; older payloads are discarded. */
  version: number;
  defaults: () => T;
  validate: (raw: unknown) => T | null;
}

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    // Accessing localStorage itself throws when storage is blocked; run in-memory instead.
    return null;
  }
}

export function createLocalStore<T>(options: LocalStoreOptions<T>): LocalStore<T> {
  const { key, version, defaults, validate } = options;
  const listeners = new Set<() => void>();
  // Holds the snapshot between changes (required by useSyncExternalStore) and doubles as the
  // in-memory fallback when storage is unavailable. `undefined` means "not loaded yet".
  let snapshot: { value: T } | undefined;

  function load(): T {
    try {
      const text = getStorage()?.getItem(key);
      if (text == null) return defaults();
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null) return defaults();
      const envelope = parsed as { version?: unknown; data?: unknown };
      if (envelope.version !== version) return defaults();
      return validate(envelope.data) ?? defaults();
    } catch {
      // Unreadable storage or corrupt JSON: use defaults, overwritten on the next set().
      return defaults();
    }
  }

  function notify(): void {
    listeners.forEach((listener) => listener());
  }

  // deliberate: never removed; stores are app-lifetime singletons and this keeps the snapshot
  // fresh even while nothing is subscribed.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== null && event.key !== key) return;
      if (event.storageArea !== null && event.storageArea !== getStorage()) return;
      snapshot = undefined;
      notify();
    });
  }

  return {
    get() {
      snapshot ??= { value: load() };
      return snapshot.value;
    },
    set(value) {
      snapshot = { value };
      try {
        getStorage()?.setItem(key, JSON.stringify({ version, data: value }));
      } catch {
        // Quota or private-mode failure: the value lives in memory for this session.
      }
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
