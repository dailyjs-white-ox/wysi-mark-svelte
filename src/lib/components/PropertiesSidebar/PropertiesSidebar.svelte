<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { slideHasts, type SlideHastNode } from '$lib/source_stores';
  import NestedHastElementList from '$lib/components/NestedHastElementList.svelte';
  import {
    selectedNode1Index,
    //selectedNodeIndexTracesMap,
    selectedNodeIndexTracesWithSourceMap,
    type NodeIndexTrace,
    type SelectedSourceDetail,
  } from '$lib/selected_stores';
  import type { SelectedType } from '$lib/selected_stores';
  import StylesProperty from './StylesProperty.svelte';

  const dispatchEvent = createEventDispatcher<{
    select: SelectedType;
    'select:more': SelectedType;
  }>();

  $: slideIndex = $selectedNode1Index;

  let slideHastNodeGroup: SlideHastNode[];
  $: slideHastNodeGroup = $slideHasts[slideIndex];

  //$: currentSlideSelectedIndexTraces = $selectedNodeIndexTracesMap[slideIndex] ?? [];
  let currentSlideSelectedIndexTraces2: [NodeIndexTrace, SelectedSourceDetail][];
  $: {
    currentSlideSelectedIndexTraces2 = $selectedNodeIndexTracesWithSourceMap[slideIndex] ?? [];
  }

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
      selectedNodeIndexTraces2={currentSlideSelectedIndexTraces2}
      on:select={({ detail: indexTrace }) => triggerSelect(slideIndex, indexTrace)}
      on:select:more={({ detail: indexTrace }) => triggerSelectMore(slideIndex, indexTrace)}
    />
    <!-- selectedNodeIndexTraces={currentSlideSelectedIndexTraces} -->
  {/if}

  {#if currentSlideSelectedIndexTraces2.length > 0}
    <h3>Styles</h3>
    {#if currentSlideSelectedIndexTraces2.length === 1}
      {@const nodeTrace = currentSlideSelectedIndexTraces2[0][0]}
      {@const selectedNode = findHastNodeByIndexTrace(
        slideHastNodeGroup[nodeTrace?.[0]],
        nodeTrace?.slice(1)
      )}
      {#if selectedNode && selectedNode.type === 'element'}
        <StylesProperty node={selectedNode} />
      {/if}
    {:else}
      <p>You have selected {currentSlideSelectedIndexTraces2.length} nodes</p>
    {/if}
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
