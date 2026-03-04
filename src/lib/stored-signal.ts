import {DestroyRef, Injector, Signal, WritableSignal, computed, effect, inject, signal} from '@angular/core';
import {FakeStorage} from './fake-storage';
import {StoreService} from './store.service';

// --- Types ---

export interface StoredSignalOptions {
  id: string;
  injector?: Injector;
}

export interface StoredOptions {
  id: string;
  injector?: Injector;
}

export type StoredSignal<T extends Record<string, any>> = {
  [K in keyof T]: T[K];
} & {
  readonly [K in keyof T as `$${string & K}`]: Signal<T[K]>;
};

// --- Storage helpers ---

function getLocalStorage(): Storage {
  if (typeof window === 'undefined' || !window.localStorage) {
    return new FakeStorage();
  }
  return localStorage;
}

function getSessionStorage(): Storage {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return new FakeStorage();
  }
  return sessionStorage;
}

function buildKey(userId: string | null, id: string): string {
  if (userId !== null && userId.length > 0) {
    return `${userId}_${id}`;
  }
  return id;
}

function loadFromStorage<T>(storage: Storage, key: string, initialValue: T, version?: number): T {
  const entry = storage.getItem(key);
  if (entry === null) {
    return initialValue;
  }
  try {
    const parsed = JSON.parse(entry);
    if (version === undefined || parsed._version === version) {
      const {_version, ...data} = parsed;
      return data as T;
    }
    return initialValue;
  } catch {
    storage.removeItem(key);
    return initialValue;
  }
}

function saveToStorage<T>(storage: Storage, key: string, value: T, version?: number): void {
  try {
    const toStore = version !== undefined ? {...value, _version: version} : {...value};
    storage.setItem(key, JSON.stringify(toStore));
  } catch (e) {
    console.warn(`@softwarity/store: Failed to save signal (key: ${key}).`, e);
  }
}

// --- Deep tracking helpers ---

function toPlain(value: any): any {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(toPlain);
  }
  const result: any = {};
  for (const key of Object.keys(value)) {
    result[key] = toPlain(value[key]);
  }
  return result;
}

function trackValue(value: any, onMutate: () => void): any {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return createTrackedArray(value, onMutate);
  }
  return createTrackedObject(value, onMutate);
}

function createTrackedObject(obj: any, onMutate: () => void): any {
  const result: any = {};
  const inner: Record<string, any> = {};

  for (const key of Object.keys(obj)) {
    inner[key] = trackValue(obj[key], onMutate);
    Object.defineProperty(result, key, {
      enumerable: true,
      get: () => inner[key],
      set: (v: any) => {
        inner[key] = trackValue(v, onMutate);
        onMutate();
      }
    });
  }

  return result;
}

function createTrackedArray(arr: any[], onMutate: () => void): any[] {
  const tracked = arr.map(item => trackValue(item, onMutate));

  for (const method of ['push', 'pop', 'shift', 'unshift', 'copyWithin', 'fill', 'reverse', 'sort', 'splice']) {
    (tracked as any)[method] = (...args: any[]) => {
      const processedArgs = args.map(arg =>
        (arg !== null && typeof arg === 'object') ? trackValue(arg, onMutate) : arg
      );
      const original = (Array.prototype as any)[method] as Function;
      const result = original.apply(tracked, processedArgs);
      onMutate();
      return result;
    };
  }

  return tracked;
}

// --- Signal-based stored signal (no deep tracking) ---

function createStoredSignal<T extends Record<string, any>>(
  storage: Storage,
  initialValue: T,
  version: number | undefined,
  options: StoredSignalOptions
): StoredSignal<T> {
  const injector = options.injector ?? inject(Injector);
  const destroyRef = injector.get(DestroyRef);

  const userId = StoreService.userId$.getValue();
  let currentKey = buildKey(userId, options.id);
  const loaded = loadFromStorage<T>(storage, currentKey, initialValue, version);

  // One WritableSignal per property
  const propSignals: Record<string, WritableSignal<any>> = {};
  for (const key of Object.keys(loaded)) {
    propSignals[key] = signal((loaded as any)[key]);
  }

  // Computed aggregate for persistence
  const fullValue = computed(() => {
    const result: any = {};
    for (const key of Object.keys(propSignals)) {
      result[key] = propSignals[key]();
    }
    return result as T;
  });

  // Persist on every change
  effect(() => {
    saveToStorage(storage, currentKey, fullValue(), version);
  }, {injector});

  // Build proxy object
  const proxy: any = {};
  for (const key of Object.keys(propSignals)) {
    // config.prop — plain value read/write
    Object.defineProperty(proxy, key, {
      enumerable: true,
      get: () => propSignals[key](),
      set: (v: any) => propSignals[key].set(v)
    });
    // config.$prop — Signal<T[K]> (readonly)
    Object.defineProperty(proxy, '$' + key, {
      enumerable: false,
      get: () => propSignals[key].asReadonly()
    });
  }

  // React to userId changes
  const subscription = StoreService.userId$.subscribe(newUserId => {
    const newKey = buildKey(newUserId, options.id);
    if (newKey !== currentKey) {
      currentKey = newKey;
      const reloaded = loadFromStorage<T>(storage, currentKey, initialValue, version);
      for (const key of Object.keys(propSignals)) {
        propSignals[key].set((reloaded as any)[key]);
      }
    }
  });

  destroyRef.onDestroy(() => subscription.unsubscribe());

  return proxy as StoredSignal<T>;
}

// --- Deep-tracked stored signal (like decorators) ---

function createDeepStoredSignal<T extends Record<string, any>>(
  storage: Storage,
  initialValue: T,
  version: number | undefined,
  options: StoredOptions
): StoredSignal<T> {
  const injector = options.injector ?? inject(Injector);
  const destroyRef = injector.get(DestroyRef);

  const userId = StoreService.userId$.getValue();
  let currentKey = buildKey(userId, options.id);
  const loaded = loadFromStorage<T>(storage, currentKey, initialValue, version);

  // Version counter to force signal reactivity on deep mutations
  const versionSig = signal(0);

  function onMutate() {
    versionSig.update(v => v + 1);
  }

  // The tracked object is the canonical data store
  let trackedValue = createTrackedObject(loaded, onMutate);

  // Per-property computed signals for $prop access
  const propKeys = Object.keys(loaded);
  const propComputeds: Record<string, Signal<any>> = {};
  for (const key of propKeys) {
    propComputeds[key] = computed(() => {
      versionSig();
      return toPlain(trackedValue[key]);
    });
  }

  // Computed aggregate for persistence
  const fullValue = computed(() => {
    versionSig();
    return toPlain(trackedValue) as T;
  });

  // Persist on every change
  effect(() => {
    saveToStorage(storage, currentKey, fullValue(), version);
  }, {injector});

  // Build proxy object
  const proxy: any = {};
  for (const key of propKeys) {
    // config.prop — returns tracked value (deep mutations tracked)
    Object.defineProperty(proxy, key, {
      enumerable: true,
      get: () => trackedValue[key],
      set: (v: any) => {
        trackedValue[key] = v; // goes through tracked setter → onMutate
      }
    });
    // config.$prop — Signal<T[K]> (readonly, returns plain value)
    Object.defineProperty(proxy, '$' + key, {
      enumerable: false,
      get: () => propComputeds[key]
    });
  }

  // React to userId changes
  const subscription = StoreService.userId$.subscribe(newUserId => {
    const newKey = buildKey(newUserId, options.id);
    if (newKey !== currentKey) {
      currentKey = newKey;
      const reloaded = loadFromStorage<T>(storage, currentKey, initialValue, version);
      trackedValue = createTrackedObject(reloaded, onMutate);
      onMutate();
    }
  });

  destroyRef.onDestroy(() => subscription.unsubscribe());

  return proxy as StoredSignal<T>;
}

// --- Public API: Signal-based (no deep tracking) ---

export function localSignal<T extends Record<string, any>>(
  initialValue: T,
  version: number,
  options: StoredSignalOptions
): StoredSignal<T> {
  return createStoredSignal(getLocalStorage(), initialValue, version, options);
}

export function sessionSignal<T extends Record<string, any>>(
  initialValue: T,
  options: StoredSignalOptions
): StoredSignal<T> {
  return createStoredSignal(getSessionStorage(), initialValue, undefined, options);
}

// --- Public API: Deep-tracked (like decorators, no annotation needed) ---

export function localStored<T extends Record<string, any>>(
  initialValue: T,
  options: StoredOptions & {version: number}
): StoredSignal<T> {
  return createDeepStoredSignal(getLocalStorage(), initialValue, options.version, options);
}

export function sessionStored<T extends Record<string, any>>(
  initialValue: T,
  options: StoredOptions
): StoredSignal<T> {
  return createDeepStoredSignal(getSessionStorage(), initialValue, undefined, options);
}
