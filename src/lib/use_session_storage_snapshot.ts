import type { Snapshot } from '@sveltejs/kit';

export default useSessionStorageSnapshot;

type ReturnType = {
  captureSessionStorageSnapshot: Function;
  restoreSessionStorageSnapshot: Function;
  resetSessionStorageSnapshot: Function;
};

function useSessionStorageSnapshot<T>(
  key: string,
  snapshotToSessionStorage: Snapshot<T>
): ReturnType;
function useSessionStorageSnapshot<T>(
  snapshotToSessionStorage: Snapshot<T> & {
    key: string;
  }
): ReturnType;
function useSessionStorageSnapshot<T>(
  arg1:
    | string
    | (Snapshot<T> & {
        key: string;
      }),
  arg2?: Snapshot<T>
): ReturnType {
  let key: string;
  let snapshot: Snapshot<T>;
  if (typeof arg1 === 'string') {
    key = arg1;
    snapshot = arg2 as Snapshot<T>;
  } else {
    const { key: _key, ...rest } = arg2 as Snapshot<T> & { key: string };
    key = _key;
    snapshot = rest;
  }

  const { capture, restore } = snapshot;

  function captureSessionStorageSnapshot() {
    if (typeof sessionStorage == 'undefined') return;
    const value = capture();
    sessionStorage[key] = JSON.stringify(value);
    return value;
  }

  function restoreSessionStorageSnapshot() {
    if (!sessionStorage.hasOwnProperty(key)) return;

    const rowValue = sessionStorage[key];
    const value = JSON.parse(rowValue);
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
