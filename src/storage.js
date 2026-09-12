const storagePrefix = 'flow-cast:';

export function readStored(key, fallback) {
  try {
    const value = window.localStorage.getItem(`${storagePrefix}${key}`);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    window.localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}
