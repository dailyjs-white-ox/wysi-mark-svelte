<script lang="ts">
  import { fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  export let slides: string[];

  type Direction = 'prev' | 'next';
  const disappearPosition = -200;

  let page = 0;
  let direction: Direction;
  let section: HTMLElement;

  const dispatch = createEventDispatcher();

  function handleClickCloseSlide() {
    dispatch('clickCloseSlide');
  }
  function handleClickPrevBtn() {
    direction = 'prev';
    page -= 1;
  }
  function handleClickNextBtn() {
    direction = 'next';
    page += 1;
  }
</script>

<div class="slide">
  <nav class="navigator">
    <button on:click={handleClickCloseSlide}>close slide</button>
    <button on:click={handleClickPrevBtn} disabled={page === 0}>prev page</button>
    <button on:click={handleClickNextBtn} disabled={page === slides.length - 1}>next page</button>
  </nav>
  <section class="transition-container" bind:this={section}>
    {#key page}
      <svelt:fragment
        in:fly={{
          x: direction === 'next' ? section.getBoundingClientRect().width : disappearPosition,
        }}
        out:fly={{
          x: direction === 'prev' ? section.getBoundingClientRect().width : disappearPosition,
        }}
      >
        {@html slides[page]}
      </svelt:fragment>
    {/key}
  </section>
</div>

<style>
  .navigator {
    padding: 8px;
    border-bottom: 1px dashed gray;
  }
  .slide {
    position: absolute;
    left: 0px;
    right: 0px;
    top: 0px;
    bottom: 0px;
    background-color: white;
  }

  /* https://imfeld.dev/writing/svelte_overlapping_transitions */
  .transition-container {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
    overflow: hidden;
  }

  .transition-container > * {
    grid-row: 1;
    grid-column: 1;
  }
</style>
