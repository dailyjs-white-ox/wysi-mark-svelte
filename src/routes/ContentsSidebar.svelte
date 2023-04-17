<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { contentTitleFromHast } from '$lib/source_helpers';
  import { slideHasts } from '$lib/source_stores';
  import { selectedNode1Index } from '$lib/selected_stores';
  import type { SelectedType } from '$lib/selected_stores';

  const dispatchEvent = createEventDispatcher<{ select: SelectedType }>();

  function triggerSelect(slideIndex: string | number) {
    dispatchEvent('select', [
      Number(slideIndex),
      undefined,
      {
        source: 'Contents',
        timestamp: Date.now(),
      },
    ]);
  }
</script>

<aside>
  <ol>
    {#each $slideHasts as nodeGroup, index}
      {@const title = contentTitleFromHast(nodeGroup)}
      <li
        class:selected={$selectedNode1Index === index}
        tabindex="-1"
        on:click={() => triggerSelect(index)}
        on:keydown
      >
        <span class="slide-number">{index + 1}.</span>
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
    margin: 8px 0;
    padding: 0 0 0 0px;
    overflow: auto;
  }
  li {
    margin: 4px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: #666;
    cursor: pointer;
  }
  li:hover {
    color: black;
  }
  li.selected {
    color: black;
    outline: 2px solid #666;
  }
  .slide-number {
    display: inline-block;
    min-width: 20px;
    text-align: right;
  }
</style>
