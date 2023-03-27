<script lang="ts">
  import { unified } from 'unified';
  import remarkParse from 'remark-parse';
  import remarkRehype from 'remark-rehype';
  import rehypeSanitize from 'rehype-sanitize';
  import rehypeStringify from 'rehype-stringify';
  import Presentation from './Presentation.svelte';
  import type { Snapshot } from './$types';
  import ContentsSidebar from './ContentsSidebar.svelte';

  export const snapshot: Snapshot<string> = {
    capture: () => source,
    restore: (snapshot: any) => {
      source = snapshot;
    },
  };

  let source = '';
  let previewHtml = '';
  let slides: string[] = [];

  let showPresentation = false;
  let showToc = true;
  let showPreview = true;

  async function generatePreview(source: string) {
    return await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeSanitize)
      .use(rehypeStringify)
      .process(source);
  }

  $: (async function () {
    const preview = await generatePreview(source);
    previewHtml = preview.value.toString();
    slides = previewHtml
      .split('<hr>')
      .map((preview) => preview.trim())
      .filter(Boolean);
  })();
</script>

{#if showPresentation}
  <Presentation on:close={() => (showPresentation = false)} bind:slides />
{:else}
  <main class:hide-toc={!showToc} class:hide-preview={!showPreview}>
    <nav class="navigator">
      <div>
        <button on:click={() => (showPresentation = true)}>Show Presentation</button>
        <button on:click={() => (showToc = !showToc)}>ToC</button>
      </div>
      <div>
        <button on:click={() => (showPreview = !showPreview)}>Preview</button>
      </div>
    </nav>
    <section class="toc">
      {#if showToc}
        <ContentsSidebar {slides} />
      {/if}
    </section>
    <section class="editor">
      <textarea bind:value={source} />
    </section>
    <section class="preview">
      {#if showPreview}
        <article>
          {@html previewHtml}
        </article>
      {/if}
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
      0;
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
    grid-area: 2 / 3 / 3 / 5;
  }

  main.hide-toc {
    --toc-width: 0;
  }
  main.hide-preview {
    --preview-width: 0;
  }

  /* --- */

  textarea {
    height: 100%;
    width: 95%;
    margin: 0px 10px;
  }
</style>
