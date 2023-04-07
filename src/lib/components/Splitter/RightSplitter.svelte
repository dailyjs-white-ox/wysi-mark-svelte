<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import type { Writable } from 'svelte/store';

  import LeftSplitter from './LeftSplitter.svelte';

  const dispatchEvent = createEventDispatcher();

  // rect may be passed as a prop, or through context
  const rectStore = getContext<Writable<DOMRect>>('splitter');
  export let rect: DOMRect = $rectStore; // this is optional

  export let right: number | undefined = undefined;
  $: left = right === undefined ? undefined : rect.width - right;

  // make sure left is re-calculated on rect change (such as resize)
  rectStore.subscribe(($rect) => {
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
    const offsetRight = rect.width - detail.offsetX;
    dispatchEvent('drag:end:right', { ...detail, offsetRight, rect });
  }}
/>
