<script lang="ts">
  import { draggable } from '@neodrag/svelte';

  let className = '';
  export { className as class };

  let leftPx: number | undefined = undefined;
  let rightPx: number | undefined = undefined;
  export { leftPx as left };
  export { rightPx as right };
  $: left = leftPx === undefined ? undefined : `${leftPx}px`;
  $: right = rightPx === undefined ? undefined : `${rightPx}px`;

  export let borderColor: string;
</script>

<div
  class:splitter={true}
  class={className}
  use:draggable={{ axis: 'x' }}
  style:--border-color={borderColor}
  style:left
  style:right
  data-right-px={rightPx}
/>

<style>
  .splitter {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    pointer-events: auto;
    border-left: 1px solid var(--border-color, 'black');
  }
</style>
