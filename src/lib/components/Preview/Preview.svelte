<script lang="ts">
  import { browser } from '$app/environment';

  import { createHtmlElement } from '../../../routes/utils';
  import { normalizeChildNodes, slides } from '../../source_stores';
  import { onMount } from 'svelte';
  import PreviewSlide from './PreviewSlide.svelte';

  export let selected: [number, number[]];
  $: selectedSlideIndex = selected?.[0];
  $: selectedDescendantIndexList = selected?.[1];

  let ref: HTMLElement;

  let currentSlideIndex = 0;
  let currentSlideNode: Node | null = null;

  $: (() => {
    if (!browser) return;

    const htmlSource = $slides[currentSlideIndex];
    currentSlideNode = createHtmlElement(htmlSource).body;
  })();

  // highlight selected slide & node
  // FIXME: using vanilla javascript here. Make it more svelty.
  $: (function selectSlideNode(selectedSlideIndex, selectedDescendantIndexList) {
    if (!ref) return;
    const selectedSlideEl = ref.querySelector(`.slide-index-${selectedSlideIndex}`);
    if (!selectedSlideEl) {
      console.warn('could not find slide index', selectedSlideIndex);
      return;
    }

    const descendant = findDescendant(selectedSlideEl, selectedDescendantIndexList);
    console.log('🚀 ~ file: Preview.svelte:37 ~ descendant:', descendant, {
      selectedDescendantIndexList,
    });
    if (descendant) {
      ref.querySelectorAll('.selected-node').forEach((el) => {
        el.classList.remove('selected-node');
      });
      if (descendant.nodeType !== document.ELEMENT_NODE) {
        console.error('uh-oh, this is not an element', descendant);
        return;
      }
      descendant.classList.add('selected-node');
    }
    selectedSlideEl.scrollIntoView({ behavior: 'smooth', inline: 'center' });

    function findDescendant(element: Node, descendantIndexList: number[]): Node | undefined {
      if (descendantIndexList.length === 0) return element;

      //const childIndex = descendantIndexList.shift();
      const [childIndex, ...remaining] = descendantIndexList;
      const childNodes = normalizeChildNodes(element);
      const childNode = childNodes[childIndex];
      if (!childNode) return;

      return findDescendant(childNode, remaining);
    }
  })(selectedSlideIndex, selectedDescendantIndexList);
</script>

<div class="preview">
  <header>
    <input type="number" name="slide-index" bind:value={currentSlideIndex} />
    <button type="button" on:click={() => (currentSlideIndex = Math.max(currentSlideIndex - 1, 0))}
      >Prev</button
    >
    <button
      type="button"
      on:click={() => (currentSlideIndex = Math.min(currentSlideIndex + 1, $slides.length - 1))}
      >Next</button
    >
  </header>

  <div class="slides-container" bind:this={ref}>
    {#each $slides as slideHtml, slideIndex}
      <PreviewSlide
        {slideIndex}
        {selectedSlideIndex}
        {slideHtml}
        on:click={(ev) => {
          console.log('click', ev);
        }}
      />

      <hr />
    {/each}
  </div>
</div>

<style>
  .preview {
    height: 100%;
    display: flex;
    flex-direction: column;

    overflow: hidden;
  }
  .slides-container {
    display: flex;
    flex-direction: row;
    gap: 8px;

    padding: 20px;
    background-color: #ccc;
    overflow-x: auto;
    overflow-y: hidden;
  }

  input[type='number'][name='slide-index'] {
    width: 3em;
  }
</style>
