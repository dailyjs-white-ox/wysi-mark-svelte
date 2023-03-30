<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { toHtml } from 'hast-util-to-html';
  import type { HastContent } from 'mdast-util-to-hast/lib';
  const dispatchEvent = createEventDispatcher();

  export let slideIndex = 0;
  export let isSelected = false;
  //export let slideHtml = '';
  export let hastNodes: HastContent[];
  export let selectedNodeTrace: number[] | undefined;

  let ref: HTMLElement;

  $: slideHtml = hastNodes.map((node) => toHtml(node)).join('');

  // highlight selected slide & node
  // FIXME: using vanilla javascript here. Make it more svelty.
  $: if (isSelected && selectedNodeTrace && ref) {
    const descendantNode = findDomNodeByIndexTrace(ref, selectedNodeTrace);
    if (descendantNode) {
      ref.querySelectorAll('.selected-node').forEach((el) => {
        el.classList.remove('selected-node');
      });
      if (!isElement(descendantNode)) {
        console.error('uh-oh, this is not an element', descendantNode);
      } else {
        descendantNode.classList.add('selected-node');
      }
    }
  }

  function isElement(node: Node): node is Element {
    return node.nodeType === document.ELEMENT_NODE;
  }

  function findDomNodeByIndexTrace(element: Node, indexTrace: number[]): Node | undefined {
    if (indexTrace.length === 0) return element;

    const [childIndex, ...remaining] = indexTrace;
    const childNode = element.childNodes[childIndex];
    if (!childNode) return;

    return findDomNodeByIndexTrace(childNode, remaining);
  }
</script>

<article
  bind:this={ref}
  class={`slide slide-index-${slideIndex}`}
  class:selected-slide={isSelected}
  tabindex="-1"
  on:keydown
  on:click={(ev) => {
    //console.log('click', ev.target, ev);
    const nodeIndexTrace = ev.target?.dataset['nodeIndexTrace']?.split('.').map(Number);
    if (!nodeIndexTrace) return;
    dispatchEvent('select', nodeIndexTrace);
  }}
>
  {@html slideHtml}
</article>

<style>
  article.slide {
    overflow-y: auto;
    min-width: calc(100% - 40px);
    background-color: white;
    aspect-ratio: 4 / 3;
  }
  article.selected-slide {
    outline: 2px solid #666;
  }
  article :global(.selected-node) {
    outline: 2px dashed #999;
  }
</style>
