<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatchEvent = createEventDispatcher();

  export let style = '';

  let element: HTMLElement;

  onMount(() => {
    const rect = element.getBoundingClientRect();
    dispatchEvent('size', rect);
  });
</script>

<div class="splitter-container" {style} bind:this={element}>
  <slot />
</div>

<style>
  .splitter-container {
    position: relative;
    pointer-events: none;
  }
</style>
