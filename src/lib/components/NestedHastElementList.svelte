<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { toText } from 'hast-util-to-text';

  import type { HastElement, HastText } from 'mdast-util-to-hast/lib/state';

  import { markdown, type SlideHastNode } from '$lib/source_stores';
  import type { WithTarget } from '$lib/utils/types';
  import type { NodeIndexTrace, SelectedSourceDetail } from '$lib/selected_stores';
  import { firstLine } from '$lib/source_helpers';
  import { checkStyleWrapperElement } from '$lib/source/hast/style_wrapper';

  const dispatchEvent = createEventDispatcher<{ select: number[]; 'select:more': number[] }>();

  export let hastNodes: SlideHastNode[];
  export let depth = 0;

  // export let selectedNodeIndexTraces: NodeIndexTrace[] = [];
  export let selectedNodeIndexTraces2: [NodeIndexTrace, SelectedSourceDetail][] = [];

  // { [nodeIndex] => boolean }
  //$: nodeSelectedMap = hastNodes.reduce<{ [nodeIndex: number]: boolean }>((memo, _, nodeIndex) => {
  //  const match = selectedNodeIndexTraces.find(
  //    (trace) => trace.length === 1 && trace[0] === nodeIndex
  //  );
  //  memo[nodeIndex] = Boolean(match);
  //  return memo;
  //}, {});

  // { [nodeIndex] => boolean }
  // $: nextSelectedNodeIndexTracesMap = hastNodes.reduce<{ [nodeIndex: number]: NodeIndexTrace[] }>(
  //   (memo, _, nodeIndex) => {
  //     memo[nodeIndex] = selectedNodeIndexTraces
  //       .filter((trace) => trace[0] === nodeIndex)
  //       .map((trace) => trace.slice(1));
  //     return memo;
  //   },
  //   {}
  // );

  function checkTraceMatch(
    [trace, source]: [NodeIndexTrace, SelectedSourceDetail],
    hastNode: SlideHastNode,
    nodeIndex: number
  ) {
    if (trace.length === 1 && trace[0] === nodeIndex) {
      return true;
    }

    if (trace.length === 2) {
      const wrapperType = checkStyleWrapperElement(hastNode);
      if (
        wrapperType === 'outer' &&
        hastNode.type === 'element' &&
        source.source !== 'Properties'
      ) {
        const { children } = hastNode;
        if (children.length === 1) {
          return true;
        }
      }
    }

    return false;
  }

  $: nodeSelectedMap = hastNodes.reduce((memo, node, nodeIndex) => {
    const match = selectedNodeIndexTraces2.find((tuple) => checkTraceMatch(tuple, node, nodeIndex));
    memo[nodeIndex] = Boolean(match);
    return memo;
  }, {} as Record<number, boolean>);
  // next level
  $: nextSelectedNodeIndexTracesMap2 = hastNodes.reduce((memo, _, nodeIndex) => {
    const currentIndexTraces2 = selectedNodeIndexTraces2.filter(
      ([trace]) => !nodeSelectedMap[nodeIndex] && trace[0] === nodeIndex
    );
    memo[nodeIndex] = currentIndexTraces2.map(([trace, source]) => [trace.slice(1), source]);
    return memo;
  }, {} as Record<number, [NodeIndexTrace, SelectedSourceDetail][]>);

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

  // open selected node
  $: {
    // selectedNodeIndexTraces.forEach((selectedNodeIndexTrace) => {
    //   nodesOpen[selectedNodeIndexTrace[0]] = true;
    // });
    selectedNodeIndexTraces2.forEach(([trace, source]) => {
      if (source.source !== 'Properties') {
        nodesOpen[trace[0]] = true;
      }
    });
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
    // console.log('click', target.tagName, { metaKey, ev });
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
              selectedNodeIndexTraces2={nextSelectedNodeIndexTracesMap2[nodeIndex]}
              on:select={({ detail: indexes }) => {
                triggerSelect([nodeIndex].concat(indexes));
              }}
              on:select:more={({ detail: indexes }) => {
                triggerSelectMore([nodeIndex].concat(indexes));
              }}
            />
            <!-- selectedNodeIndexTraces={nextSelectedNodeIndexTracesMap[nodeIndex]} -->
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
