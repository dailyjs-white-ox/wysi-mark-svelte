<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';

  const dispatch = createEventDispatcher();

  export let value = '';
  export let readonly = false;

  export let lineNumbers = true;
  export let tab = true;
  export let theme = 'svelte';

  let w;
  let h;
  let mode = 'md';

  // We have to expose set and update methods, rather
  // than making this state-driven through props,
  // because it's difficult to update an editor
  // without resetting scroll otherwise
  export async function set(new_code, new_mode) {
    if (new_mode !== mode) {
      await createEditor((mode = new_mode));
    }

    value = new_code;
    updating_externally = true;
    if (editor) editor.setValue(value);
    updating_externally = false;
  }

  export function update(new_code) {
    value = new_code;

    if (editor) {
      const { left, top } = editor.getScrollInfo();
      editor.setValue((value = new_code));
      editor.scrollTo(left, top);
    }
  }

  export function resize() {
    editor.refresh();
  }

  export function focus() {
    editor.focus();
  }

  export function getHistory() {
    return editor.getHistory();
  }

  export function setHistory(history) {
    editor.setHistory(history);
  }

  export function clearHistory() {
    if (editor) editor.clearHistory();
  }

  export function setCursor(pos) {
    if (editor) editor.setCursor(pos);
  }

  export const cursorIndex = writable(0);

  export function markText({ from, to }) {
    if (editor)
      editor.markText(editor.posFromIndex(from), editor.posFromIndex(to), {
        className: 'mark-text',
      });
  }

  export function unmarkText() {
    if (editor) editor.getAllMarks().forEach((m) => m.clear());
  }

  const modes = {
    js: { name: 'javascript', json: false },
    json: { name: 'javascript', json: true },
    svelte: { name: 'handlebars', base: 'text/html' },
    md: { name: 'markdown' },
  };

  const refs = {};
  let editor;
  let updating_externally = false;
  let destroyed = false;
  let CodeMirror;

  $: if (editor && w && h) {
    editor.refresh();
  }

  onMount(() => {
    (async () => {
      if (!CodeMirror) {
        let mod = await import('./codemirror5.js');
        CodeMirror = mod.default;
      }
      await createEditor(mode || 'svelte');
      if (editor) editor.setValue(value || '');
    })();

    return () => {
      destroyed = true;
      if (editor) editor.toTextArea();
    };
  });

  let __first = true;
  async function createEditor(mode) {
    if (destroyed || !CodeMirror) return;

    if (editor) editor.toTextArea();

    const opts = {
      lineNumbers,
      lineWrapping: true,
      indentWithTabs: true,
      indentUnit: 2,
      tabSize: 2,
      value,
      mode: modes[mode] || {
        name: mode,
      },
      readOnly: readonly,
      autoCloseBrackets: true,
      autoCloseTags: true,
      extraKeys: CodeMirror.normalizeKeyMap({
        Enter: 'newlineAndIndentContinueMarkdownList',
        'Ctrl-/': 'toggleComment',
        'Cmd-/': 'toggleComment',
        'Ctrl-Q': function (cm) {
          cm.foldCode(cm.getCursor());
        },
        'Cmd-Q': function (cm) {
          cm.foldCode(cm.getCursor());
        },
        // allow escaping the CodeMirror with Esc Tab
        'Esc Tab': false,
      }),
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      theme,
    };

    if (!tab) {
      opts.extraKeys['Tab'] = tab;
      opts.extraKeys['Shift-Tab'] = tab;
    }

    // Creating a text editor is a lot of work, so we yield
    // the main thread for a moment. This helps reduce jank
    if (__first) await sleep(50);

    if (destroyed) return;

    editor = CodeMirror.fromTextArea(refs.editor, opts);
    globalThis.cm = editor;
    console.log(
      '🚀 ~ file: CodeMirror5.svelte:162 ~ createEditor ~ refs.editor, opts:',
      opts,
      editor
    );

    editor.on('change', (instance) => {
      if (!updating_externally) {
        const value = instance.getValue();
        dispatch('change', { value });
      }
    });

    editor.on('cursorActivity', (instance) => {
      cursorIndex.set(instance.indexFromPos(instance.getCursor()));
    });

    if (__first) await sleep(50);
    editor.refresh();

    __first = false;
  }

  function sleep(ms) {
    return new Promise((fulfil) => setTimeout(fulfil, ms));
  }
</script>

<div class="codemirror-container" bind:offsetWidth={w} bind:offsetHeight={h}>
  <textarea bind:this={refs.editor} readonly {value} />

  {#if !CodeMirror}
    <pre style="position: absolute; left: 0; top: 0">{value}</pre>

    <div style="position: absolute; width: 100%; bottom: 0" />
  {/if}
</div>

<style>
  .codemirror-container {
    position: relative;
    width: 100%;
    height: 100%;
    border: none;
    line-height: 1.5;
    overflow: hidden;
    background-color: var(--back-light);
  }

  .codemirror-container :global(.CodeMirror) {
    height: 100%;
    font: 400 calc(var(--code-fs) * 0.625) / 1.7 var(--font-mono);
  }

  .codemirror-container :global(.error-loc) {
    position: relative;
    border-bottom: 2px solid #da106e;
  }

  .codemirror-container :global(.error-line) {
    background-color: rgba(200, 0, 0, 0.05);
  }

  .codemirror-container :global(.mark-text) {
    background-color: var(--highlight);
  }

  textarea {
    visibility: hidden;
  }

  pre {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border: none;
    padding: 4px 4px 4px 60px;
    resize: none;
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.7;
    user-select: none;
    pointer-events: none;
    color: #ccc;
    tab-size: 2;
    -moz-tab-size: 2;
  }
</style>
