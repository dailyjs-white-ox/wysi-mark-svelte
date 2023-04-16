<script lang="ts">
  import Prism from 'prismjs';

  export let previewCode: string;

  let folded = true;
  let ref: HTMLDivElement;

  function toggleFold() {
    folded = !folded;
  }

  $: if (ref && !folded) {
    Prism.highlightElement(ref.getElementsByTagName('code')[0]);
  }
</script>

<div>
  <button on:click={toggleFold}>
    {#if folded}
      Code Floded ▶️
    {:else}
      Collapse Code 🔽
    {/if}
  </button>
  {#if !folded}
    <div bind:this={ref}>
      {@html previewCode}
    </div>
  {/if}
</div>
