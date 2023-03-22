<script lang="ts">
  export let slides: string[] = [];

  function contentTitle(htmlSource: string): string {
    const htmlEl = createHtmlElement(htmlSource);

    const headingEl = htmlEl.querySelector('h1,h2,h3,h4,h5,h6');
    if (headingEl !== null) {
      return headingEl.textContent ?? '';
    }

    // return first printable line
    const node = [...htmlEl.childNodes].find((node) => node.textContent);
    if (node) {
      return node.textContent ?? '';
    }

    return '';
  }

  function createHtmlElement(source: string): HTMLHtmlElement {
    const htmlEl = document.createElement('html');
    htmlEl.innerHTML = source;
    return htmlEl;
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
  ol {
    overflow: auto;
  }
  .title {
    white-space: nowrap;
  }
</style>
