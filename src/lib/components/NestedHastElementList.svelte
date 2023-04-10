<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { toText } from 'hast-util-to-text';

  import type { HastContent, HastNodes, HastElement, HastText } from 'mdast-util-to-hast/lib/state';
  import { markdown, type SlideHastNode } from '$lib/source_stores';

  const dispatchEvent = createEventDispatcher<{ select: number[]; 'select:more': number[] }>();

  type WithTarget<Event, Target> = Event & { currentTarget: Target };

  export let hastNodes: SlideHastNode[];
  export let depth = 0;

  // export let selectedNodeIndexTrace: number[] | undefined = undefined;
  export let selectedNodeIndexTraces: number[][] = [];

  $: nodeSelectedMap = hastNodes.reduce<{ [nodeIndex: number]: boolean }>((memo, _, nodeIndex) => {
    memo[nodeIndex] = Boolean(
      selectedNodeIndexTraces.find(
        (nodeTrace) => nodeTrace.length === 1 && nodeTrace[0] === nodeIndex
      )
    );
    return memo;
  }, {});

  $: nextSelectedNodeIndexTracesMap = hastNodes.reduce<{ [nodeIndex: number]: number[][] }>(
    (memo, _, nodeIndex) => {
      memo[nodeIndex] = selectedNodeIndexTraces
        .filter((nodeTrace) => nodeTrace[0] === nodeIndex)
        .map((nodeTrace) => nodeTrace.slice(1));
      return memo;
    },
    {}
  );

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

  //// open selected node
  //$: {
  //  //if (selectedNodeIndexTrace && selectedNodeIndexTrace.length > 0) {
  //  //  nodesOpen[selectedNodeIndexTrace[0]] = true;
  //  //}
  //  selectedNodeIndexTraces.forEach((selectedNodeIndexTrace) => {
  //    nodesOpen[selectedNodeIndexTrace[0]] = true;
  //  });
  //}

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

  function triggerSelectMore(nodeIndex: number | number[]) {
    const indexes = Array.isArray(nodeIndex) ? nodeIndex : [nodeIndex];
    dispatchEvent('select:more', indexes);
  }

  function handleClick(ev: WithTarget<MouseEvent, HTMLLIElement>, nodeIndex: number) {
    if (!ev.target) return;
    const target = ev.target as HTMLElement;
    if (['INPUT', 'BUTTON', 'TEXTAREA', 'CODE'].includes(target.tagName)) return;
    const { metaKey } = ev;
    console.log('click', target.tagName, { metaKey, ev });
    if (metaKey) {
      triggerSelectMore(nodeIndex);
    } else {
      triggerSelect(nodeIndex);
    }
  }

  function onInputText(ev: WithTarget<Event, HTMLTextAreaElement>, node: HastText) {
    if (node.value === undefined) return;
    if (!node.position) return;
    const {
      position: { start, end },
    } = node;
    if (start.offset === undefined || end.offset === undefined) return;

    // `abc` => abc
    // TODO: add test here, or whatever.
    if (node.value.length === end.offset - start.offset - 2) {
      end.offset -= 1;
      start.offset += 1;
    }

    const value = ev.currentTarget.value || '.';

    const newSource = $markdown.slice(0, start.offset) + value + $markdown.slice(end.offset);
    $markdown = newSource;
  }
</script>

{#if hastNodes}
  <ol>
    {#each hastNodes as node, nodeIndex}
      <li
        tabindex="-1"
        class:node-selected={nodeSelectedMap[nodeIndex]}
        on:click|stopPropagation={(ev) => handleClick(ev, nodeIndex)}
        on:dblclick={() => toggleOpen(nodeIndex)}
        on:keydown
      >
        <div class="summary-content">
          {#if hastNodes.length > 1}
            <span class="item-marker">{nodeIndex + 1}. </span>
          {/if}
          {#if node.type === 'element'}
            <span class="title">
              <button type="button" on:click={() => toggleOpen(nodeIndex)}>
                {node.tagName}
              </button>
            </span>
            <span class="text-content" title={firstLine(toText(node))}>{toText(node)}</span>
            <button type="button" on:click={() => toggleOpen(nodeIndex)}>
              {nodesOpen[nodeIndex] ? '-' : '+'}
            </button>
          {:else if node.type === 'text'}
            <!-- <textarea value={node.value} on:input={(ev) => onInputText(ev, node)} /> -->
            <code>{node.value}</code>
          {/if}
        </div>

        <!-- Recursive tree -->
        {#if nodesOpen[nodeIndex] && node.type === 'element'}
          <div class="nested">
            <svelte:self
              hastNodes={node.children}
              depth={depth + 1}
              selectedNodeIndexTraces={nextSelectedNodeIndexTracesMap[nodeIndex]}
              on:select={({ detail: indexes }) => {
                triggerSelect([nodeIndex].concat(indexes));
              }}
              on:select:more={({ detail: indexes }) => {
                triggerSelectMore([nodeIndex].concat(indexes));
              }}
            />
          </div>
        {/if}
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
  .summary-content code {
    overflow: auto;
  }
</style>
