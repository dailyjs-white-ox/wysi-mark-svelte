<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import { toHtml } from 'hast-util-to-html';
  import type { HastContent } from 'mdast-util-to-hast/lib';

  const dispatchEvent = createEventDispatcher<{
    select: number[];
    'select:more': number[];
  }>();

  export let slideIndex = 0;
  export let isSelected = false;
  export let hastNodes: HastContent[];
  export let selectedNodeTraces: number[][];

  let ref: HTMLElement;

  $: slideHtml = hastNodes.map((node) => toHtml(node)).join('');

  // toggle class for selected nodes
  // FIXME: using vanilla DOM javascript here. Make it more svelty.
  $: if (slideHtml && isSelected && selectedNodeTraces && ref) {
    tick().then(() => {
      ref.querySelectorAll('.selected-node').forEach((el) => {
        el.classList.remove('selected-node');
      });
      const selectedEls =
        selectedNodeTraces
          .map((nodeTrace) => {
            const descendant = findDomNodeByIndexTrace(ref, nodeTrace);
            if (!descendant) return;
            if (!isElement(descendant)) {
              console.error('uh-oh, this is not an element', descendant, { nodeTrace });
              return;
            }
            return descendant;
          })
          .filter<Element>(Boolean) ?? [];
      selectedEls.forEach((el) => {
        el.classList.add('selected-node');
      });
    });
  }

  function findDomNodeByIndexTrace(element: Node, indexTrace: number[]): Node | undefined {
    if (indexTrace.length === 0) return element;

    const [childIndex, ...remaining] = indexTrace;
    const childNode = element.childNodes[childIndex];
    if (!childNode) return;

    return findDomNodeByIndexTrace(childNode, remaining);
  }

  function isElement(node: Node): node is Element {
    return node.nodeType === document.ELEMENT_NODE;
  }
</script>

<article
  bind:this={ref}
  class={`slide slide-index-${slideIndex}`}
  class:selected-slide={isSelected}
  tabindex="-1"
  on:keydown
  on:click={(ev) => {
    const nodeIndexTrace = ev.target?.dataset['nodeIndexTrace']?.split('.').map(Number);
    if (!nodeIndexTrace) return;

    if (ev.metaKey) {
      dispatchEvent('select:more', nodeIndexTrace);
    } else {
      dispatchEvent('select', nodeIndexTrace);
    }
  }}
>
  {@html slideHtml}
</article>

<style>
  @layer system {
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
  }
  @layer default {
  }
</style>
