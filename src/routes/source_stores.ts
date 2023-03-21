import { writable, readable, derived, type Writable, type Readable } from 'svelte/store';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import type { VFile } from 'vfile';
import { createHtmlElement } from './utils';

//$: slidesHtml = previewHtml
//  .split('<hr>')
//  .map((preview) => preview.trim())
//  .filter((str) => Boolean(str));

export const markdown: Writable<string> = writable('');

export const html: Readable<string> = ((markdown) => {
  const store = writable<string>('');

  markdown.subscribe(async ($markdown) => {
    const result = await processMarkdown($markdown);
    store.set(String(result.value));
  });

  // omit 'set'
  const { set, ...rest } = store;
  return rest;
})(markdown);

export const slides: Readable<string[]> = derived(html, ($html) =>
  $html.split('<hr>').map(text => text.trim()).filter(Boolean)
);

export async function processMarkdown(source: string): Promise<VFile> {
  return await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(source);
}

export function normalizeChildNodes(node: Node) {
  return [...node.childNodes]
    .filter(
      ({ nodeType }) => nodeType === document.ELEMENT_NODE || nodeType === document.TEXT_NODE
    )
    .filter((node) => node.nodeValue?.trim() !== '');
}