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
 *
 *
 */
export function hastToMarkdownWithHtmlHead(
  node: HastElement,
  properties: {},
  childrenMarkdown: string
): string {
  // ignore prop starting with data
  const nodeProperties = Object.fromEntries(
    Object.entries(node.properties ?? {}).filter(([key, value]) => !key.startsWith('data'))
  );

  const newHastNode: HastElement = {
    ...node,
    properties: { ...nodeProperties, ...properties },
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
    pre: 'block',
  };
  const { tagName, children } = hastNode;
  const wrapType = innerWrapTags[tagName];
  // UL
  if (wrapType) {
    // find start & end offset from chidlren nodes
    const start = children.find((childNode) => childNode.position?.start?.offset)?.position?.start;
    const end = children.findLast((childNode) => childNode.position?.end?.offset)?.position?.end;
    if (start === undefined || end === undefined) return;
    if (start.offset === undefined || end.offset === undefined) {
      console.warn('no start or end found', { start, end, children });
      return;
    }

    // build a inner wrapper node and render as markdown w/ html head
    const wrappedNode = h(`div.${tagName}-inner-wrapper`, {}, children);
    hastNode.children = [wrappedNode];

    // keep children in markdown as text
    let innerMarkdown: string;
    if (wrapType === 'block') {
      let childrenMarkdown = markdownSource.slice(start.offset, end.offset);
      const startLineIndex = start.line - 1;
      const endLineIndex = end.line - 1;
      let slicedSourceLines = markdownSource.split('\n').slice(startLineIndex, endLineIndex + 1);
      const [leadLength, _allLeadLengths] = computeMinLeadingWhitespaceLength(slicedSourceLines);
      childrenMarkdown = slicedSourceLines.map((line) => line.slice(leadLength)).join('\n');

      //
      childrenMarkdown = '\n\n' + childrenMarkdown + '\n';
      // console.log('🚀 ~ file: source.ts:98 ~ childrenMarkdown:', JSON.stringify(childrenMarkdown), { markdownSource, start, end, childrenMarkdown, slicedSourceLines, leadLength, _allLeadLengths, });
      innerMarkdown = hastToMarkdownWithHtmlHead(wrappedNode, { style }, childrenMarkdown);
      // re-indent
      const innerMarkdownLines = innerMarkdown.split('\n');
      innerMarkdown = [
        innerMarkdownLines[0],
        ...prependLeadToLines(innerMarkdownLines.slice(1), leadLength),
      ].join('\n');
    }
    // 'inline'
    else {
      const childrenMarkdown = markdownSource.slice(start.offset, end.offset);
      innerMarkdown = hastToMarkdownWithHtmlHead(wrappedNode, { style }, childrenMarkdown);
    }
    // console.log('🚀 innerMarkdown:', JSON.stringify(innerMarkdown), { wrappedNode, hastNode });
    return [{ start: start.offset, end: end.offset }, innerMarkdown];
  }

  // other hast nodes
  const { start, end } = hastNode.position;
  if (start.offset === undefined || end.offset === undefined) return;

  // keep children in markdown as text
  // const childrenMarkdown = markdownSource.slice(start.offset, end.offset);
  const childrenMarkdown = hastNode.children
    .map((childNode) => hastToMarkdown(childNode))
    .join('\n')
    .trim();
  // console.log( '🚀 ~ file: source.ts:134 ~ childrenMarkdown:', childrenMarkdown, JSON.stringify(hastNode, null, 2));
  const mdSource = hastToMarkdownWithHtmlHead(hastNode, { style }, childrenMarkdown);
  return [{ start: start.offset, end: end.offset }, mdSource];
}

type LeadingWhitespaceOptions = {
  removeBlankFirstLine: boolean;
  removeBlankLastLine: boolean;
  ignoreEmptyLine: boolean;
};

function countLeadingWhitespaces(lines: string[]): number[] {
  return lines
    .map((line) => {
      const match = line.match(/^\s*/);
      if (!match) return 0;
      return match[0].length;
    })
    .filter((length) => length !== undefined) as number[];
}

function computeMinLeadingWhitespaceLength(
  lines: string | string[],
  options?: Partial<LeadingWhitespaceOptions>
): [number, number[], string[]] {
  const { removeBlankFirstLine, removeBlankLastLine, ignoreEmptyLine } = {
    removeBlankFirstLine: false,
    removeBlankLastLine: false,
    ignoreEmptyLine: true,
    ...options,
  };

  if (typeof lines === 'string') {
    lines = lines.split('\n');
  }

  let leadLengths = countLeadingWhitespaces(lines);

  // options
  if (removeBlankLastLine) {
    const lastLineLength = leadLengths.at(-1);
    if (lastLineLength === 0) {
      leadLengths.pop();
    }
  }
  if (removeBlankFirstLine) {
    if (leadLengths.length > 0 && leadLengths[0] === 0) {
      leadLengths.shift();
    }
  }

  if (ignoreEmptyLine) {
    leadLengths = leadLengths.filter((length) => length !== 0);
  }

  const minLeadLength = Math.min(...leadLengths);
  return [minLeadLength === Infinity ? 0 : minLeadLength, leadLengths, lines];
}

export function trimLeads(
  lines: string | string[],
  options?: Partial<LeadingWhitespaceOptions>
): string {
  if (typeof lines === 'string') {
    lines = lines.split('\n');
  }

  const [minLeadingSpace] = computeMinLeadingWhitespaceLength(lines, options);

  // console.log('🚀 trimLeads ~ minLeadingSpace:', minLeadingSpace, { lengths, lines });
  return lines.map((line) => line.slice(minLeadingSpace)).join('\n');
}

export function prependLeadToLines(
  lines: string[],
  length: number,
  options?: Partial<{
    fill: string;
    ignoreEmptyLine: boolean;
  }>
): string[] {
  const { fill, ignoreEmptyLine } = { fill: ' ', ignoreEmptyLine: true, ...options };

  const prefix = [...new Array(length)].map(() => fill).join('');
  const lines2 = lines.map((line) => {
    if (ignoreEmptyLine && line.length === 0) {
      return line;
    }
    return prefix + line;
  });

  return lines2;
}
