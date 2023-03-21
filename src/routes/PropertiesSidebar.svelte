<script lang="ts">
  import { browser } from '$app/environment';

  import { slides } from './source_stores';
  import { createHtmlElement } from './utils';
  import NestedNodeList from './NestedNodeList.svelte';

  let slideIndex = 0;
  let htmlSource: string = '';
  let slideNode: HTMLElement;
  let parentNodes: Node[] = [];

  $: (() => {
    htmlSource = $slides[slideIndex];
    if (browser) {
      const { body } = createHtmlElement(htmlSource);
      if (!body) return;
      slideNode = body;
      parentNodes = [...slideNode.childNodes].filter((node) => node.nodeValue?.trim() !== '');
      console.log('🚀 ~ file: PropertiesSidebar.svelte:16 ~ childNodes:', parentNodes, {
        htmlSource,
      });
    }
  })();

  function getSummary(node: Node) {
    return node.nodeName;
  }

  function getContent(node: Node) {
    if (node.nodeType === document.ELEMENT_NODE) {
      return node.textContent;
    } else {
      return node.nodeValue;
    }
  }
</script>

<aside>
  <div class="row">
    slide index: <input type="number" name="slide-index" bind:value={slideIndex} />
  </div>

  <!--<fieldset>
    <legend>Layout</legend>
  </fieldset>-->

  <h3>Nodes</h3>
  {#if slideNode}
    <NestedNodeList node={slideNode} />
  {/if}
</aside>

<style>
  aside {
    height: 100%;
    padding: 0 8px;
    border-left: 1px solid black;

    user-select: none;
  }

  input[type='number'][name='slide-index'] {
    width: 3em;
  }
</style>
