<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatchEvent = createEventDispatcher();

  export let style = '';

  let rect: DOMRect;

  let element: HTMLElement;

  onMount(() => {
    rect = element.getBoundingClientRect();
    console.log('🚀 rect:', rect);
    dispatchEvent('size', rect);
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
