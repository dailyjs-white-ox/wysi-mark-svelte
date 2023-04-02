<script lang="ts">
  import CodeMirror5 from './CodeMirror5.svelte';
  import { slideHasts } from '$lib/source_stores';

  export let value: string;

  // selected
  export let selected: [number, number[]?, { source: 'Preview'; timestamp: Number }?] | undefined;
  let slideIndex: number = 0;
  $: slideIndex = selected?.[0] ?? 0;
  let selectedNodeIndexTrace: number[] | undefined;
  $: selectedNodeIndexTrace = selected?.[1];

  let editorComponent;
  let editor;

  $: ((slideIndex) => {
    const startPos = $slideHasts[slideIndex]?.[0]?.position?.start;
    if (!startPos) return;

    if (editorComponent && editor) {
      const pos = {
        line: startPos.line - 1,
        ch: startPos.column - 1,
      };
      editorComponent.setCursor(pos, { scroll: false });
      const coords = editor.charCoords(pos, 'local');
      editor.getScrollerElement().scrollTo({ top: coords.top, behavior: 'smooth' });
    }
  })(slideIndex);
</script>

<CodeMirror5 bind:value bind:this={editorComponent} bind:editor />
