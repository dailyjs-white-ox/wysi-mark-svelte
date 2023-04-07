<script lang="ts">
  import LeftSplitter from './LeftSplitter.svelte';

  export let right: number | undefined = undefined;
  export let rect: DOMRect;
  $: left = right === undefined ? undefined : rect.width - right;
</script>

<LeftSplitter {left} {...$$restProps} on:drag:start on:drag:end on:drag />
