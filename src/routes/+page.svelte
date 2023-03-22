<script lang="ts">
  import { unified } from 'unified';
  import remarkParse from 'remark-parse';
  import remarkRehype from 'remark-rehype';
  import rehypeSanitize from 'rehype-sanitize';
  import rehypeStringify from 'rehype-stringify';
  import Presentation from './Presentation.svelte';

  let source = '';
  let previewHtml = '';
  let slides: string[] = [];

  let showPresentation = false;

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
  <nav class="navigator">
    <button on:click={() => (showPresentation = true)}>Show Presentation</button>
  </nav>
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
  .editor {
    grid-area: 2 / 1 / 3 / 3;
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
