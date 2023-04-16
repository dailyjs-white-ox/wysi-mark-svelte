<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { toHtml } from 'hast-util-to-html';
  import Prism from 'prismjs';

  import { buildSlideIndexClassName } from './utils';
  import type { HastContent } from 'mdast-util-to-hast/lib';
  import type { WithTarget } from '$lib/utils/types';

  const dispatchEvent = createEventDispatcher<{
    select: number[];
    'select:more': number[];
  }>();

  export let slideIndex = 0;
  export let isSelected = false;
  export let hastNodes: HastContent[];
  export let selectedNodeTraces: number[][];
  let ref: HTMLElement;

  $: slideHtmls = hastNodes.map((node) => toHtml(node));

  // toggle class for selected nodes
  // FIXME: using vanilla DOM javascript here. Make it more svelty.
  $: if (slideHtmls && selectedNodeTraces && ref) {
    ref.querySelectorAll('.selected-node').forEach((el) => {
      el.classList.remove('selected-node');
    });
    if (isSelected) {
      tick().then(() => {
        const selectedEls =
          selectedNodeTraces
            .map((nodeTrace) => {
              const descendant = findDomNodeByIndexTrace(ref, nodeTrace);
              if (!descendant) return;
              if (descendant.nodeType !== document.ELEMENT_NODE) {
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
  }

  function findDomNodeByIndexTrace(element: Node, indexTrace: number[]): Node | undefined {
    if (indexTrace.length === 0) return element;

    const [childIndex, ...remaining] = indexTrace;
    const childNode = element.childNodes[childIndex];
    if (!childNode) return;

    return findDomNodeByIndexTrace(childNode, remaining);
  }

  function handleClick(ev: WithTarget<MouseEvent, HTMLElement>) {
    if (!ev.target) return;
    const target = ev.target as HTMLElement;

    const nodeIndexTrace = target.dataset['nodeIndexTrace']?.split('.').map(Number);
    if (!nodeIndexTrace) return;

    // specific
    if (target.tagName === 'CODE' && target.parentElement?.tagName === 'PRE') {
      nodeIndexTrace.pop();
    }
    if (target.tagName === 'DIV') {
      // li > .inner-wrapper
      if (target.classList.contains('li-inner-wrapper') && target.parentElement?.tagName === 'LI') {
        // nodeIndexTrace.pop();
      }
    }

    if (ev.metaKey) {
      dispatchEvent('select:more', nodeIndexTrace);
    } else {
      dispatchEvent('select', nodeIndexTrace);
    }
  }
  onMount(() => {
    Prism.highlightAll();
  });
</script>

<article
  bind:this={ref}
  class={buildSlideIndexClassName(slideIndex)}
  class:slide={true}
  class:selected-slide={isSelected}
  tabindex="-1"
  on:keydown
  on:click|preventDefault={handleClick}
>
  {#each slideHtmls as slideHtml}
    {@html slideHtml}
  {/each}
</article>

<style>
  @layer system {
    article.slide {
      scroll-snap-align: center;

      overflow-y: auto;
      min-width: calc(100% - 40px);
      background-color: white;
      aspect-ratio: 4 / 3;
      user-select: text;
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
