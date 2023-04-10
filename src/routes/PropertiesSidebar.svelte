<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { slideHasts } from '$lib/source_stores';
  import NestedHastElementList from '$lib/components/NestedHastElementList.svelte';
  import type { HastContent } from 'mdast-util-to-hast/lib/state';
  import { selected1, type SelectedType } from '$lib/selected_stores';

  const dispatchEvent = createEventDispatcher();

  // selected
  let slideIndex: number = 0;
  let selectedNodeIndexTrace: number[] | undefined;
  $: slideIndex = $selected1?.[0] ?? 0;
  $: selectedNodeIndexTrace = $selected1?.[1];

  let slideHastNodeGroup: HastContent[];

  $: slideHastNodeGroup = $slideHasts[slideIndex];

  function triggerSelect(slideIndex: string | number, indexTrace?: number[]) {
    dispatchEvent('select', [
      Number(slideIndex),
      indexTrace,
      {
        source: 'Properties',
        timestamp: Date.now(),
      },
    ]);
  }
</script>

<aside>
  <div class="row">
    slide index: <input
      type="number"
      name="slide-index"
      min="0"
      value={slideIndex}
      on:change={(ev) => {
        if (!ev.target) return;
        triggerSelect(ev.target.value);
      }}
    />
  </div>
  <h3>Nodes</h3>
  {#if slideHastNodeGroup}
    <NestedHastElementList
      hastNodes={slideHastNodeGroup}
      {selectedNodeIndexTrace}
      on:select={({ detail: indexTrace }) => {
        triggerSelect(slideIndex, indexTrace);
      }}
    />
  {/if}
</aside>

<style>
  aside {
    height: 100%;
    padding: 0 8px;
    overflow-y: auto;
    border-left: 1px solid black;
    user-select: none;
  }

  input[type='number'][name='slide-index'] {
    width: 3em;
  }
</style>
