import {StoreService} from './store.service';
import {createTrackedProxy, getLocalStorage, getSessionStorage, toPlain, StoredSignal} from './stored-signal';

function loadFromDecoratorStorage<T>(storage: Storage, key: string, initialValue: T, version?: number): T {
  const entry = storage.getItem(key);
  if (entry === null) {
    return initialValue;
  }
  try {
    const parsed = JSON.parse(entry);
    if (version === undefined || version === parsed._schemaVersion) {
      const {_schemaVersion: _, ...data} = parsed;
      return data as T;
    }
    return initialValue;
  } catch {
    storage.removeItem(key);
    return initialValue;
  }
}

function saveToDecoratorStorage<T>(storage: Storage, key: string, value: T, version?: number): void {
  try {
    const toStore = version !== undefined ? {...value, _schemaVersion: version} : {...value};
    storage.setItem(key, JSON.stringify(toStore));
  } catch (e) {
    console.warn(`@softwarity/store: Failed to save (key: ${key}).`, e);
  }
}

function storedDecorator(storage: Storage, version: number | undefined, storageKey?: string) {
  return (target: any, key: string) => {
    let stored: {proxy: StoredSignal<any>; reload: (v: any) => void} | undefined;
    let currentKey = '';
    let initialValue: any;

    Object.defineProperty(target, key, {
      configurable: true,
      set: (val: any) => {
        initialValue = val;
        if (!currentKey) {
          const uid = StoreService.userId();
          currentKey = StoreService.getId(uid, target, key, storageKey);
        }
        const loaded = loadFromDecoratorStorage(storage, currentKey, val, version);
        const {proxy, reload} = createTrackedProxy(loaded, (plainValue) => {
          saveToDecoratorStorage(storage, currentKey, plainValue, version);
        });
        stored = {proxy, reload};
        // Persist initial/loaded value
        saveToDecoratorStorage(storage, currentKey, toPlain(proxy), version);
      },
      get: () => stored?.proxy
    });

    // React to userId changes
    StoreService.onUserIdChange(uid => {
      const newKey = StoreService.getId(uid, target, key, storageKey);
      if (stored && newKey !== currentKey) {
        currentKey = newKey;
        const loaded = loadFromDecoratorStorage(storage, currentKey, initialValue, version);
        stored.reload(loaded);
        saveToDecoratorStorage(storage, currentKey, toPlain(stored.proxy), version);
      } else {
        currentKey = newKey;
      }
    });
  };
}

export function LocalStored(version: number, storageKey?: string) {
  return storedDecorator(getLocalStorage(), version, storageKey);
}

export function SessionStored(storageKey?: string) {
  return storedDecorator(getSessionStorage(), undefined, storageKey);
}
