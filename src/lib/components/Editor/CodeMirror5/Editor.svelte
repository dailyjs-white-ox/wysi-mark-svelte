<script lang="ts">
  import CodeMirror5 from './CodeMirror5.svelte';
  import { slideHasts } from '$lib/source_stores';
  import { selectedNode1Index, selectedNode1IndexTrace } from '$lib/selected_stores';
  import type { EditorFromTextArea } from 'codemirror';

  export let value: string;

  let editorComponent: CodeMirror5; // Component
  let editor: EditorFromTextArea; // CodeMirror instance

  // scroll to slide
  $: ((slideIndex) => {
    if (editor && editor.hasFocus()) return;

    const startPos = $slideHasts[slideIndex]?.[0]?.position?.start;
    if (!startPos) return;

    if (editorComponent && editor) {
      const pos = {
        line: startPos.line - 1,
        ch: startPos.column - 1,
      };
      editorComponent.setCursor(pos);
      const coords = editor.charCoords(pos, 'local');
      editor.getScrollerElement().scrollTo({ top: coords.top, behavior: 'smooth' });
    }
  })($selectedNode1Index);

  // mark
  $: ((slideIndex, nodeIndexTrace) => {
    if (!nodeIndexTrace) return;

    const selectedNode = selectNodeFromIndexTrace(slideIndex, nodeIndexTrace);
    if (selectedNode?.position && editorComponent) {
      const { start, end } = selectedNode.position;
      if (start.offset === undefined || end.offset === undefined) return;
      editorComponent.unmarkText();
      editorComponent.markText({ from: start.offset, to: end.offset });
    }
  })($selectedNode1Index, $selectedNode1IndexTrace);

  function selectNodeFromIndexTrace(slideIndex: number, nodeIndexTrace: number[] | undefined) {
    if (!nodeIndexTrace) return;
    const slideNodes = $slideHasts[slideIndex];
    if (!slideNodes) return;

    let remainingIndexTrace = nodeIndexTrace.slice();
    const nextIndex = remainingIndexTrace.shift();
    if (nextIndex === undefined) return;
    let node = slideNodes[nextIndex];
    while (node && remainingIndexTrace.length) {
      const nextIndex = remainingIndexTrace.shift();
      if (nextIndex === undefined) break;
      node = node.children[nextIndex];
    }
    return node;
  }
</script>

<CodeMirror5
  bind:this={editorComponent}
  bind:editor
  {value}
  on:change={({ detail }) => {
    value = detail.value;
  }}
  on:change
/>
