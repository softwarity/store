import {DestroyRef} from '@angular/core';

export interface CrossTabSyncHandle {
  destroy(): void;
}

export function onStorageChange<T>(
  key: string,
  callback: (newValue: T | null) => void,
  destroyRef?: DestroyRef
): CrossTabSyncHandle {
  const listener = (event: StorageEvent) => {
    if (event.key !== key) {
      return;
    }
    if (event.newValue === null) {
      callback(null);
    } else {
      try {
        callback(JSON.parse(event.newValue) as T);
      } catch {
        callback(null);
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', listener);
  }

  const handle: CrossTabSyncHandle = {
    destroy() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', listener);
      }
    }
  };

  if (destroyRef) {
    destroyRef.onDestroy(() => handle.destroy());
  }

  return handle;
}
