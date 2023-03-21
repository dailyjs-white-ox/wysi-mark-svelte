<script lang="ts">
  import { markdown, html, slides } from './source_stores';
  import Slide from './Slide.svelte';
  import ContentsSidebar from './ContentsSidebar.svelte';
  import Preview from './Preview.svelte';
  import useSessionSnapshotStorage from './use_session_storage_snapshot';
  import { onMount } from 'svelte';

  let slideMode = false;
  let showToc = true;
  let showPreview = true;
  let showProperties = false;

  export const snapshot: Snapshot = {
    capture: () => ({
      markdown: $markdown,
      showToc,
      showProperties,
      showPreview,
    }),
    restore: ({ markdown, showToc, showProperties, showPreview }) => {
      $markdown = markdown;
      showToc = showToc;
      showProperties = showProperties;
      showPreview = showPreview;
    },
  };


  function handleClickShowSlide() {
    slideMode = true;
  }
  function handleClickCloseSlide() {
    slideMode = false;
  }

  $: if ($markdown) {
    captureSessionStorageSnapshot();
  }
</script>

{#if slideMode}
  <Slide on:clickCloseSlide={handleClickCloseSlide} bind:slides={$slides} />
{:else}
  <main
    class:hide-toc={!showToc}
    class:hide-preview={!showPreview}
    class:hide-properties={!showProperties}
  >
    <nav class="navigator">
      <div>
        <button on:click={handleClickShowSlide}>Show Slide</button>
        <button on:click={() => (showToc = !showToc)}>ToC</button>
      </div>
      <div>
        <button on:click={() => (showPreview = !showPreview)}>Preview</button>
        <button on:click={() => (showProperties = !showProperties)}>Properties</button>
      </div>
    </nav>
    <section class="toc">
      {#if showToc}
        <ContentsSidebar slides={$slides} />
      {/if}
    </section>
    <section class="editor">
      <textarea bind:value={$markdown} />
    </section>
    <section class="preview">
      {#if showPreview}
        <Preview previewHtml={$html} />
      {/if}
    </section>
    <section class="properties">
      <PropertiesSidebar />
    </section>
  </main>
{/if}

<style>
  /* positions & sizes */
  main {
    height: 100%;
    overflow: hidden;
  }
  main > section {
    max-height: 100%;
    overflow: auto;
  }
  /* layouts */
  main {
    display: grid;
    grid-template-rows: 50px 1fr;
    grid-template-columns:
      var(--toc-width, 200px) minmax(0, 1fr) var(--preview-width, minmax(0, 1fr))
      var(--properties-width, 200px);
  }
  .navigator {
    grid-area: 1 / 1 / 2 / -1;
    display: flex;
    justify-content: space-between;
  }
  .toc {
    grid-area: 2 / 1 / 3 / 2;
  }
  .editor {
    grid-area: 2 / 2 / 3 / 3;
  }
  .preview {
    grid-area: 2 / 3 / 3 / 4;
  }
  .properties {
    grid-area: 2 / 4 / 3 / 5;
  }

  main.hide-toc {
    --toc-width: 0;
  }
  main.hide-preview {
    --preview-width: 0;
  }
  main.hide-properties {
    --properties-width: 0;
  }

  /* --- */

  textarea {
    height: 100%;
    width: 95%;
    margin: 0px 10px;
  }
</style>
