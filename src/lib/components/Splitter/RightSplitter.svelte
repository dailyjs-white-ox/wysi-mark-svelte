<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import type { Readable } from 'svelte/store';

  import LeftSplitter from './LeftSplitter.svelte';

  const dispatchEvent = createEventDispatcher();

  const rect = getContext<Readable<DOMRect>>('splitter');

  export let right: number | undefined = undefined;
  $: left = right === undefined || $rect === undefined ? undefined : $rect.width - right;

  // make sure left is re-calculated on rect change (such as resize)
  rect.subscribe(($rect) => {
    if (!$rect) return;
    left = right === undefined ? undefined : $rect.width - right;
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
