<script lang="ts">
  import { onMount } from 'svelte';
  import { markdown } from '$lib/source_stores';
  import useSessionStorageSnapshot from '$lib/use_session_storage_snapshot';
  import Preview from '$lib/components/Preview/Preview.svelte';
  import Presentation from './Presentation.svelte';
  import ContentsSidebar from './ContentsSidebar.svelte';
  import PropertiesSidebar from './PropertiesSidebar.svelte';
  import type { Snapshot } from './$types';

  let showPresentation = false;
  let showToc = true;
  let showEditor = true;
  let showPreview = true;
  let showProperties = false;

  let selected: [number, number[]?, { source: 'Preview'; timestamp: Number }?] | undefined;

  export const snapshot: Snapshot = {
    capture: () => ({
      markdown: $markdown,
      showToc,
      showEditor,
      showProperties,
      showPreview,
    }),
    restore: (state) => {
      $markdown = state.markdown;
      showToc = state.showToc;
      showEditor = state.showEditor;
      showProperties = state.showProperties;
      showPreview = state.showPreview;
      // $markdown = state.markdown ?? '';
      // showToc = state.showToc ?? showToc;
      // showEditor = state.showEditor ?? showEditor;
      // showProperties = state.showProperties ?? showProperties;
      // showPreview = state.showPreview ?? showPreview;
    },
  };
  const { captureSessionStorageSnapshot, restoreSessionStorageSnapshot } =
    useSessionStorageSnapshot({
      ...snapshot,
      key: 'page:source',
    });

  function handleSelect({ detail }) {
    selected = detail;
  }

  let didMount = false;
  onMount(() => {
    const restoredValue = restoreSessionStorageSnapshot();
    didMount = true;
  });
  // run this after mount
  $: ((_$markdown, _showToc, _showEditor, _showPreview, _showProperties) => {
    if (!didMount) return;

    const capturedValue = captureSessionStorageSnapshot();
  })($markdown, showToc, showEditor, showPreview, showProperties);
</script>

{#if showPresentation}
  <Presentation on:close={() => (showPresentation = false)} />
{:else}
  <main
    class:hide-toc={!showToc}
    class:hide-editor={!showEditor}
    class:hide-preview={!showPreview}
    class:hide-properties={!showProperties}
  >
    <nav class="navigator">
      <div>
        <button on:click={() => (showPresentation = true)}>Show Presentation</button>
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
        <ContentsSidebar {selected} on:select={handleSelect} />
      {/if}
    </section>
    <section class="editor">
      <textarea bind:value={$markdown} />
    </section>
    <section class="preview">
      {#if showPreview}
        <Preview {selected} on:select={handleSelect} />
      {/if}
    </section>
    <section class="properties">
      <PropertiesSidebar {selected} on:select={handleSelect} />
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
  .editor form {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .editor .buttons {
    display: flex;
    justify-content: flex-end;
  }

  textarea {
    height: 100%;
    width: 95%;
    margin: 0px 10px;
  }
</style>
