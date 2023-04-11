<script lang="ts">
  import { hastToMarkdown, hastToMarkdownWithHtmlHead, replaceMarkdown } from '$lib/source_stores';
  import type { HastElement } from 'mdast-util-to-hast/lib/state';
  import Textarea from '../Editor/Textarea.svelte';
  import { heading as toMdastHeading } from 'hast-util-to-mdast/lib/handlers/heading';
  import { heading as toMarkdownHeading } from 'mdast-util-to-markdown/lib/handle/heading';
  import { toHtml } from 'hast-util-to-html';
  import { h } from 'hastscript';

  export let node: HastElement;
  let styleText = (node.properties?.style ?? '') as string;

  function submit() {
    console.log('style:', JSON.stringify(styleText), { node });
    const hastNode = node;

    if (!hastNode.properties) hastNode.properties = { style: '' };
    if (!hastNode.position) return;
    const {
      position: { start, end },
    } = hastNode;
    if (start.offset === undefined || end.offset === undefined) return;

    //
    const mdSource = hastToMarkdownWithHtmlHead(hastNode, { style: styleText });
    replaceMarkdown({ start: start.offset, end: end.offset }, mdSource);
  }
</script>

<form on:submit|preventDefault={submit}>
  <div>
    tag: <span>{node.tagName}</span>
  </div>

  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label
    >Style:
    <textarea
      bind:value={styleText}
      on:keydown={(ev) => {
        if (ev.metaKey && ev.key === 'Enter') {
          submit();
        }
      }}
    />
  </label>

  <!-- {JSON.stringify(selectedNode)} -->
  <button type="submit">Apply</button>
</form>
