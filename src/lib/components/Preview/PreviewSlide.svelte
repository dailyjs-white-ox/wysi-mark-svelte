<script lang="ts">
  export let slideIndex = 0;
  export let selectedSlideIndex = 0;
  export let slideHtml = '';
</script>

<article
  class={`slide slide-index-${slideIndex}`}
  class:selected-slide={slideIndex === selectedSlideIndex}
  tabindex="-1"
  on:click
>
  {@html slideHtml}
</article>

<style>
  article.slide {
    overflow-y: auto;
    min-width: calc(100% - 40px);
    background-color: white;
  }
  article.selected-slide {
    outline: 2px solid #666;
  }
  article :global(.selected-node) {
    outline: 2px dashed #999;
  }
</style>
