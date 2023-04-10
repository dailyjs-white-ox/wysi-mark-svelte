<script lang="ts">
  import CodeMirror5 from './CodeMirror5.svelte';
  import { slideHasts } from '$lib/source_stores';
  import { selectedNode1Index, selectedNode1IndexTrace } from '$lib/selected_stores';

  export let value: string;

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
  })($selectedNode1Index);

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
  })($selectedNode1Index, $selectedNode1IndexTrace);

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
