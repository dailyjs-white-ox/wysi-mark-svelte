<script>
  export let style = '';
</script>

<div class="splitter-container" {style}>
  <slot />
</div>

<style>
  .splitter-container {
    position: relative;
    pointer-events: none;
  }
</style>
