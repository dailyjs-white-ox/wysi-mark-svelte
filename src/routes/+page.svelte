<script lang="ts">
  import { onMount } from 'svelte';

  import useSessionStorageSnapshot from './use_session_storage_snapshot';
  import { markdown, html, slides } from '../lib/source_stores';
  import Slide from './Slide.svelte';
  import ContentsSidebar from './ContentsSidebar.svelte';
  import Preview from './Preview.svelte';
  import PropertiesSidebar from './PropertiesSidebar.svelte';
  import type { Snapshot } from './$types';

  let slideMode = false;
  let showToc = true;
  let showEditor = true;
  let showPreview = true;
  let showProperties = false;

  let selectedSlideIndex = 0;
  let selectedDescendantIndexList: number[] = [];

  export const snapshot: Snapshot = {
    capture: () => ({
      markdown: $markdown,
      showToc,
      showEditor,
      showProperties,
      showPreview,
    }),
    restore: ({ markdown, showToc, showProperties, showPreview }) => {
      $markdown = markdown;
      showToc = showToc;
      showEditor = showEditor;
      showProperties = showProperties;
      showPreview = showPreview;
    },
  };
  const { captureSessionStorageSnapshot, restoreSessionStorageSnapshot } =
    useSessionStorageSnapshot({
      ...snapshot,
      key: 'page:source',
    });

  function handleClickShowSlide() {
    slideMode = true;
  }
  function handleClickCloseSlide() {
    slideMode = false;
  }

  $: if ($markdown) {
    console.log('$markdown:', JSON.stringify($markdown));
    const capturedValue = captureSessionStorageSnapshot();
    console.log('🚀 capturedValue:', capturedValue);
  }

  onMount(() => {
    const restoredValue = restoreSessionStorageSnapshot();
    console.log('🚀 restoredValue:', restoredValue);
  });
</script>

{#if slideMode}
  <Slide on:clickCloseSlide={handleClickCloseSlide} bind:slides={$slides} />
{:else}
  <main
    class:hide-toc={!showToc}
    class:hide-editor={!showEditor}
    class:hide-preview={!showPreview}
    class:hide-properties={!showProperties}
  >
    <nav class="navigator">
      <div>
        <button on:click={handleClickShowSlide}>Show Slide</button>
        <button on:click={() => (showToc = !showToc)}>ToC</button>
        <button on:click={() => (showEditor = !showEditor)}>Editor</button>
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
        <Preview selected={[selectedSlideIndex, selectedDescendantIndexList]} />
      {/if}
    </section>
    <section class="properties">
      <PropertiesSidebar
        on:select={({ detail: [slideIndex, nodeDescendantIndexList] }) => {
          console.log('select:', [slideIndex, nodeDescendantIndexList]);
          selectedSlideIndex = slideIndex;
          selectedDescendantIndexList = nodeDescendantIndexList;
        }}
      />
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
      var(--toc-width, 200px)
      var(--editor-width, minmax(0, 1fr))
      var(--preview-width, minmax(0, 1fr))
      var(--properties-width, 200px);
  }
  .navigator {
    grid-area: 1 / 1 / 2 / -1;
    display: flex;
    justify-content: space-between;
    padding: 0 4px;
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
  main.hide-editor {
    --editor-width: 0;
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
