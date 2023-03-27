<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { browser } from '$app/environment';

  import { createHtmlElement } from '../../../routes/utils';
  import { slides, slideHasts } from '../../source_stores';
  import PreviewSlide from './PreviewSlide.svelte';
  const dispatchEvent = createEventDispatcher();

  // selected
  export let selected: [number, number[]?, { source: 'Preview'; timestamp: Number }?] | undefined;
  let selectedSlideIndex: number = 0;
  let selectedNodeIndexTrace: number[] | undefined;
  $: selectedSlideIndex = selected?.[0] ?? 0;
  $: selectedNodeIndexTrace = selected?.[1];

  let currentSlideIndex = 0;

  // update any change selected slide index to currentSlideIndex
  $: if (selectedSlideIndex !== undefined && selectedSlideIndex !== currentSlideIndex) {
    //console.log('updating current slide index:', selectedSlideIndex, { currentSlideIndex, ...selected, });
    currentSlideIndex = selectedSlideIndex;
  }

  let ref: HTMLElement;

  function triggerSelect(slideIndex: number, indexTrace?: number[]) {
    dispatchEvent('select', [
      slideIndex,
      indexTrace,
      {
        source: 'Preview',
        timestamp: Date.now(),
      },
    ]);
  }

  // scroll into selected slide
  $: ((selectedSlideIndex) => {
    console.log('🚀 ~ file: Preview.svelte:34 ~ selectedSlideIndex:', selectedSlideIndex);
    const selectedSlide = ref?.querySelector(`.slide-index-${selectedSlideIndex}`);
    if (selectedSlide) {
      selectedSlide.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  })(selectedSlideIndex);
</script>

<div class="preview">
  <header>
    <input
      type="number"
      name="slide-index"
      bind:value={currentSlideIndex}
      min="0"
      on:change={(ev) => {
        console.log('change', ev);
        triggerSelect(currentSlideIndex);
      }}
    />
    <button
      type="button"
      on:click={() => {
        currentSlideIndex = Math.max(currentSlideIndex - 1, 0);
        triggerSelect(currentSlideIndex);
      }}>Prev</button
    >
    <button
      type="button"
      on:click={() => {
        currentSlideIndex = Math.min(currentSlideIndex + 1, $slides.length - 1);
        triggerSelect(currentSlideIndex);
      }}>Next</button
    >
  </header>

  <div class="slides-container" bind:this={ref}>
    {#each $slideHasts as nodeGroup, slideIndex}
      {@const isSelected = slideIndex === selectedSlideIndex}
      {@const selectedNodeTrace = selectedNodeIndexTrace}
      <PreviewSlide
        {slideIndex}
        hastNodes={nodeGroup}
        {isSelected}
        {selectedNodeTrace}
        on:select={({ detail }) => triggerSelect(slideIndex, detail)}
      />
      <!--{slideHtml}-->

      <hr />
    {/each}
  </div>
</div>

<style>
  .preview {
    height: 100%;
    display: flex;
    flex-direction: column;

    overflow: hidden;
  }
  .slides-container {
    display: flex;
    flex-direction: row;
    gap: 8px;

    padding: 20px;
    background-color: #ccc;
    overflow-x: auto;
    overflow-y: hidden;
  }

  input[type='number'][name='slide-index'] {
    width: 3em;
  }
</style>
