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

  let editorComponent; // Component
  let editor; // CodeMirror instance

  // scroll to slide
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

  // mark
  $: ((slideIndex, nodeIndexTrace) => {
    if (!nodeIndexTrace) return;
    // console.log( '🚀 ~ file: Editor.svelte:35 ~ nodeIndexTrace:', nodeIndexTrace, $slideHasts[slideIndex], { $slideHasts });

    const selectedNode = selectNodeFromIndexTrace(slideIndex, nodeIndexTrace);
    // console.log('🚀 ~ file: Editor.svelte:44 ~ selected node:', selectedNode, { editorComponent });
    if (selectedNode?.position && editorComponent) {
      const { start, end } = selectedNode.position;
      editorComponent.unmarkText();
      editorComponent.markText({ from: start.offset, to: end.offset });
    }
  })(slideIndex, selectedNodeIndexTrace);

  function selectNodeFromIndexTrace(slideIndex: number, nodeIndexTrace: number[] | undefined) {
    if (!nodeIndexTrace) return;
    const slideNodes = $slideHasts[slideIndex];
    if (!slideNodes) return;

    let remainingIndexTrace = nodeIndexTrace.slice();
    let node = slideNodes[remainingIndexTrace.shift()];
    while (node && remainingIndexTrace.length) {
      node = node.children[remainingIndexTrace.shift()];
    }
    return node;
  }
</script>

<CodeMirror5 bind:value bind:this={editorComponent} bind:editor />
