<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { draggable } from '@neodrag/svelte';

  type DragEventData = {
    /** How much element moved from its original position horizontally */
    offsetX: number;
    /** How much element moved from its original position vertically */
    offsetY: number;
    /** The node on which the draggable is applied */
    rootNode: HTMLElement;
    /** The element being dragged */
    currentNode: HTMLElement;
  };

  const dispatchEvent = createEventDispatcher<{
    'drag:start': DragEventData;
    'drag:end': DragEventData;
    drag: DragEventData;
  }>();

  let className = '';
  export { className as class };
  export let borderColor: string | undefined = undefined;

  export let disabled = false;
  export let visible = true;

  export let left: number | string | undefined = undefined;

  let leftPx: number | undefined = undefined;
  export { leftPx as left };

  let widthPx: number | undefined = undefined;
  $: width = unlessUndefined(widthPx, (value) => `${value}px`);
  export { widthPx as width };

  function unlessUndefined<T, S>(value: T | undefined, getter: (value: T) => S): S | undefined {
    if (typeof value === 'undefined') {
      return value;
    }
    return getter(value);
  }
</script>

{#if visible}
  <div
    class:splitter={true}
    class:disabled
    class={className}
    style:--border-color={borderColor}
    style={width === undefined ? '' : `--line-width={width}`}
    use:draggable={{
      axis: 'x',
      position: { x: leftPx ?? 0, y: 0 },
      disabled,
    }}
    on:neodrag:start={(e) => dispatchEvent('drag:start', e.detail)}
    on:neodrag:end={(e) => dispatchEvent('drag:end', e.detail)}
    on:neodrag={(e) => dispatchEvent('drag', e.detail)}
  >
    <div class="inner-line" />
  </div>
  {#if phantom}
    <div bind:this={phantomEl} class="splitter phantom" style:visibility="hidden" style:left />
  {/if}
{/if}

<style>
  .splitter {
    --entire-width: 5px;
    --line-width: 1px;
    --left-margin: calc((var(--entire-width) - var(--line-width)) / 2);
  }

  .splitter {
    position: absolute;
    top: 0;
    bottom: 0;
    margin-left: calc(var(--left-margin) * -1);
    width: var(--entire-width, 5px);
    pointer-events: auto;
  }
  .splitter:hover {
    cursor: col-resize;
    background-color: rgba(255, 0, 255, 0.5);
  }

  .inner-line {
    height: 100%;
    width: var(--line-width, 1px);
    position: relative;
    left: var(--left-margin);
    border-left: 1px solid var(--border-color, 'black');
  }
</style>
