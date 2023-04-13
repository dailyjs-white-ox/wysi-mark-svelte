<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { slides, slideHasts } from '$lib/source_stores';
  import PreviewSlide from './PreviewSlide.svelte';
  import { buildSlideIndexClassName } from './utils';
  import {
    selected1,
    selectedNodeIndexTracesMap,
    selecteds,
    type SelectedType,
  } from '$lib/selected_stores';

  const dispatchEvent = createEventDispatcher<{
    select: SelectedType;
    'select:more': SelectedType;
  }>();

  let slideIndex: number = 0;
  let selectedNodeIndexTrace: number[] | undefined;
  $: slideIndex = $selected1?.[0] ?? 0;
  $: selectedNodeIndexTrace = $selected1?.[1];

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
  function triggerSelectMore(slideIndex: number | string, indexTrace?: number[]) {
    dispatchEvent('select:more', [
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
    const selectedSlide = ref?.querySelector(`.${buildSlideIndexClassName(slideIndex)}`);
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
      on:change={(ev) => triggerSelect(ev.target.value)}
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
      {@const selectedNodeTraces = $selectedNodeIndexTracesMap[index] ?? []}
      <PreviewSlide
        slideIndex={index}
        hastNodes={nodeGroup}
        {isSelected}
        {selectedNodeTraces}
        on:select={({ detail }) => triggerSelect(index, detail)}
        on:select:more={({ detail }) => triggerSelectMore(index, detail)}
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
    scroll-snap-type: x mandatory;
  }

  input[type='number'][name='slide-index'] {
    width: 3em;
  }
</style>
