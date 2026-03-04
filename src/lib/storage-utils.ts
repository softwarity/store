export function clearLocalStorage(prefix?: string): void {
  clearStorage(localStorage, prefix);
}

export function clearSessionStorage(prefix?: string): void {
  clearStorage(sessionStorage, prefix);
}

function clearStorage(storage: Storage, prefix?: string): void {
  if (!prefix) {
    storage.clear();
    return;
  }
  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key !== null && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => storage.removeItem(key));
}
