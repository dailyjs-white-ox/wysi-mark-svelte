<script lang="ts">
  import { createHtmlElement } from './utils';

  export let slides: string[] = [];

  function contentTitle(htmlSource: string): string {
    const { body } = createHtmlElement(htmlSource);
    if (!body) return '';

    const headingEl = body.querySelector('h1,h2,h3,h4,h5,h6');
    if (headingEl !== null) {
      return headingEl.textContent ?? '';
    }

    // return first printable line
    const node = [...body.childNodes].find((node) => node.textContent);
    if (node) {
      return node.textContent ?? '';
    }

    return '';
  }
</script>

<aside>
  <ol>
    {#each slides as html}
      {@const title = contentTitle(html)}
      <li>
        <span class="title" {title}>{title}</span>
      </li>
    {/each}
  </ol>
</aside>

<style>
  aside {
    height: 100%;
    padding: 0 8px;
    border-right: 1px solid black;
  }
  ol {
    overflow: auto;
  }
  .title {
    white-space: nowrap;
  }
</style>
