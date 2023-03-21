<script lang="ts">
  export let node: Node;
  $: childNodes = [...node.childNodes]
    .filter(({ nodeType }) => nodeType === document.ELEMENT_NODE || nodeType === document.TEXT_NODE)
    .filter((node) => node.nodeValue?.trim() !== '');

  $: nodesOpen = childNodes.map(() => false);

  function firstLine(text: string | null): string {
    if (!text) return '';
    const lines = text.trim().split('\n');
    if (lines.length === 0) {
      return text;
    }
    return lines[0] + '...';
  }
</script>

{#if node}
  <ol>
    {#each childNodes as childNode, index}
      <li tabindex="-1">
        <span class="item-marker">{index + 1}.</span>
        <div class="item-content">
          {#if childNode.nodeType === document.ELEMENT_NODE}
            <div class="summary-content">
              <span class="title">{childNode.nodeName}</span>
              <span class="text-content" title={firstLine(childNode.textContent)}
                >{childNode.textContent}</span
              >
              <button type="button" on:click={() => (nodesOpen[index] = !nodesOpen[index])}
                >{nodesOpen[index] ? 'Close' : 'Open'}</button
              >
            </div>

            {#if nodesOpen[index]}
              <svelte:self node={childNode} />
            {/if}
          {:else if childNode.nodeType === document.TEXT_NODE}
            <textarea value={childNode.nodeValue} />
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
    flex-direction: row;
    gap: 0.5em;

    margin: 5px 1px 10px 1px;
  }
  li:focus {
    outline: 1px dashed #333;
  }

  .item-marker {
    flex: 0 0 auto;
  }
  .item-content {
    flex: 1 1 auto;
    overflow: hidden;
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
