import { writable, readable, derived, type Writable, type Readable } from 'svelte/store';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toHast } from 'mdast-util-to-hast'
import { toMarkdown } from 'mdast-util-to-markdown';
import { fromHtml } from 'hast-util-from-html'
import { toMdast } from 'hast-util-to-mdast';
import { toHtml } from 'hast-util-to-html'
//var { fromMarkdown } = await import('mdast-util-from-markdown')
//var { toHast }       = await import('mdast-util-to-hast')
//var { toHtml }       = await import('hast-util-to-html')
//import type { Root as MdastRoot } from 'mdast-util-from-markdown/lib/index.js'
import type { HastNodes } from 'mdast-util-to-hast/lib/index.js'
import type { MdastNode } from 'hast-util-to-mdast/lib/index.js'
import type { VFile } from 'vfile';

export const markdown = writable('');
export const html = writable('');
export const mdast: Writable<MdastNode> = writable();
export const hast: Writable<HastNodes> = writable();

// propagate change on html change
html.subscribe(($html) => {
  const hastTree = fromHtml($html, { fragment: true });
  hast.set(hastTree);

  const mdastTree = toMdast(hastTree);
  mdast.set(mdastTree);

  const markdownSource = toMarkdown(mdastTree);
  markdown.set(markdownSource);
});

// propagate change on markdown change
markdown.subscribe(($markdown) => {
  const mdastTree = fromMarkdown($markdown);
  mdast.set(mdastTree);

  const hastTree = toHast(mdastTree);
  if (!hastTree) {
    throw new Error('failed transforming mdast to hast');
  }
  hast.set(hastTree);

  const htmlSource = toHtml(hastTree);
  html.set(htmlSource);
});

hast.subscribe(($hast) => {
  // propagate towards html
  const htmlSource = toHtml($hast);
  html.set(htmlSource);

  // propagate towards markdown
  const mdastTree = toMdast($hast);
  mdast.set(mdastTree);
  const markdownSource = toMarkdown(mdastTree);
  markdown.set(markdownSource);
});

export const slides: Readable<string[]> = derived(html, ($html) =>
  $html.split('<hr>').map(text => text.trim()).filter(Boolean)
);

// functions

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