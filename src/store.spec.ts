import { describe, it, beforeEach, expect } from 'vitest';
import { tick } from 'svelte';
import { get, writable } from 'svelte/store';
import type { Readable } from 'svelte/store';

describe('.subscribe() callback is called', () => {
  it('on subscription with current value', () => new Promise<void>((resolve) => {
    const store = writable(100);

    store.subscribe((value) => {
      expect(value).toEqual(100);
      resolve();
    });
  }));

  it('once again when set', async () => {
    const callValues: any[] = [];

    const store = writable(0);
    store.subscribe((value) => {
      callValues.push(value);
    });
    //
    store.set(1);
    await tick();

    expect(callValues.at(-1)).toEqual(1);
    expect(callValues).toEqual([0, 1]);
  });

  it('only on previous value before subscription, and afterwards', async () => {
    const callValues: any[] = [];

    const store = writable(0);
    store.set(1);
    store.set(2);
    store.set(3); // <-- from here

    store.subscribe((value) => {
      callValues.push(value);
    });

    store.set(4);
    store.set(5); // <-- upto here

    //await tick();
    await delayAsync(100);

    expect(callValues).toEqual([3, 4, 5]);
    expect(callValues.at(-1)).toEqual(5);
  });
});

// utils

async function delayAsync(ms = 0) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}
