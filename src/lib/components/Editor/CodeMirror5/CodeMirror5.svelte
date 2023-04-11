<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import type { Editor, EditorFromTextArea, Position } from 'codemirror';

  const dispatch = createEventDispatcher();

  type CodeMirror = typeof import('codemirror');

  const modes = {
    js: { name: 'javascript', json: false },
    json: { name: 'javascript', json: true },
    svelte: { name: 'handlebars', base: 'text/html' },
    md: { name: 'markdown' },
  } as const;
  type Mode = keyof typeof modes;

  export let value = '';
  export let readonly = false;

  export let lineNumbers = true;
  export let tab = true;
  export let theme = 'svelte';

  export let editor: EditorFromTextArea;

  let w: number;
  let h: number;
  let mode: Mode = 'md';

  // We have to expose set and update methods, rather
  // than making this state-driven through props,
  // because it's difficult to update an editor
  // without resetting scroll otherwise
  export async function set(new_code: string, new_mode = undefined) {
    if (new_mode !== undefined && new_mode !== mode) {
      await createEditor((mode = new_mode));
    }

    value = new_code;
    updating_externally = true;
    if (editor) editor.setValue(value);
    updating_externally = false;
  }

  export function update(new_code: string) {
    value = new_code;

    if (editor) {
      const { left, top } = editor.getScrollInfo();
      const cursor = editor.getCursor();
      //console.log('🚀 update ~ { left, top }:', { left, top, cursor });
      editor.setValue((value = new_code));
      editor.scrollTo(left, top);
      editor.setCursor(cursor);
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

  export function setHistory(history: any) {
    editor.setHistory(history);
  }

  export function clearHistory() {
    if (editor) editor.clearHistory();
  }

  export function setCursor(pos: Position) {
    //console.log('🚀 setCursor:', pos);
    if (editor) editor.setCursor(pos);
  }

  export const cursorIndex = writable(0);

  export function markText({ from, to }: { from: number; to: number }) {
    if (editor)
      editor.markText(editor.posFromIndex(from), editor.posFromIndex(to), {
        className: 'mark-text',
      });
  }

  export function unmarkText() {
    if (editor) editor.getAllMarks().forEach((m) => m.clear());
  }

  const refs: {
    [key: string]: HTMLElement;
  } = {};

  let CodeMirrorModule: CodeMirror;
  let updating_externally = false;
  let destroyed = false;
  let composition: undefined | 'start' | 'update' | 'end';

  $: if (editor && w && h) {
    editor.refresh();
  }

  function handleComposition(state: 'start' | 'update' | 'end') {
    return (_ev: CompositionEvent) => {
      composition = state;
      // trigger "change" on compositionend
      if (state === 'end') {
        const value = editor.getValue();
        dispatch('change', { value, composition });
      }
    };
  }

  onMount(() => {
    (async () => {
      if (!CodeMirrorModule) {
        let mod = await import('./codemirror5.js');
        CodeMirrorModule = mod.default;
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
  async function createEditor(mode: Mode) {
    if (destroyed || !CodeMirrorModule) return;

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
      extraKeys: CodeMirrorModule.normalizeKeyMap({
        Enter: 'newlineAndIndentContinueMarkdownList',
        'Ctrl-/': 'toggleComment',
        'Cmd-/': 'toggleComment',
        'Ctrl-Q': function (cm: Editor) {
          cm.foldCode(cm.getCursor());
        },
        'Cmd-Q': function (cm: Editor) {
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

    editor = CodeMirrorModule.fromTextArea(refs.editor as HTMLTextAreaElement, opts);
    globalThis.cm = editor;
    console.log(
      '🚀 ~ file: CodeMirror5.svelte:162 ~ createEditor ~ refs.editor, opts:',
      opts,
      editor
    );

    editor.on('change', (instance) => {
      if (!updating_externally) {
        const value = instance.getValue();
        dispatch('change', { value, composition });
      }
    });

    editor.on('cursorActivity', (instance) => {
      cursorIndex.set(instance.indexFromPos(instance.getCursor()));
    });

    editor.on('focus', (_instance) => {
      dispatch('focus');
    });
    editor.on('blur', (_instance) => {
      dispatch('blur');
    });

    if (__first) await sleep(50);
    editor.refresh();

    __first = false;
  }

  function sleep(ms: number) {
    return new Promise((fulfil) => setTimeout(fulfil, ms));
  }
</script>

<svelte:window
  on:compositionstart={handleComposition('start')}
  on:compositionupdate={handleComposition('update')}
  on:compositionend={handleComposition('end')}
/>

<div class="codemirror-container" bind:offsetWidth={w} bind:offsetHeight={h}>
  <textarea bind:this={refs.editor} readonly {value} />

  {#if !CodeMirrorModule}
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
