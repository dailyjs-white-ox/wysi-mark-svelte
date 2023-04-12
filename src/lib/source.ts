import { h } from 'hastscript';
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
 */
export function hastToMarkdownWithHtmlHead(
  node: HastElement,
  properties: {},
  childrenMarkdown: string
): string {
  // hast node with children rendered as markdown
  const newHastNode: HastElement = {
    ...node,
    properties: { ...node.properties, ...properties },
    children: [hastText(childrenMarkdown)],
  };

  const source = toHtml(newHastNode);
  return source;
}

export function hastInsertStyle(
  hastNode: HastElement,
  style: string,
  markdownSource: string
): [{ start: number; end: number }, string] | undefined {
  //console.log('style:', JSON.stringify(style), { hastNode: structuredClone(hastNode) });

  if (!hastNode.properties) hastNode.properties = { style: '' };
  if (!hastNode.position) return;

  // Some tags requires specific syntax to work and cannot be easily replaced with html.
  // Inject a wrapper INSIDE the tag and use that instead.
  const innerWrapTags: { [key: string]: 'inline' | 'block' } = {
    li: 'inline',
    ul: 'block',
  };
  const { tagName, children } = hastNode;
  const wrapType = innerWrapTags[tagName];
  // UL
  if (wrapType) {
    const start = children.find((childNode) => childNode.position?.start?.offset)?.position?.start
      ?.offset;
    const end = children.findLast((childNode) => childNode.position?.end?.offset)?.position?.end
      ?.offset;
    if (start === undefined || end === undefined) {
      console.warn('no start or end found', { start, end, children });
      return;
    }

    // build a inner wrapper node and render as markdown w/ html head
    const wrappedNode = h(`div.${tagName}-inner-wrapper`, {}, children);
    hastNode.children = [wrappedNode];

    // keep children in markdown as text
    const childrenMarkdown = markdownSource.slice(start, end);
    const innerMarkdown = hastToMarkdownWithHtmlHead(
      wrappedNode,
      { style },
      wrapType === 'block' ? '\n\n' + childrenMarkdown + '\n' : childrenMarkdown
    );
    // console.log('🚀 innerMarkdown:', JSON.stringify(innerMarkdown), { wrappedNode, hastNode });
    return [{ start, end }, innerMarkdown];
  }
  // update source for hast node
  else {
    const { position } = hastNode;
    const start = position.start.offset;
    const end = position.end.offset;
    if (start === undefined || end === undefined) return;

    // keep children in markdown as text
    const childrenMarkdown = [
      '',
      ...hastNode.children.map((childNode) => hastToMarkdown(childNode)),
      '',
    ]
      .join('\n')
      .trim();
    const mdSource = hastToMarkdownWithHtmlHead(hastNode, { style }, childrenMarkdown);
    return [{ start, end }, mdSource];
  }
}
