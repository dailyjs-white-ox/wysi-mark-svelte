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
  <nav class="navigator">
    <button on:click={handleClickShowSlide}>Show Slide</button>
  </nav>
  <section class="toc">
    <ContentsSidebar {slides} />
  </section>
  <section class="editor">
    <textarea bind:value={source} />
  </section>
  <section class="preview">
    {@html previewHtml}
  </section>
{/if}

<style>
  .navigator {
    grid-area: 1 / 1 / 2 / -1;
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
    height: 90%;
    width: 95%;
    margin: 0px 10px;
  }
</style>
