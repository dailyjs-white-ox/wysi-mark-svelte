<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';

  import { slides } from '../lib/source_stores';
  import { createHtmlElement } from './utils';
  import NestedNodeList from '../lib/components/NestedNodeList.svelte';

  const dispatchEvent = createEventDispatcher();

  let slideIndex = 0;
  let htmlSource: string = '';
  let slideNode: HTMLElement;

  $: (() => {
    htmlSource = $slides[slideIndex];
    if (browser) {
      const { body } = createHtmlElement(htmlSource);
      if (body) {
        slideNode = body;
      }
    }
  })();

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
    <NestedNodeList
      node={slideNode}
      on:select={({ detail: nodeDescendantIndexList }) => {
        dispatchEvent('select', [slideIndex, nodeDescendantIndexList]);
      }}
    />
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
