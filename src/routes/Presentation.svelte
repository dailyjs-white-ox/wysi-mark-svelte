<script lang="ts">
  import { fly } from 'svelte/transition';
  import { createEventDispatcher, onMount } from 'svelte';
  import { slides } from '$lib/source_stores';

  type Direction = 'prev' | 'next';

  let page = 0;
  let direction: Direction;
  let section: HTMLElement;
  let slideWidth: number;

  const dispatch = createEventDispatcher();

  function handleClickPrevBtn() {
    direction = 'prev';
    page -= 1;
  }
  function handleClickNextBtn() {
    direction = 'next';
    page += 1;
  }

  onMount(() => {
    slideWidth = section.getBoundingClientRect().width;
  });
</script>

<div class="presentation">
  <nav class="navigator">
    <button on:click={() => dispatch('close')}>Exit</button>
    <button on:click={handleClickPrevBtn} disabled={page === 0}>prev page</button>
    <button on:click={handleClickNextBtn} disabled={page === $slides.length - 1}>next page</button>
  </nav>
  <section class="transition-container" bind:this={section}>
    {#key page}
      <article
        in:fly={{ x: direction === 'next' ? slideWidth : -slideWidth, duration: 400 }}
        out:fly={{ x: direction === 'prev' ? slideWidth : -slideWidth, duration: 400 }}
      >
        {@html $slides[page]}
      </article>
    {/key}
  </section>
</div>

<style>
  .navigator {
    padding: 8px;
    border-bottom: 1px dashed gray;
  }
  .presentation {
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
