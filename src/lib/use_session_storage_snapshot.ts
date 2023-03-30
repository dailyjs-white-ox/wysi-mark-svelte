import type { Snapshot } from "@sveltejs/kit";

export default function useSessionStorageSnapshot<T>(snapshotToSessionStorage: Snapshot<T> & {
  key: string,
}) {
  const { key, capture, restore } = snapshotToSessionStorage;

  function captureSessionStorageSnapshot() {
    if (typeof sessionStorage == 'undefined') return;
    const value = capture();
    sessionStorage[key] = JSON.stringify(value);
    return value;
  }

  function restoreSessionStorageSnapshot() {
    if (typeof sessionStorage == 'undefined') return;
    const value = JSON.parse(sessionStorage[key] ?? '{}');
    restore(value);
    return value;
  }

  function resetSessionStorageSnapshot() {
    if (typeof sessionStorage == 'undefined') return;
    sessionStorage.removeItem(key);
  }

  return {
    captureSessionStorageSnapshot,
    restoreSessionStorageSnapshot,
    resetSessionStorageSnapshot,
  };
}
