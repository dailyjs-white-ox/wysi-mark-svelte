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
