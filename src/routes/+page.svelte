<script lang="ts">
  import { unified } from 'unified';
  import remarkParse from 'remark-parse';
  import remarkRehype from 'remark-rehype';
  import rehypeSanitize from 'rehype-sanitize';
  import rehypeStringify from 'rehype-stringify';
  import Slide from './Slide.svelte';
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
  let slideMode = false;
  let slides: string[] = [];

  let showToc = true;
  let showPreview = true;

  function handleClickShowSlide() {
    slideMode = true;
  }
  function handleClickCloseSlide() {
    slideMode = false;
  }

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
      .filter((str) => Boolean(str));
  })();
</script>

{#if slideMode}
  <Slide on:clickCloseSlide={handleClickCloseSlide} bind:slides />
{:else}
  <main>
    <nav class="navigator">
      <div>
        <button on:click={handleClickShowSlide}>Show Slide</button>
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
        {@html previewHtml}
      {/if}
    </section>
  </main>
{/if}

<style>
  main {
    display: grid;
    grid-template-rows: 50px 1fr;
    grid-template-columns: repeat(4, minmax(0, 1fr));
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
  textarea {
    height: 100%;
    width: 95%;
    margin: 0px 10px;
  }
</style>
