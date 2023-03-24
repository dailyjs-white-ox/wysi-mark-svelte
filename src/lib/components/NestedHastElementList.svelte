<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { toText } from 'hast-util-to-text';

  //import { normalizeChildNodes } from '../source_stores';
  import type { HastContent, HastElement, HastElementContent } from 'mdast-util-to-hast/lib/state';

  const dispatchEvent = createEventDispatcher();

  export let nodeGroup: HastContent[];
  $: console.log('🚀 nodeGroup:', nodeGroup);
  $: childNodes = nodeGroup;

  // ui states

  $: nodesOpen = childNodes.map(() => false);

  function firstLine(text: string | null): string {
    if (!text) return '';
    const lines = text.trim().split('\n');
    if (lines.length === 0) {
      return text;
    }
    return lines[0] + `... (${lines.length} lines)`;
  }

  function toggleOpen(index: number) {
    nodesOpen[index] = !nodesOpen[index];
  }
</script>

{#if nodeGroup}
  <ol>
    {#each childNodes as childNode, childIndex}
      <li tabindex="-1" on:focus={() => dispatchEvent('select', [childIndex])}>
        <div class="summary-content">
          {#if childNodes.length > 1}
            <span class="item-marker">{childIndex + 1}. </span>
          {/if}
          {#if childNode.type === 'element'}
            <span class="title">
              <button type="button" on:click={() => toggleOpen(childIndex)}>
                {childNode.tagName}
              </button>
            </span>
            <span class="text-content" title={firstLine(toText(childNode))}
              >{toText(childNode)}</span
            >
            <button type="button" on:click={() => toggleOpen(childIndex)}
              >{nodesOpen[childIndex] ? 'Close' : 'Open'}</button
            >
          {:else if childNode.type === 'text'}
            <textarea value={childNode.value} />
          {/if}
        </div>
        <div class="nested">
          {#if nodesOpen[childIndex]}
            <svelte:self
              nodeGroup={childNode.children}
              on:select={({ detail: indexes }) => {
                dispatchEvent('select', [childIndex].concat(indexes));
              }}
            />
          {/if}
        </div>
      </li>
    {/each}
  </ol>
{/if}

<style>
  ol {
    margin: 0;
    padding: 0;
  }
  li {
    list-style: none;
    display: flex;
    flex-direction: column;
    /*gap: 0.5em;*/

    margin: 4px 1px 4px 1px;
    padding: 2px;
  }
  li:focus {
    outline: 1px dashed #333;
  }

  .item-marker {
    flex: 0 0 auto;
  }
  .nested {
    margin-left: 0.5em;
  }

  .summary-content {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 4px;

    white-space: nowrap;
  }
  .summary-content .text-content {
    flex: 1 1 auto;

    margin-left: 0.5em;
    margin-right: 4px;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    font-size: 95%;
    color: #aaa;
  }
  .summary-content .text-content:before {
    content: '"';
  }
  .summary-content .text-content:after {
    content: '"';
  }
</style>
