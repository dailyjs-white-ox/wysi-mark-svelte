<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { draggable } from '@neodrag/svelte';

  const dispatchEvent = createEventDispatcher();

  let className = '';
  export { className as class };
  export let borderColor: string;

  let rightPx: number | undefined = undefined;
  $: right = unlessUndefined(rightPx, (num) => `${num}px`);
  export { rightPx as right };

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

<div
  class:splitter={true}
  class={className}
  style:--border-color={borderColor}
  use:draggable={{
    axis: 'x',
  }}
  on:neodrag:start={(e) => dispatchEvent('drag:start', e.detail)}
  on:neodrag:end={(e) => dispatchEvent('drag:end', e.detail)}
>
  <!-- style:right -->
  <div class="inner-line" />
</div>

<style>
  .splitter {
    --entire-width: 5px;
    --line-width: 1px;
    --right-margin: calc((var(--entire-width) - var(--line-width)) / 2);
  }

  .splitter {
    position: absolute;
    top: 0;
    bottom: 0;
    margin-right: calc(var(--right-margin) * -1);
    width: var(--entire-width, 5px);
    pointer-events: auto;
  }
  .splitter:hover {
    cursor: ew-resize;
    background-color: rgba(255, 0, 255, 0.5);
  }

  .inner-line {
    height: 100%;
    width: var(--line-width, 1px);
    position: relative;
    right: calc(var(--right-margin) * -1);
    border-right: 1px solid var(--border-color, 'black');
  }
</style>
