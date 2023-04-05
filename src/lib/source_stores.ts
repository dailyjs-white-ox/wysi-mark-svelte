import { writable, derived, type Readable } from 'svelte/store';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import { isElement } from 'hast-util-is-element';
import { filter } from 'unist-util-filter';
import type { HastRoot, HastNodes, HastContent } from 'mdast-util-to-hast/lib/index.js';
import type { VFile } from 'vfile';

export type { HastNodes, HastContent };

// markdown-driven

export const markdown = writable('');

export const hast = (() => {
  const store = derived(markdown, ($markdown) => {
    const mdastTree = fromMarkdown($markdown);
    const hastTree = toHast(mdastTree);
    if (!hastTree) {
      throw new Error('hastTree is null');
    }
    return hastTree;
  });

  return store;
})();

export const html = derived(hast, ($hast) => toHtml($hast));

export const slideHasts: Readable<HastContent[][]> = derived(hast, ($hast) => {
  // normalize children - remove blank text nodes, throughout the tree
  const { children } = filter($hast, null, (node) => {
    if (node.type === 'text' && node.value.trim() === '') {
      return false;
    }
    return true;
  }) as HastRoot;

  // group nodes by HR node
  const groups: HastContent[][] = children.reduce<HastContent[][]>(
    (memo, node) => {
      const lastGroup = memo.at(-1) ?? [];

      // insert new group
      if (node.type === 'element' && node.tagName === 'hr') {
        memo.push([]);
      }
      // insert into last group
      else {
        lastGroup.push(node);
      }

      return memo;
    },
    [[]]
  );
  if (groups.length > 0 && groups[0].length === 0) {
    groups.shift();
  }

  // TODO: assign slide index and node trace
  groups.forEach((groupNodes, groupIndex) => {
    assignNodeIndexTrace(groupNodes);
  });

  return groups;
});

function assignNodeIndexTrace(nodes: HastContent[], ancestorTrace: number[] = []) {
  nodes.forEach((node, index) => {
    if (!isElement(node)) return;

    node.properties = node.properties ?? {};
    node.properties.dataNodeIndexTrace = [...ancestorTrace, index].join('.');
    assignNodeIndexTrace(node.children, [...ancestorTrace, index]);
  });
}

// FIXME: deprecate me
export const slides: Readable<string[]> = derived(html, ($html) =>
  $html
    .split('<hr>')
    .map((text) => text.trim())
    .filter(Boolean)
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
    .filter(({ nodeType }) => nodeType === document.ELEMENT_NODE || nodeType === document.TEXT_NODE)
    .filter((node) => node.nodeValue?.trim() !== '');
}
