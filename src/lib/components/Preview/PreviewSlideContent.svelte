<script lang="ts">
  import FoldablePreviewCode from './FoldablePreviewCode.svelte';

  export let slideHtmls: string[];
</script>

{#each slideHtmls as slideHtml}
  {#if slideHtml.includes('</pre>')}
    <FoldablePreviewCode previewCode={slideHtml} />
  {:else}
    {@html slideHtml}
  {/if}
{/each}
