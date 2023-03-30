<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { contentTitleFromHast, contentTitleFromHtml } from '$lib/source_helpers';
  import { slideHasts, type HastContent } from '$lib/source_stores';

  const dispatchEvent = createEventDispatcher();

  // selected
  export let selected: [number, number[]?, { source: 'Preview'; timestamp: Number }?] | undefined;
  let selectedSlideIndexProp: number = 0;
  $: selectedSlideIndexProp = selected?.[0] ?? 0;

  function triggerSelect(slideIndex: string | number) {
    dispatchEvent('select', [
      Number(slideIndex),
      null,
      {
        source: 'Contents',
        timestamp: Date.now(),
      },
    ]);
  }
</script>

<aside>
  <ol>
    <!--{#each $slides as html, index}-->
    <!--{@const title = contentTitleFromHtml(html)}-->
    {#each $slideHasts as nodeGroup, index}
      {@const title = contentTitleFromHast(nodeGroup)}
      <li
        class:selected={selectedSlideIndexProp === index}
        tabindex="-1"
        on:click={() => triggerSelect(index)}
        on:keydown
      >
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
    margin: 0;
    overflow: auto;
  }
  li.selected {
    outline: 2px solid #666;
  }
  .title {
    white-space: nowrap;
  }
</style>
