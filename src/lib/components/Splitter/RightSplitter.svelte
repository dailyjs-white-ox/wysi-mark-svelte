<script lang="ts">
  import LeftSplitter from './LeftSplitter.svelte';

  let className = '';
  export { className as class };
  export let borderColor: string;

  export let right: number | undefined = undefined;
  export let rect: DOMRect;

  $: left = unlessUndefined(right, (num) => rect.width - num);
  $: console.log('🚀 ~ file: RightSplitter.svelte:12 ~ left:', left, { rect, right });

  export let width: number | undefined = undefined;

  function unlessUndefined<T, S>(value: T | undefined, getter: (value: T) => S): S | undefined {
    if (typeof value === 'undefined') {
      return value;
    }
    return getter(value);
  }
</script>

<LeftSplitter class={className} {borderColor} {width} {left} on:drag:start on:drag:end on:drag />
