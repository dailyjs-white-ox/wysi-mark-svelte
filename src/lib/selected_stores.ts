import { derived, writable, type Readable } from 'svelte/store';

export type SelectedSourceDetail = {
  source: 'Preview' | 'Contents' | 'Properties';
  timestamp: number;
};
export type NodeIndexTrace = number[];

/** SelectedType
 * [slideIndex, nodeIndexTrace, sourceDetail]
 */
export type SelectedType = [number, NodeIndexTrace | undefined, SelectedSourceDetail];

export const selecteds = writable<SelectedType[]>([]);

export const selectedNodeIndexTracesMap: Readable<{
  [slideIndex: number]: NodeIndexTrace[];
}> = derived(selecteds, ($selecteds) => {
  return $selecteds.reduce<{
    [slideIndex: number]: number[][];
  }>((memo, [slideIndex, nodeIndexTrace]) => {
    if (nodeIndexTrace === undefined) return memo;
    //
    memo[slideIndex] = memo[slideIndex] ?? [];
    memo[slideIndex].push(nodeIndexTrace);
    return memo;
  }, {});
});

export const selectedNodeIndexTracesWithSourceMap: Readable<{
  [slideIndex: number]: [NodeIndexTrace, SelectedSourceDetail][];
}> = derived(selecteds, ($selecteds) => {
  return $selecteds.reduce<{
    [slideIndex: number]: [NodeIndexTrace, SelectedSourceDetail][];
  }>((memo, [slideIndex, nodeIndexTrace, source]) => {
    if (nodeIndexTrace === undefined) return memo;
    //
    memo[slideIndex] = memo[slideIndex] ?? [];
    memo[slideIndex].push([nodeIndexTrace, source]);
    return memo;
  }, {});
});

// single selected

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
