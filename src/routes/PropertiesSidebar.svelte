<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { hast, html, markdown, slideHasts, slides } from '../lib/source_stores';
  //import { createHtmlElement } from './utils';
  //import NestedNodeList from '../lib/components/NestedNodeList.svelte';
  import NestedHastElementList from '../lib/components/NestedHastElementList.svelte';
  import type { HastContent } from 'mdast-util-to-hast/lib/state';

  const dispatchEvent = createEventDispatcher();

  let currentSlideIndex = 0;
  let slideHastNodeGroup: HastContent[];

  // selected
  export let selected: [number, number[]?, { source: 'Preview'; timestamp: Number }?] | undefined;
  let selectedSlideIndexProp: number = 0;
  let selectedNodeIndexTrace: number[] | undefined;
  $: selectedSlideIndexProp = selected?.[0] ?? 0;
  $: selectedNodeIndexTrace = selected?.[1];
  $: console.log('🚀 selectedNodeIndexTrace:', selectedNodeIndexTrace);

  // update any change selected slide index to currentSlideIndex
  // NOTE currentSlideIndex MUST NOT be inside the reactive statement($),
  // because then this will be called whenwever it changes too.
  $: if (selectedSlideIndexProp !== undefined) {
    updateSelectedChangeToCurrent();
  }

  function updateSelectedChangeToCurrent() {
    console.log('updating current slide index:', selectedSlideIndexProp, {
      currentSlideIndex,
      selected,
    });
    if (selectedSlideIndexProp !== currentSlideIndex) {
      currentSlideIndex = selectedSlideIndexProp;
    }
  }

  //$: console.log('$hast :', $hast, { $html, $markdown, $slideHasts });
  $: slideHastNodeGroup = $slideHasts[currentSlideIndex];

  function triggerSelect(slideIndex: number, indexTrace?: number[]) {
    //currentSlideIndex = slideIndex;
    dispatchEvent('select', [
      slideIndex,
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
      bind:value={currentSlideIndex}
      on:change={(ev) => {
        console.log('change', currentSlideIndex, ev.target.value, ev);
        triggerSelect(currentSlideIndex);
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
        triggerSelect(currentSlideIndex, indexTrace);
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
