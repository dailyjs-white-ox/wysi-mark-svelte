<script lang="ts">
  import { onMount } from 'svelte';
  import { draggable } from '@neodrag/svelte';

  import { markdown } from '$lib/source_stores';
  import useSessionStorageSnapshot from '$lib/use_session_storage_snapshot';
  import Preview from '$lib/components/Preview/Preview.svelte';
  import Presentation from './Presentation.svelte';
  import ContentsSidebar from './ContentsSidebar.svelte';
  import PropertiesSidebar from './PropertiesSidebar.svelte';
  import Textarea from '$lib/components/Editor/Textarea.svelte';
  import CodeMirror5Editor from '$lib/components/Editor/CodeMirror5/Editor.svelte';
  import type { Snapshot } from './$types';
  import Splitter from '$lib/components/Splitter.svelte';

  let showPresentation = false;
  let showToc = true;
  let showEditor = true;
  let showPreview = true;
  let showProperties = false;

  let selected: [number, number[]?, { source: 'Preview'; timestamp: Number }?] | undefined;

  let tocWidth = 200;
  let propertiesWidth = 200;
  $: propertiesWidth = showProperties ? 200 : 0;

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
    style:--toc-width={`${tocWidth}px`}
    style:--properties-width={`${propertiesWidth}px`}
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
      <!-- <Textarea bind:value={$markdown} /> -->
      <CodeMirror5Editor {selected} bind:value={$markdown} />
    </section>
    <section class="preview">
      {#if showPreview}
        <Preview {selected} on:select={handleSelect} />
      {/if}
    </section>

    <section class="properties">
      <PropertiesSidebar {selected} on:select={handleSelect} />
    </section>

    <div class="splitter-container">
      {#if showToc}
        <Splitter class="toc" borderColor="red" left={tocWidth} />
      {/if}
      {#if showProperties}
        <Splitter class="properties" borderColor="red" right={propertiesWidth} />
      {/if}
    </div>
  </main>
{/if}

<style>
  /* custom properties */
  main {
    --toc-width: 200px;
    --properties-width: 200px;
  }
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
      var(--toc-width, 0)
      var(--editor-width, minmax(0, 1fr))
      var(--preview-width, minmax(0, 1fr))
      var(--properties-width, 0);
    grid-template-areas:
      'nav nav nav nav'
      'toc editor preview properties'
      'footer footer footer footer';
  }
  .navigator {
    /* grid-area: 1 / 1 / 2 / -1; */
    grid-area: nav;
    display: flex;
    justify-content: space-between;
    padding: 0 4px;
    /* style */
    background-color: #676778;
    color: white;
  }
  .toc {
    /* grid-area: 2 / 1 / 3 / 2; */
    grid-area: toc;
  }
  .editor {
    /* grid-area: 2 / 2 / 3 / 3; */
    grid-area: editor;
  }
  .preview {
    /* grid-area: 2 / 3 / 3 / 4; */
    grid-area: preview;
  }
  .properties {
    /* grid-area: 2 / 4 / 3 / 5; */
    grid-area: properties;
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

  .splitter-container {
    grid-area: 2 / 1 / 3 / 5;
    position: relative;
    pointer-events: none;
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
</style>
