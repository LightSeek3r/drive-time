import { createLocalStore } from './localStore';

interface Counter {
  n: number;
}

const KEY = 'ht:v1:test';

function validateCounter(raw: unknown): Counter | null {
  if (typeof raw === 'object' && raw !== null && typeof (raw as Counter).n === 'number') {
    return { n: (raw as Counter).n };
  }
  return null;
}

function makeStore(version = 1) {
  return createLocalStore<Counter>({
    key: KEY,
    version,
    defaults: () => ({ n: 0 }),
    validate: validateCounter,
  });
}

function storageEvent(init: StorageEventInit): StorageEvent {
  return new StorageEvent('storage', { storageArea: localStorage, ...init });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createLocalStore', () => {
  it('returns defaults when the key is missing', () => {
    expect(makeStore().get()).toEqual({ n: 0 });
  });

  it('round-trips a set value through a versioned envelope', () => {
    makeStore().set({ n: 5 });

    expect(JSON.parse(localStorage.getItem(KEY) ?? '')).toEqual({ version: 1, data: { n: 5 } });
    expect(makeStore().get()).toEqual({ n: 5 });
  });

  it('returns defaults for corrupt JSON and does not overwrite until set', () => {
    localStorage.setItem(KEY, '{not json');
    const store = makeStore();

    expect(store.get()).toEqual({ n: 0 });
    expect(localStorage.getItem(KEY)).toBe('{not json');

    store.set({ n: 1 });
    expect(makeStore().get()).toEqual({ n: 1 });
  });

  it('returns defaults for a non-object payload', () => {
    localStorage.setItem(KEY, '42');

    expect(makeStore().get()).toEqual({ n: 0 });
  });

  it('returns defaults when the stored version differs', () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, data: { n: 9 } }));

    expect(makeStore(2).get()).toEqual({ n: 0 });
  });

  it('returns defaults when validation fails', () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, data: { n: 'nine' } }));

    expect(makeStore().get()).toEqual({ n: 0 });
  });

  it('returns the same reference until something changes', () => {
    const store = makeStore();

    expect(store.get()).toBe(store.get());

    const next = { n: 3 };
    store.set(next);
    expect(store.get()).toBe(next);
    expect(store.get()).toBe(store.get());
  });

  it('notifies subscribers on set and stops after unsubscribe', () => {
    const store = makeStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.set({ n: 1 });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.set({ n: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reloads and notifies on a cross-tab storage event for its key', () => {
    const store = makeStore();
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.get()).toEqual({ n: 0 });

    localStorage.setItem(KEY, JSON.stringify({ version: 1, data: { n: 7 } }));
    window.dispatchEvent(storageEvent({ key: KEY }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toEqual({ n: 7 });
    expect(store.get()).toBe(store.get());
  });

  it('reloads when storage is cleared in another tab (null key)', () => {
    const store = makeStore();
    store.set({ n: 4 });

    localStorage.clear();
    window.dispatchEvent(storageEvent({ key: null }));

    expect(store.get()).toEqual({ n: 0 });
  });

  it('ignores storage events for other keys', () => {
    const store = makeStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.get();

    window.dispatchEvent(storageEvent({ key: 'ht:v1:other' }));

    expect(listener).not.toHaveBeenCalled();
    expect(store.get()).toBe(before);
  });

  it('keeps values in memory when setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    const store = makeStore();
    const listener = vi.fn();
    store.subscribe(listener);

    expect(() => store.set({ n: 8 })).not.toThrow();

    expect(store.get()).toEqual({ n: 8 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('returns defaults when getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(makeStore().get()).toEqual({ n: 0 });
  });

  it('works in memory when localStorage access itself throws', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    const store = makeStore();

    expect(store.get()).toEqual({ n: 0 });
    store.set({ n: 2 });
    expect(store.get()).toEqual({ n: 2 });
  });
});
