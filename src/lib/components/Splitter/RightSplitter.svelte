<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import type { Writable } from 'svelte/store';

  import LeftSplitter from './LeftSplitter.svelte';

  const dispatchEvent = createEventDispatcher();

  const rect = getContext<Writable<DOMRect>>('splitter');

  export let right: number | undefined = undefined;
  $: left = right === undefined ? undefined : $rect.width - right;

  // make sure left is re-calculated on rect change (such as resize)
  rect.subscribe(($rect) => {
    const prevLeft = left;
    left = right === undefined ? undefined : $rect.width - right;
    console.log('resize, recomputing left:', Math.floor(prevLeft), '=>', Math.floor(left), {
      $rect,
      right,
    });
  });
</script>

<LeftSplitter
  {left}
  {...$$restProps}
  on:drag:start
  on:drag:end
  on:drag
  on:drag:end={({ detail }) => {
    const offsetRight = $rect.width - detail.offsetX;
    dispatchEvent('drag:end:right', { ...detail, offsetRight, rect: $rect });
  }}
/>
