<script lang="ts">
  import {
    hastText,
    hastToMarkdown,
    hastToMarkdownWithHtmlHead,
    replaceMarkdown,
  } from '$lib/source_stores';
  import { toMdast } from 'hast-util-to-mdast';
  import { h } from 'hastscript';
  import type { HastElement } from 'mdast-util-to-hast/lib/state';
  import { toMarkdown } from 'mdast-util-to-markdown';

  export let node: HastElement;
  let styleText = (node.properties?.style ?? '') as string;

  function submit() {
    const hastNode = node;
    const style = styleText;
    console.log('style:', JSON.stringify(style), { hastNode: window.structuredClone(hastNode) });

    if (!hastNode.properties) hastNode.properties = { style: '' };
    if (!hastNode.position) return;

    // Some tags requires specific syntax to work and cannot be easily replaced with html.
    // Inject a wrapper INSIDE the tag and use that instead.
    if (hastNode.tagName === 'li') {
      const start = hastNode.children.at(0)?.position?.start?.offset;
      const end = hastNode.children.at(-1)?.position?.end?.offset;
      if (start === undefined || end === undefined) return;

      const wrappedNode = h('div.li-inner-wrapper', {}, hastNode.children);
      hastNode.children = [wrappedNode];
      const innerMarkdown = hastToMarkdownWithHtmlHead(wrappedNode, { style });
      console.log('🚀 innerMarkdown:', JSON.stringify(innerMarkdown), {
        wrappedNode,
        hastNode,
        start,
        end,
      });
      replaceMarkdown({ start, end }, innerMarkdown);
    } else {
      const { position } = hastNode;
      const start = position.start.offset;
      const end = position.end.offset;
      if (start === undefined || end === undefined) return;
      const mdSource = hastToMarkdownWithHtmlHead(hastNode, { style });
      replaceMarkdown({ start, end }, mdSource);
    }
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
