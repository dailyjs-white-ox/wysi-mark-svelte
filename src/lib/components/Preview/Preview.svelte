<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  import { slides, slideHasts } from '$lib/source_stores';
  import PreviewSlide from './PreviewSlide.svelte';
  const dispatchEvent = createEventDispatcher();

  export let selected: [number, number[]?, { source: 'Preview'; timestamp: Number }?] | undefined;
  let slideIndex: number = 0;
  $: slideIndex = selected?.[0] ?? 0;
  let selectedNodeIndexTrace: number[] | undefined;
  $: selectedNodeIndexTrace = selected?.[1];

  let ref: HTMLElement;

  function triggerSelect(slideIndex: number | string, indexTrace?: number[]) {
    dispatchEvent('select', [
      Number(slideIndex),
      indexTrace,
      {
        source: 'Preview',
        timestamp: Date.now(),
      },
    ]);
  }

  // scroll into selected slide
  $: ((slideIndex) => {
    const selectedSlide = ref?.querySelector(`.slide-index-${slideIndex}`);
    if (selectedSlide) {
      selectedSlide.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  })(slideIndex);
</script>

<div class="preview">
  <header>
    <input
      type="number"
      name="slide-index"
      value={slideIndex}
      min="0"
      on:change={(ev) => {
        triggerSelect(ev.target.value);
      }}
    />
    <button
      type="button"
      on:click={() => {
        const nextSlideIndex = Math.max(slideIndex - 1, 0);
        triggerSelect(nextSlideIndex);
      }}>Prev</button
    >
    <button
      type="button"
      on:click={() => {
        const nextSlideIndex = Math.min(slideIndex + 1, $slides.length - 1);
        triggerSelect(nextSlideIndex);
      }}>Next</button
    >
  </header>

  <div class="slides-container" bind:this={ref}>
    {#each $slideHasts as nodeGroup, index}
      {@const isSelected = index === slideIndex}
      {@const selectedNodeTrace = selectedNodeIndexTrace}
      <PreviewSlide
        slideIndex={index}
        hastNodes={nodeGroup}
        {isSelected}
        {selectedNodeTrace}
        on:select={({ detail }) => triggerSelect(index, detail)}
      />

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
    align-items: flex-start;
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
