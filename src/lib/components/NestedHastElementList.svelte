<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { toText } from 'hast-util-to-text';

  import type { HastContent, HastNodes } from 'mdast-util-to-hast/lib/state';
  import { markdown } from '$lib/source_stores';

  const dispatchEvent = createEventDispatcher();

  export let hastNodes: HastContent[];

  export let selectedNodeIndexTrace: number[] | undefined = undefined;

  // ui states

  let nodesOpen: boolean[];
  $: {
    if (hastNodes) {
      if (!nodesOpen) {
        nodesOpen = hastNodes.map(() => false);
      } else if (nodesOpen.length !== hastNodes.length) {
        nodesOpen = hastNodes.map(() => false);
      }
    }
  }

  //
  $: {
    if (selectedNodeIndexTrace && selectedNodeIndexTrace.length > 0) {
      nodesOpen[selectedNodeIndexTrace[0]] = true;
    }
  }

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

  function triggerSelect(nodeIndex: number | number[]) {
    const indexes = Array.isArray(nodeIndex) ? nodeIndex : [nodeIndex];
    dispatchEvent('select', indexes);
  }

  function onInputText(ev: InputEvent, node: HastContent) {
    console.log('🚀 ~ file: NestedHastElementList.svelte:47 ~ onInputText:', ev, node);
    const {
      position: { start, end },
    } = node;

    // node.value = ev.target.value;
    // start.offset
    // end.offset

    // `abc` => abc
    // TODO: add test here, or whatever.
    if (node.value.length === end.offset - start.offset - 2) {
      end.offset -= 1;
      start.offset += 1;
    }

    const value = ev.target.value || '.';

    const newSource = $markdown.slice(0, start.offset) + value + $markdown.slice(end.offset);
    console.log(
      '🚀 ~ file: NestedHastElementList.svelte:65 ~ onInputText ~ newSource:',
      JSON.stringify(newSource),
      {
        value,
        start,
        end,
        '±10': $markdown.slice(start.offset - 10, end.offset + 10),
        node,
      }
    );

    $markdown = newSource;
  }
</script>

{#if hastNodes}
  <ol>
    {#each hastNodes as node, index}
      {@const isTracingNode = index === (selectedNodeIndexTrace ?? [])[0]}
      {@const isNodeSelected = isTracingNode && selectedNodeIndexTrace?.length === 1}
      <li
        tabindex="-1"
        class:node-selected={isNodeSelected}
        on:focus={() => triggerSelect(index)}
        on:dblclick={() => toggleOpen(index)}
      >
        <div class="summary-content">
          {#if hastNodes.length > 1}
            <span class="item-marker">{index + 1}. </span>
          {/if}
          {#if node.type === 'element'}
            <span class="title">
              <button type="button" on:click={() => toggleOpen(index)}>
                {node.tagName}
              </button>
            </span>
            <span class="text-content" title={firstLine(toText(node))}>{toText(node)}</span>
            <button type="button" on:click={() => toggleOpen(index)}>
              {nodesOpen[index] ? '-' : '+'}
            </button>
          {:else if node.type === 'text'}
            <textarea value={node.value} on:input={(ev) => onInputText(ev, node)} />
          {/if}
        </div>

        <!-- Recursive tree -->
        <div class="nested">
          {#if nodesOpen[index]}
            <svelte:self
              hastNodes={node.children}
              selectedNodeIndexTrace={isTracingNode ? selectedNodeIndexTrace?.slice(1) : undefined}
              on:select={({ detail: indexes }) => {
                triggerSelect([index].concat(indexes));
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
  li.node-selected {
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
  .summary-content textarea {
    resize: vertical;
  }
</style>
