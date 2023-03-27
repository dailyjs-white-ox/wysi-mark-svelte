<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { slideHasts } from '../lib/source_stores';
  //import NestedNodeList from '../lib/components/NestedNodeList.svelte';
  import NestedHastElementList from '../lib/components/NestedHastElementList.svelte';
  import type { HastContent } from 'mdast-util-to-hast/lib/state';

  const dispatchEvent = createEventDispatcher();

  // selected
  export let selected: [number, number[]?, { source: 'Preview'; timestamp: Number }?] | undefined;
  let slideIndex: number = 0;
  $: slideIndex = selected?.[0] ?? 0;

  let selectedNodeIndexTrace: number[] | undefined;
  $: selectedNodeIndexTrace = selected?.[1];

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
        console.log('change', slideIndex, ev.target.value, ev);
        triggerSelect(ev.target.value);
      }}
    />
  </div>

  <!--<fieldset>
    <legend>Layout</legend>
  </fieldset>-->

  <h3>Nodes</h3>
  <!--{#if slideNode}
    <NestedNodeList node={slideNode} on:select={({ detail }) => dispatchEvent('select', [slideIndex, detail])} />
  {/if}-->
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
