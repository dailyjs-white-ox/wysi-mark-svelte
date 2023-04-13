<script lang="ts">
  import { onMount } from 'svelte';

  import { markdown } from '$lib/source_stores';
  import { selecteds, type SelectedType } from '$lib/selected_stores';
  import useSessionStorageSnapshot from '$lib/use_session_storage_snapshot';
  import Preview from '$lib/components/Preview/Preview.svelte';
  import Presentation from './Presentation.svelte';
  import ContentsSidebar from './ContentsSidebar.svelte';
  import PropertiesSidebar from '../lib/components/PropertiesSidebar/PropertiesSidebar.svelte';
  import Textarea from '$lib/components/Editor/Textarea.svelte';
  import CodeMirror5Editor from '$lib/components/Editor/CodeMirror5/Editor.svelte';
  import Splitter from '$lib/components/Splitter/LeftSplitter.svelte';
  import RightSplitter from '$lib/components/Splitter/RightSplitter.svelte';
  import SplitContainer from '$lib/components/Splitter/Container.svelte';
  import type { Snapshot } from './$types';

  let showPresentation = false;
  let showToc = true;
  let showEditor = true;
  let showPreview = true;
  let showProperties = false;

  let tocWidth = 200;
  let propertiesWidth = 200;
  let prevTocWidth = tocWidth;
  let prevPropertiesWidth = propertiesWidth;
  $: propertiesWidth = showProperties ? 200 : 0;
  $: tocWidth = showToc ? 200 : 0;

  let editorWidthRatio = 0.5;

  export const snapshot: Snapshot = {
    capture: () => ({
      markdown: $markdown,
      showToc,
      showEditor,
      showProperties,
      showPreview,
    }),
    restore: (state) => {
      $markdown = state.markdown ?? '';
      showToc = state.showToc;
      showEditor = state.showEditor;
      showProperties = state.showProperties;
      showPreview = state.showPreview;
    },
  };
  const { captureSessionStorageSnapshot, restoreSessionStorageSnapshot } =
    useSessionStorageSnapshot('wysimark:page', snapshot);

  function handleSelect({ detail }: { detail: SelectedType }) {
    $selecteds = [detail];
  }
  function handleSelectMore({ detail }: { detail: SelectedType }) {
    $selecteds.push(window.structuredClone(detail));
    $selecteds = $selecteds;
  }

  function toggleShowToc() {
    // showToc = !showToc;
    if (showToc) {
      showToc = false;
      prevTocWidth = tocWidth;
      tocWidth = 0;
    } else {
      showToc = true;
      tocWidth = prevTocWidth;
    }
  }
  function toggleShowProperties() {
    if (showProperties) {
      showProperties = false;
      prevPropertiesWidth = propertiesWidth;
      propertiesWidth = 0;
    } else {
      showProperties = true;
      propertiesWidth = prevPropertiesWidth;
    }
  }

  let didMount = false;
  onMount(() => {
    const restoredValue = restoreSessionStorageSnapshot();
    didMount = true;
  });
  // run this after mount
  $: ((_$markdown, _showToc, _showEditor, _showPreview, _showProperties) => {
    if (!didMount) return;
    captureSessionStorageSnapshot();
  })($markdown, showToc, showEditor, showPreview, showProperties);
</script>

{#if showPresentation}
  <Presentation on:close={() => (showPresentation = false)} />
{:else}
  <main
    class:hide-editor={!showEditor}
    class:hide-preview={!showPreview}
    style:--toc-width={`${tocWidth}px`}
    style:--properties-width={`${propertiesWidth}px`}
  >
    <nav class="navigator">
      <div>
        <button on:click={() => (showPresentation = true)}>Show Presentation</button>
        <button on:click={toggleShowToc}>ToC</button>
        <button on:click={() => (showEditor = !showEditor)}>Editor</button>
      </div>
      <div>
        <button on:click={() => (showPreview = !showPreview)}>Preview</button>
        <button on:click={toggleShowProperties}>Properties</button>
      </div>
    </nav>

    <section class="toc" aria-label="table of contents">
      {#if showToc}
        <ContentsSidebar on:select={handleSelect} on:select:more={handleSelectMore} />
      {/if}
    </section>

    <section class="editor" aria-label="source editor">
      <!-- <Textarea /> -->
      <CodeMirror5Editor bind:value={$markdown} />
    </section>

    <section class="preview" aria-label="preview" style:border-left="1px solid #676778">
      {#if showPreview}
        <Preview on:select={handleSelect} on:select:more={handleSelectMore} />
      {/if}
    </section>

    <section class="properties" aria-label="properties">
      <PropertiesSidebar on:select={handleSelect} on:select:more={handleSelectMore} />
    </section>

    <SplitContainer style="grid-area: 2 / 1 / 3 / 5;" let:rect>
      {#if showToc}
        <Splitter
          class="toc-splitter"
          borderColor="red"
          left={tocWidth}
          on:drag:end={({ detail }) => {
            tocWidth = detail.offsetX;
          }}
        />
      {/if}
      {#if showPreview}
        <Splitter
          class="preview-splitter"
          borderColor="#676778"
          visible={false}
          left={`calc((100% - ${tocWidth}px - ${propertiesWidth}px) * ${editorWidthRatio})`}
          on:drag:end={({ detail }) => {
            console.log('🚀 ~ file: +page.svelte:156 ~ detail:', detail.offsetX, { detail, rect });
            // editorWidthRatio = detail.offsetX - tocWidth;
            editorWidthRatio = detail.offsetX / (rect.width - tocWidth - propertiesWidth);
          }}
        />
      {/if}
      {#if showProperties}
        <RightSplitter
          class="properties-splitter"
          borderColor="red"
          right={propertiesWidth}
          on:drag:end:right={({ detail }) => {
            propertiesWidth = detail.offsetRight;
          }}
        />
      {/if}
    </SplitContainer>
  </main>
{/if}

<style>
  /* custom properties */
  main {
    --toc-width: 200px;
    --properties-width: 200px;
    --editor-width: minmax(0, 1fr);
    --preview-width: minmax(0, 1fr);
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

  main.hide-editor {
    --editor-width: 0;
  }
  main.hide-preview {
    --preview-width: 0;
  }
</style>
