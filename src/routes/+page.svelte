<script lang="ts">
  import { onMount } from 'svelte';

  import { page } from '$app/stores';
  import { markdown } from '$lib/source_stores';
  import { selecteds, selectedNode1Index, type SelectedType } from '$lib/selected_stores';
  import useSessionStorageSnapshot from '$lib/use_session_storage_snapshot';
  import Preview from '$lib/components/Preview/Preview.svelte';
  import Presentation from './Presentation.svelte';
  import ContentsSidebar from './ContentsSidebar.svelte';
  import PropertiesSidebar from '../lib/components/PropertiesSidebar/PropertiesSidebar.svelte';
  import CodeMirror5Editor from '$lib/components/Editor/CodeMirror5/Editor.svelte';
  import Splitter from '$lib/components/Splitter/LeftSplitter.svelte';
  import RightSplitter from '$lib/components/Splitter/RightSplitter.svelte';
  import SplitContainer from '$lib/components/Splitter/Container.svelte';
  import type { Snapshot } from './$types';
  import { getGistContent } from '$lib/utils/gist';
  import {
    guessSufficientThematicBreaks,
    insertThematicBreaksBeforeEachHeadings,
  } from '$lib/source_helpers';

  let showPresentation = false;
  let showToc = true;
  let showEditor = true;
  let showPreview = true;
  let showProperties = false;

  let tocWidth = 200;
  let propertiesWidth = 200;
  let prevTocWidth = tocWidth;
  let prevPropertiesWidth = propertiesWidth;
  //$: propertiesWidth = showProperties ? prevTocWidth : 0;
  //$: tocWidth = showToc ? prevTocWidth : 0;

  let editorWidthRatio = 0.5;
  let prevEditorWidthRatio = editorWidthRatio;
  let _previewWidthRatio: number; // soley depends on editorWidthRatio
  $: _previewWidthRatio = 1.0 - editorWidthRatio;

  export const snapshot: Snapshot = {
    capture: () => ({
      markdown: $markdown,
      showToc,
      showEditor,
      showProperties,
      showPreview,
      selectedSlideIndex: $selectedNode1Index,
    }),
    restore: (state) => {
      $markdown = state.markdown ?? '';
      showToc = state.showToc;
      showEditor = state.showEditor;
      showProperties = state.showProperties;
      showPreview = state.showPreview;
      if (state.selectedSlideIndex !== undefined) {
        $selecteds = [
          [
            state.selectedSlideIndex,
            undefined,
            {
              source: 'Preview',
              timestamp: Date.now(),
            },
          ],
        ];
      }
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

  function toggleShowEditor() {
    console.log('🚀 ~ toggleShowEditor ~ showEditor:', showEditor);
    if (showEditor) {
      showEditor = false;
      prevEditorWidthRatio = editorWidthRatio;
      editorWidthRatio = 0.0;
    } else {
      showEditor = true;
      editorWidthRatio = prevEditorWidthRatio;
    }
    console.log('🚀 ~ editorWidthRatio:', editorWidthRatio, { prevEditorWidthRatio });
  }

  function toggleShowPreview() {
    // turn showPreview on
    if (!showPreview) {
      showPreview = true;
      editorWidthRatio = prevEditorWidthRatio;
    }
    // turn off
    else {
      showPreview = false;
      prevEditorWidthRatio = editorWidthRatio;
      editorWidthRatio = 1.0;
    }
  }

  async function handleGistPage(pageHash: string): Promise<boolean> {
    let gistContent = await getGistContent(pageHash);
    if (!gistContent) {
      return false;
    }

    // ask to insert slide delimiter
    const hasMissingBreak = guessSufficientThematicBreaks(gistContent);
    if (hasMissingBreak) {
      const yes = confirm('Insert slide delimiters?');
      if (yes) {
        gistContent = insertThematicBreaksBeforeEachHeadings(gistContent);
      }
    }

    $markdown = gistContent;
    return true;
  }

  let didMount = false;
  onMount(async () => {
    didMount = true;

    // handle /#/gist/USERNAME/GISTID
    const pageHash = $page.url.hash.slice(1);
    if (pageHash.startsWith('/gist/')) {
      const handled = await handleGistPage(pageHash);
      if (handled) return;
    }

    const restoredValue = restoreSessionStorageSnapshot();
  });

  // run this after mount
  $: ((_$markdown, _showToc, _showEditor, _showPreview, _showProperties, _$selecteds) => {
    if (!didMount) return;
    captureSessionStorageSnapshot();
  })($markdown, showToc, showEditor, showPreview, showProperties, $selecteds);
</script>

{#if showPresentation}
  <Presentation on:close={() => (showPresentation = false)} />
{:else}
  <main
    class:hide-editor={!showEditor}
    class:hide-preview={!showPreview}
    style:--toc-width={`${tocWidth}px`}
    style:--properties-width={`${propertiesWidth}px`}
    style:--editor-width={`minmax(0, ${editorWidthRatio * 100}fr)`}
    style:--preview-width={`minmax(0, ${_previewWidthRatio * 100}fr)`}
  >
    <nav class="navigator">
      <div>
        <button on:click={() => (showPresentation = true)}>Show Presentation</button>
        <button on:click={toggleShowToc}>ToC</button>
        <button on:click={toggleShowEditor}>Editor</button>
      </div>
      <div>
        <button on:click={toggleShowPreview}>Preview</button>
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

    <section class="preview" aria-label="preview">
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
          visible={!false}
          left={`calc((100% - ${tocWidth}px - ${propertiesWidth}px) * ${editorWidthRatio} + ${tocWidth}px)`}
          on:drag:end={({ detail }) => {
            const { offsetX } = detail;
            editorWidthRatio = (offsetX - tocWidth) / (rect.width - tocWidth - propertiesWidth);
            console.log(
              '🚀 ~ file: drag:end ~ detail:',
              offsetX,
              { detail, rect },
              '=>',
              editorWidthRatio
            );
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
    user-select: none;
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
      'toc editor preview properties';
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
