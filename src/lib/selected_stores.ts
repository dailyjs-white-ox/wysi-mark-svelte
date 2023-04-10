import { derived, writable } from 'svelte/store';

export type SelectedType = [number, number[] | undefined, { source: string; timestamp: number }];

export const selecteds = writable<SelectedType[]>([]);

export const selected1 = derived(selecteds, ($selecteds) => {
  return $selecteds?.[0];
});
