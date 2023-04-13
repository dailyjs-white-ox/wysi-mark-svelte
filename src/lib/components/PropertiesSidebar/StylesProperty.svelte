<script lang="ts">
  import {
    buildMarkdownStyleRemover,
    buildMarkdownStyleWrapper,
  } from '$lib/source/hast/style_wrapper';
  import { markdown } from '$lib/source_stores';
  import type { HastElement } from 'mdast-util-to-hast/lib/state';

  export let node: HastElement;
  let nodeClassName: string[];
  $: nodeClassName = (node.properties?.className as string[]) ?? [];

  $: styleText = (node.properties?.style ?? '') as string;

  function submit() {
    if (styleText) {
      const result = buildMarkdownStyleWrapper(node, styleText, $markdown);
      if (result) {
        const [pos, mdSource] = result;
        // TODO: FIX editor scroll after update
        markdown.updateAt(pos, mdSource);
      }
    } else {
      const result = buildMarkdownStyleRemover(node, $markdown);
      if (result) {
        const [pos, mdSource] = result;
        // TODO: FIX editor scroll after update
        markdown.updateAt(pos, mdSource);
      }
    }
  }
</script>

<form on:submit|preventDefault={submit}>
  <div>
    tag: <code>{node.tagName}</code>
  </div>
  {#if nodeClassName.length > 0}
    <div>
      class: <code>{nodeClassName.join(' ')}</code>
    </div>
  {/if}

  <label
    >Style:
    <textarea
      value={styleText}
      on:input={(ev) => {
        node.properties = node.properties ?? { style: '' };
        node.properties.style = ev.currentTarget.value;
      }}
      on:keydown={(ev) => {
        // submit the form
        if (ev.metaKey && ev.key === 'Enter') {
          ev.currentTarget.form?.requestSubmit();
        }
      }}
    />
  </label>

  <!-- {JSON.stringify(selectedNode)} -->
  <button type="submit">Apply</button>
</form>
