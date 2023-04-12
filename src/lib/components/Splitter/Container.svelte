<script lang="ts">
  import { createEventDispatcher, onMount, setContext } from 'svelte';
  import { writable, type Writable } from 'svelte/store';

  const dispatchEvent = createEventDispatcher();

  export let style = '';

  // let rect: DOMRect;
  let rectStore: Writable<DOMRect> = writable();

  let element: HTMLElement;

  setContext('splitter', rectStore);

  onMount(() => {
    $rectStore = element.getBoundingClientRect();
    dispatchEvent('size', rectStore);

    const resizeObserver = new ResizeObserver((_entries) => {
      $rectStore = element.getBoundingClientRect();
      dispatchEvent('size', rectStore);
    });
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  });
</script>

<div class="splitter-container" {style} bind:this={element}>
  <slot rect={$rectStore} />
</div>

<style>
  .splitter-container {
    position: relative;
    pointer-events: none;
  }
</style>
