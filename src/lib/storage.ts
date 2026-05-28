export function storageGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function storageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

export function storageClear(): void {
  if (typeof window === 'undefined') return;
  localStorage.clear();
}
