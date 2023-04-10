<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { slideHasts } from '$lib/source_stores';
  import NestedHastElementList from '$lib/components/NestedHastElementList.svelte';
  import {
    selecteds,
    selectedNode1Index,
    selectedNodeIndexTracesMap,
    type SelectedType,
  } from '$lib/selected_stores';

  const dispatchEvent = createEventDispatcher<{
    select: SelectedType;
    'select:more': SelectedType;
  }>();

  $: slideIndex = $selectedNode1Index;

  let slideHastNodeGroup: SlideHastNode[];
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
  function triggerSelectMore(slideIndex: string | number, indexTrace?: number[]) {
    dispatchEvent('select:more', [
      Number(slideIndex),
      indexTrace,
      {
        source: 'Properties',
        timestamp: Date.now(),
      },
    ]);
  }

  function findHastNodeByIndexTrace(
    node: SlideHastNode,
    indexTrace: number[]
  ): SlideHastNode | undefined {
    if (indexTrace.length === 0) return node;
    if (node.type === 'text') return;

    const [childIndex, ...remaining] = indexTrace;
    const childNode = node.children[childIndex];
    if (!childNode) return;

    return findHastNodeByIndexTrace(childNode, remaining);
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
        triggerSelect(ev.currentTarget.value);
      }}
    />
  </div>
  <h3>Nodes</h3>
  {#if slideHastNodeGroup}
    <NestedHastElementList
      hastNodes={slideHastNodeGroup}
      selectedNodeIndexTraces={$selectedNodeIndexTracesMap[slideIndex] ?? []}
      on:select={({ detail: indexTrace }) => triggerSelect(slideIndex, indexTrace)}
      on:select:more={({ detail: indexTrace }) => triggerSelectMore(slideIndex, indexTrace)}
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
