<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let slides: string[];

  let page = 0;

  const dispatch = createEventDispatcher();

  function handleClickCloseSlide() {
    dispatch('clickCloseSlide');
  }
</script>

<div class="slide">
  <nav class="navigator">
    <button on:click={handleClickCloseSlide}>close slide</button>
    <button on:click={() => (page -= 1)} disabled={page === 0}>prev page</button>
    <button on:click={() => (page += 1)} disabled={page === slides.length - 1}>next page</button>
  </nav>
  <section>
    {@html slides[page]}
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
</style>
