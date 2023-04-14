import { filter } from 'unist-util-filter';
import { toHtml } from 'hast-util-to-html';
import { toMdast, type Options as ToMdastOptions } from 'hast-util-to-mdast';
import { toMarkdown, type Options as ToMarkdownOptions } from 'mdast-util-to-markdown';
import type { HastRoot, HastNodes, HastContent, MdastRoot } from 'mdast-util-to-hast/lib/index.js';
import type { HastElement, HastText } from 'mdast-util-to-hast/lib/state';

export type { HastNodes, HastContent };

// remove blank text nodes, throughout the tree
export function removeBlankTextNodes(tree: HastNodes): HastRoot {
  const tree2 = filter(tree, null, (node) => {
    if (node.type === 'text' && node.value.trim() === '') {
      return false;
    }
    return true;
  }) as HastRoot;
  return tree2;
}

export function replaceMarkdownAt(
  source: string,
  { start, end }: { start: number; end: number },
  value: string
) {
  return source.slice(0, start) + value + source.slice(end);
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
 *
 */
export function hastToMarkdownWithHtmlHead(
  node: HastElement,
  properties: {},
  childrenMarkdown: string
): string {
  let propEntries = Object.entries({ ...node.properties, ...properties });
  // ignore prop starting with data
  propEntries = propEntries.filter(([key, value]) => !key.startsWith('data'));
  // ignore prop with empty data
  propEntries = propEntries.filter(([key, value]) => value);

  properties = Object.fromEntries(propEntries);
  const newHastNode: HastElement = {
    ...node,
    properties,
    children: [hastText(childrenMarkdown)],
  };

  const source = toHtml(newHastNode);
  return source;
}
