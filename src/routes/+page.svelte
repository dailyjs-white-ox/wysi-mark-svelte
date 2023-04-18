<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snapshot } from './$types';

  import { page } from '$app/stores';
  import { WELCOME_MESSAGE, markdown } from '$lib/source_stores';
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
  import { getGistContent } from '$lib/utils/gist';
  // import { hasMissingThematicBreaks, insertThematicBreaksBeforeEachHeadings, } from '$lib/source_helpers';

  let showPresentation = false;
  let showToc = true;
  let showEditor = true;
  let showPreview = true;
  let showProperties = false;

  let tocWidth = 200;
  let propertiesWidth = 200;
  let prevTocWidth = tocWidth;
  let prevPropertiesWidth = propertiesWidth;

  let editorWidthRatio = 0.5;
  let prevEditorWidthRatio = editorWidthRatio;
  let _previewWidthRatio: number; // soley depends on editorWidthRatio
  $: _previewWidthRatio = 1.0 - editorWidthRatio;
  $: console.log('🚀 _previewWidthRatio:', _previewWidthRatio);

  // update tocWidth on showToc
  $: {
    if (!showToc) {
      prevTocWidth = tocWidth;
      tocWidth = 0;
    } else {
      tocWidth = prevTocWidth;
    }
  }

  // update propertiesWidth on showProperties
  $: {
    if (!showProperties) {
      prevPropertiesWidth = propertiesWidth;
      propertiesWidth = 0;
    } else {
      propertiesWidth = prevPropertiesWidth;
    }
  }

  $: editorWidthRatio = updateEditorWidthRatioOnShowEditor(showEditor);
  $: editorWidthRatio = updateEditorWidthRatioOnShowPreview(showPreview);

  function updateEditorWidthRatioOnShowEditor(showEditor: boolean) {
    if (showEditor) {
      if (showPreview) {
        editorWidthRatio = prevEditorWidthRatio;
      } else {
        editorWidthRatio = 1.0;
      }
    } else {
      prevEditorWidthRatio = editorWidthRatio;
      editorWidthRatio = 0.0;
    }
    console.log(
      '🚀 ~ file: +page.svelte:69 ~ updateEditorWidthRatioOnShowEditor ~ editorWidthRatio:',
      editorWidthRatio,
      {
        showEditor,
        showPreview,
        prevEditorWidthRatio,
      }
    );
    return editorWidthRatio;
  }

  function updateEditorWidthRatioOnShowPreview(showPreview: boolean) {
    if (showPreview) {
      if (showEditor) {
        editorWidthRatio = prevEditorWidthRatio;
      } else {
        editorWidthRatio = 0.0;
      }
    } else {
      prevEditorWidthRatio = editorWidthRatio;
      editorWidthRatio = 1.0;
    }
    console.log(
      '🚀 ~ file: +page.svelte:92 ~ updateEditorWidthRatioOnShowPreview ~ editorWidthRatio:',
      editorWidthRatio,
      {
        showEditor,
        showPreview,
        prevEditorWidthRatio,
      }
    );
    return editorWidthRatio;
  }

  // update editorWidthRatio on showEditor / showPreview
  $: {
    if (showEditor && showPreview) {
    } else if (showEditor && !showPreview) {
    } else if (!showEditor && showPreview) {
    }
    // never.
    else {
    }
  }

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
      console.log('🚀 ~ file: +page.svelte:88 ~ state:', state);

      $markdown = state.markdown || WELCOME_MESSAGE;
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
    showToc = !showToc;
  }

  function toggleShowProperties() {
    showProperties = !showProperties;
  }

  function toggleShowEditor() {
    showEditor = !showEditor;
  }

  function toggleShowPreview() {
    showPreview = !showPreview;
  }

  async function handleGistPage(pageHash: string): Promise<boolean> {
    let gistContent = await getGistContent(pageHash);
    if (!gistContent) {
      return false;
    }

    // // ask to insert slide delimiter
    // const hasMissingBreak = hasMissingThematicBreaks(gistContent);
    // if (hasMissingBreak) {
    //   const yes = confirm('Insert slide delimiters?');
    //   if (yes) {
    //     gistContent = insertThematicBreaksBeforeEachHeadings(gistContent);
    //   }
    // }

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
      <div class="left">
        <button aria-pressed={showToc} on:click={toggleShowToc}>ToC</button>
        <button aria-pressed={showEditor} on:click={toggleShowEditor} disabled={!showPreview}
          >Editor</button
        >
        <button aria-pressed={showPreview} on:click={toggleShowPreview} disabled={!showEditor}
          >Preview</button
        >
        <button aria-pressed={showProperties} on:click={toggleShowProperties}>Properties</button>
      </div>
      <div class="right">
        <button on:click={() => (showPresentation = true)}>Presentation</button>
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
    --navbar-height: 40px;
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
    grid-template-rows: var(--navbar-height) 1fr;
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
    grid-area: nav;
    display: flex;
    justify-content: space-between;
    padding: 0 4px;
    /* style */
    background-color: #676778;
    color: white;
  }
  .navigator > div {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .navigator button {
    height: 24px;
    position: relative;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.5);
  }
  .navigator button[aria-pressed='true'] {
    top: 1px;
    left: 1px;
    box-shadow: none;
  }
  .navigator button:disabled {
    background-color: rgba(239, 239, 239, 0.7);
    color: rgba(16, 16, 16, 0.7);
    border-color: rgba(118, 118, 118, 0.1);
  }

  .toc {
    grid-area: toc;
  }
  .editor {
    grid-area: editor;
  }
  .preview {
    grid-area: preview;
  }
  .properties {
    grid-area: properties;
  }

  main.hide-editor {
    --editor-width: 0;
  }
  main.hide-preview {
    --preview-width: 0;
  }
</style>
