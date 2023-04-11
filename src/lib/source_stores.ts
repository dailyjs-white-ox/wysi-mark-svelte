import { writable, derived, get, type Readable } from 'svelte/store';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { VFile } from 'vfile';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';
import { sanitize, defaultSchema } from 'hast-util-sanitize';
import { raw } from 'hast-util-raw';
import { toHtml } from 'hast-util-to-html';
import { isElement } from 'hast-util-is-element';
import { filter } from 'unist-util-filter';
import type { HastRoot, HastNodes, HastContent, MdastRoot } from 'mdast-util-to-hast/lib/index.js';
import { toMdast, type Options as ToMdastOptions } from 'hast-util-to-mdast';
import { toMarkdown, type Options as ToMarkdownOptions } from 'mdast-util-to-markdown';
import type { HastElement, HastText } from 'mdast-util-to-hast/lib/state';

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

function turnMdastToSanitizedHast(mdastTree: MdastRoot, source: string): HastNodes {
  const hastTree0 = toHast(mdastTree, { allowDangerousHtml: true });
  if (!hastTree0) {
    throw new Error('hast tree is null');
  }

  const hastTree1 = raw(hastTree0, { file: new VFile({ value: source }) });

  const hastTree2 = sanitize(hastTree1, sanitizeSchema);
  console.log('🚀 ~ file: source_stores.ts:42 ~ turnMdastToSanitizedHast ~ hastTree2:', hastTree2, {
    hastTree0,
    hastTree1,
  });
  return hastTree2;
}

// markdown-driven

export const markdown = writable('');

export function replaceMarkdown({ start, end }: { start: number; end: number }, value: string) {
  markdown.update(($markdown) => {
    return $markdown.slice(0, start) + value + $markdown.slice(end);
  });
}

// hast

export const hast = (() => {
  const store: Readable<HastNodes> = derived(markdown, ($markdown) => {
    const mdastTree = fromMarkdown($markdown);
    try {
      const hastTree = turnMdastToSanitizedHast(mdastTree, $markdown);
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

// slideHast

export type SlideHastNode = Exclude<HastContent, { type: 'comment' } | { type: 'doctype' }>;

export const slideHasts: Readable<SlideHastNode[][]> = derived(hast, ($hast) => {
  // normalize children - remove blank text nodes, throughout the tree
  const { children } = filter($hast, null, (node) => {
    if (node.type === 'text' && node.value.trim() === '') {
      return false;
    }
    return true;
  }) as HastRoot;

  // group nodes by HR node
  const groups: SlideHastNode[][] = children.reduce<SlideHastNode[][]>(
    (memo, node) => {
      const lastGroup = memo.at(-1) ?? [];

      // remove unused node types
      if (node.type === 'doctype') return memo;
      if (node.type === 'comment') return memo;

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

export function hastToMarkdown(
  node: HastNodes,
  options?: { mdast?: ToMdastOptions; markdown?: ToMarkdownOptions }
): string {
  const mdast = toMdast(node, options?.mdast);
  const markdown = toMarkdown(mdast, options?.markdown);
  return markdown;
}

export function hastText(value: string): HastText {
  return { type: 'text', value };
}

/**
 * Convert hast element to markdown, but render the outer tag as HTML.
 */
export function hastToMarkdownWithHtmlHead(node: HastElement, properties = {}): string {
  // keep children in markdown as text
  const children = [
    hastText(
      node.children
        .map((childNode) => hastToMarkdown(childNode))
        .join('\n')
        .trim()
    ),
  ];

  // hast node with children rendered as markdown
  const newHastNode = {
    ...node,
    properties: { ...node.properties, ...properties },
    children,
  };

  const source = toHtml(newHastNode);
  return source;
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
