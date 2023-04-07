<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatchEvent = createEventDispatcher();

  export let style = '';

  let rect: DOMRect;

  let element: HTMLElement;

  onMount(() => {
    rect = element.getBoundingClientRect();
    dispatchEvent('size', rect);

    const resizeObserver = new ResizeObserver((_entries) => {
      rect = element.getBoundingClientRect();
      dispatchEvent('size', rect);
    });
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  });
</script>

<div class="splitter-container" {style} bind:this={element} data-width={rect?.width}>
  <slot {rect} />
</div>

<style>
  .splitter-container {
    position: relative;
    pointer-events: none;
  }
</style>
