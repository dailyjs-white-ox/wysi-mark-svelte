import { derived, writable, type Readable } from 'svelte/store';

export type SelectedType = [number, number[] | undefined, { source: string; timestamp: number }];

export const selecteds = writable<SelectedType[]>([]);

export const selected1 = derived(selecteds, ($selecteds) => {
  return $selecteds?.[0];
});

export const selectedNode1Index: Readable<number> = derived(selected1, ($selected1) => {
  return $selected1?.[0] ?? 0;
});

export const selectedNode1IndexTrace: Readable<number[] | undefined> = derived(
  selected1,
  ($selected1) => {
    return $selected1?.[1];
  }
);
