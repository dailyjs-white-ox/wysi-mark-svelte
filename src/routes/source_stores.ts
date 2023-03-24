import { writable, readable, derived, type Writable, type Readable } from 'svelte/store';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import type { VFile } from 'vfile';
//import { createHtmlElement } from './utils';

//$: slidesHtml = previewHtml
//  .split('<hr>')
//  .map((preview) => preview.trim())
//  .filter((str) => Boolean(str));

export const markdown: Writable<string> = writable('');

export const htmlAsync: Readable<Promise<string>> = derived(markdown, ($markdown) => {
  return processMarkdown($markdown).then((result) => String(result.value));
})

//export const html: Readable<string> & { promise: Promise<string> } = ((markdown) => {
//  const store = writable<string>('');
//
//  let promise;
//  markdown.subscribe(($markdown) => {
//    console.log('markdown value changed:', JSON.stringify($markdown));
//    console.log('processing...');
//    promise = processMarkdown($markdown).then((result) => {
//      console.log('done.', result);
//      const value = String(result.value);
//      store.set(value);
//      return value;
//    });
//  });
//
//  // omit 'set'
//  const { set, update, ...rest } = store;
//  return { ...rest, promise };
//})(markdown);

export const html: Readable<string> = readable('', function start(set) {
  htmlAsync.subscribe(async (pr) => {
    const $html = await pr;
    //console.log('awaited htmlAsync. $html:', $html)
    set($html);
  });
});

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