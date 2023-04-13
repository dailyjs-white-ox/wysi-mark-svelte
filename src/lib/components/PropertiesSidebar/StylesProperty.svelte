<script lang="ts">
  import { hastInsertStyle } from '$lib/source';
  import { markdown } from '$lib/source_stores';
  import type { HastElement } from 'mdast-util-to-hast/lib/state';

  export let node: HastElement;
  $: styleText = (node.properties?.style ?? '') as string;

  $: styleText = (node.properties?.style ?? '') as string;

  function submit() {
    const result = hastInsertStyle(node, styleText, $markdown);
    if (result) {
      const [pos, mdSource] = result;
      markdown.updateAt(pos, mdSource);
    }
  }
</script>

<form on:submit|preventDefault={submit}>
  <div>
    tag: <code>{node.tagName}</code>
  </div>

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
