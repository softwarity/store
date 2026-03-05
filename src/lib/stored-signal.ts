import {Injector, Signal, computed, effect, inject, signal} from '@angular/core';
import {FakeStorage} from './fake-storage';
import {StoreService} from './store.service';

// --- Types ---

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

export function getLocalStorage(): Storage {
  if (typeof window === 'undefined' || !window.localStorage) {
    return new FakeStorage();
  }
  return localStorage;
}

export function getSessionStorage(): Storage {
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
    if (version === undefined || parsed._schemaVersion === version) {
      const {_schemaVersion, ...data} = parsed;
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
    const toStore = version !== undefined ? {...value, _schemaVersion: version} : {...value};
    storage.setItem(key, JSON.stringify(toStore));
  } catch (e) {
    console.warn(`@softwarity/store: Failed to save signal (key: ${key}).`, e);
  }
}

// --- Deep tracking helpers ---

const TRACKED = Symbol('TRACKED');

function isTracked(value: any): boolean {
  return value !== null && value !== undefined && typeof value === 'object' && value[TRACKED] === true;
}

export function toPlain(value: any): any {
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
  if (isTracked(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    return createTrackedArray(value, onMutate);
  }
  return createTrackedObject(value, onMutate);
}

function createTrackedObject(obj: any, onMutate: () => void): any {
  const target: any = {};
  for (const key of Object.keys(obj)) {
    target[key] = trackValue(obj[key], onMutate);
  }
  return new Proxy(target, {
    get(t, prop) {
      if (prop === TRACKED) return true;
      return t[prop as string];
    },
    set(t, prop, value) {
      t[prop as string] = trackValue(value, onMutate);
      onMutate();
      return true;
    }
  });
}

function createTrackedArray(arr: any[], onMutate: () => void): any[] {
  const target = arr.map(item => trackValue(item, onMutate));
  return new Proxy(target, {
    get(t, prop) {
      if (prop === TRACKED) return true;
      return t[prop as any];
    },
    set(t, prop, value) {
      if (prop === 'length') {
        t.length = value;
        onMutate();
        return true;
      }
      t[prop as any] = trackValue(value, onMutate);
      onMutate();
      return true;
    }
  });
}

// --- Shared builder: tracked proxy with $prop signals ---

export function createTrackedProxy<T extends Record<string, any>>(
  initialValue: T,
  onSave: (plainValue: T) => void
): {proxy: StoredSignal<T>; reload: (newValue: T) => void} {
  const versionSig = signal(0);
  const propKeys = Object.keys(initialValue);

  function onMutate() {
    versionSig.update(v => v + 1);
    onSave(toPlain(trackedValue) as T);
  }

  let trackedValue = createTrackedObject(initialValue, onMutate);

  // Per-property computed signals for $prop access
  const propComputeds: Record<string, Signal<any>> = {};
  for (const key of propKeys) {
    propComputeds[key] = computed(() => {
      versionSig();
      return toPlain(trackedValue[key]);
    });
  }

  // Build proxy object
  const proxy: any = {};
  for (const key of propKeys) {
    Object.defineProperty(proxy, key, {
      enumerable: true,
      get: () => trackedValue[key],
      set: (v: any) => {
        trackedValue[key] = v; // goes through tracked setter → onMutate
      }
    });
    Object.defineProperty(proxy, '$' + key, {
      enumerable: false,
      get: () => propComputeds[key]
    });
  }

  function reload(newValue: T) {
    trackedValue = createTrackedObject(newValue, onMutate);
    versionSig.update(v => v + 1);
  }

  return {proxy: proxy as StoredSignal<T>, reload};
}

// --- Public API: localStored / sessionStored ---

export function localStored<T extends Record<string, any>>(
  initialValue: T,
  options: StoredOptions & {version: number}
): StoredSignal<T> {
  const storage = getLocalStorage();
  const injector = options.injector ?? inject(Injector);

  const userId = StoreService.userId();
  let currentKey = buildKey(userId, options.id);
  const loaded = loadFromStorage<T>(storage, currentKey, initialValue, options.version);

  const {proxy, reload} = createTrackedProxy<T>(loaded, (plainValue) => {
    saveToStorage(storage, currentKey, plainValue, options.version);
  });

  // Also persist via effect for batched initial write
  const versionSig = signal(0);
  effect(() => {
    versionSig();
    saveToStorage(storage, currentKey, toPlain(proxy) as T, options.version);
  }, {injector});

  // React to userId changes via effect (auto-cleanup)
  effect(() => {
    const newUserId = StoreService.userId();
    const newKey = buildKey(newUserId, options.id);
    if (newKey !== currentKey) {
      currentKey = newKey;
      const reloaded = loadFromStorage<T>(storage, currentKey, initialValue, options.version);
      reload(reloaded);
    }
  }, {injector});

  return proxy;
}

export function sessionStored<T extends Record<string, any>>(
  initialValue: T,
  options: StoredOptions
): StoredSignal<T> {
  const storage = getSessionStorage();
  const injector = options.injector ?? inject(Injector);

  const userId = StoreService.userId();
  let currentKey = buildKey(userId, options.id);
  const loaded = loadFromStorage<T>(storage, currentKey, initialValue, undefined);

  const {proxy, reload} = createTrackedProxy<T>(loaded, (plainValue) => {
    saveToStorage(storage, currentKey, plainValue, undefined);
  });

  const versionSig = signal(0);
  effect(() => {
    versionSig();
    saveToStorage(storage, currentKey, toPlain(proxy) as T, undefined);
  }, {injector});

  // React to userId changes via effect (auto-cleanup)
  effect(() => {
    const newUserId = StoreService.userId();
    const newKey = buildKey(newUserId, options.id);
    if (newKey !== currentKey) {
      currentKey = newKey;
      const reloaded = loadFromStorage<T>(storage, currentKey, initialValue, undefined);
      reload(reloaded);
    }
  }, {injector});

  return proxy;
}
