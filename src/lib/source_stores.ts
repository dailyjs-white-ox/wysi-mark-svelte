import { writable, derived, get, type Readable } from 'svelte/store';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';
import { sanitize, defaultSchema } from 'hast-util-sanitize';
import { raw } from 'hast-util-raw';
import { toHtml } from 'hast-util-to-html';
import { isElement } from 'hast-util-is-element';
import { filter } from 'unist-util-filter';
import type { HastRoot, HastNodes, HastContent, MdastRoot } from 'mdast-util-to-hast/lib/index.js';
import type { VFile } from 'vfile';

export type { HastNodes, HastContent };

// see ../../node_modules/hast-util-sanitize/lib/schema.js for details
const sanitizeSchema = structuredClone({
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'header', 'footer'],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes ?? {}).div, 'className', 'style'],
  },
});

function turnMdastToSanitizedHast(mdastTree: MdastRoot): HastNodes {
  const hastTree0 = toHast(mdastTree, { allowDangerousHtml: true });
  if (!hastTree0) {
    throw new Error('hast tree is null');
  }

  const hastTree1 = raw(hastTree0);

  const hastTree2 = sanitize(hastTree1, sanitizeSchema);
  return hastTree2;
}

// markdown-driven

export const markdown = writable('');

export const hast = (() => {
  const store: Readable<HastNodes> = derived(markdown, ($markdown) => {
    const mdastTree = fromMarkdown($markdown);
    try {
      const hastTree = turnMdastToSanitizedHast(mdastTree);
      return hastTree;
    } catch (err) {
      console.error(err);
      // return current value instead
      return get(store);
    }
  });

  return store;
})();

export const html = derived(hast, ($hast) => toHtml($hast, { allowDangerousHtml: true }));

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
