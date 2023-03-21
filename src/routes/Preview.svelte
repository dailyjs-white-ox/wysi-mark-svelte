<script>
  export let previewHtml = '';

  $: slidesHtml = previewHtml
    .split('<hr>')
    .map((preview) => preview.trim())
    .filter((str) => Boolean(str));
</script>

<!--<header> <button>Prev</button> <button>Next</button> </header>-->

<article>
  {#each slidesHtml as slideHtml}
    <div class="slide">
      {@html slideHtml}
    </div>

    <hr />
  {/each}
</article>

<style>
  article {
    display: flex;
    flex-direction: row;
  }

  .slide {
    min-width: calc(100% - 40px);
  }
</style>
