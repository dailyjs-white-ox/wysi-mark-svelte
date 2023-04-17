<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import { draggable } from '@neodrag/svelte';
  import { getContext } from 'svelte';
  import type { Readable } from 'svelte/store';

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

  export let disabled = false;
  export let visible = true;

  export let left: number | string | undefined = undefined;
  let leftPx: number | undefined = undefined;

  let widthPx: number | undefined = undefined;
  $: width = unlessUndefined(widthPx, (value) => `${value}px`);
  export { widthPx as width };

  export let borderColor: string | undefined = undefined;
  export let backgroundColor: string | undefined = undefined;

  let phantom = false;
  let phantomEl: HTMLElement;
  $: if (typeof left === 'string') {
    updateLeftPx(left);
  } else {
    leftPx = left;
  }

  const rect = getContext<Readable<DOMRect>>('splitter');
  rect.subscribe(($rect) => {
    if (!$rect) return;
    if (typeof left === 'string') {
      updateLeftPx(left);
    }
  });

  async function updateLeftPx(left: string) {
    getPhantomLeft(left).then((value) => {
      leftPx = value;
    });
  }

  async function getPhantomLeft(left: string) {
    phantom = true;
    await tick();

    const phantomRect = phantomEl?.getBoundingClientRect();
    if (!phantomRect) return;
    phantom = false;

    return phantomRect.left;
  }

  function mapStyles(styleTuples: [string, string | undefined][]): string {
    return styleTuples
      .filter(([_key, value]) => value)
      .map(([k, v]) => `${k}:${v}`)
      .join(';');
  }

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
    style={mapStyles([
      ['--line-width', width],
      ['--border-color', borderColor],
      ['--background-color', backgroundColor],
    ])}
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
  .splitter:not(.disabled):hover {
    cursor: col-resize;
    background-color: var(--background-color, rgba(255, 0, 255, 0.5));
  }

  .inner-line {
    height: 100%;
    width: var(--line-width, 1px);
    position: relative;
    left: var(--left-margin);
    border-left: 1px solid var(--border-color, 'black');
  }
</style>
