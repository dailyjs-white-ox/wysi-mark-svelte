import { h } from 'hastscript';
import type { Node as UnistNode, Point as UnistPoint } from 'unist';
import type { HastNodes, HastContent } from 'mdast-util-to-hast/lib/index.js';
import type { HastElement } from 'mdast-util-to-hast/lib/state';

import { computeMinLeadingWhitespaceLength, prependLeadToLines } from '$lib/utils/trim_leads';
import { hastToMarkdown, hastToMarkdownWithHtmlHead } from './utils';

export type { HastNodes, HastContent };

type WrapperType = 'inner' | 'outer';

type Offset = { start: number; end: number };

const innerWrapTags: { [key: string]: WrapperType } = {
  li: 'inner',
  ul: 'outer',
  pre: 'outer',
};

type WithOffset<P extends UnistNode> = P & {
  position: {
    start: UnistPoint & { offset: number };
    end: UnistPoint & { offset: number };
  };
};

type HastElementWithOffset = WithOffset<HastElement>;

function isHastElementWithOffset(hastNode: HastElement): hastNode is HastElementWithOffset {
  if (hastNode.position?.start?.offset === undefined) return false;
  if (hastNode.position?.end?.offset === undefined) return false;
  return true;
}

/**
 * Build a markdown source that is wrapped with a styled element.
 *
 * @param hastNode
 * @param style
 * @param markdownSource
 * @returns markdown source and its accompanying position (undefined if none)
 */
export function buildMarkdownStyleWrapper(
  hastNode: HastElement,
  style: string,
  markdownSource: string
): [Offset, string] | undefined {
  if (!hastNode.properties) hastNode.properties = { style: '' };
  if (!isHastElementWithOffset(hastNode)) return;

  // node is already as wrapper element
  if (checkStyleWrapperElement(hastNode)) {
    return buildInlineStyle(hastNode, style, markdownSource);
  }

  // Some tags requires specific syntax to work and cannot be easily replaced with html.
  // Inject a wrapper INSIDE the tag and use that instead.
  const wrapType = innerWrapTags[hastNode.tagName] === 'inner' ? 'inner' : 'outer';
  if (wrapType === 'outer') {
    return buildOuterStyleWrapper(hastNode, style, markdownSource);
  }
  // 'inner'
  else if (wrapType === 'inner') {
    return buildInnerStyleWrapper(hastNode, style, markdownSource);
  }
  // other hast nodes
  else {
    return buildInlineStyle(hastNode, style, markdownSource);
  }
}

function buildInnerStyleWrapper(
  hastNode: HastElementWithOffset,
  style: string,
  markdownSource: string
): [Offset, string] | undefined {
  if (!hastNode.properties) hastNode.properties = { style: '' };

  const { tagName, children } = hastNode;

  // find start & end offset from chidlren nodes
  const start = children.find((childNode) => childNode.position?.start?.offset)?.position?.start;
  const end = children.findLast((childNode) => childNode.position?.end?.offset)?.position?.end;
  if (start === undefined || end === undefined) return;
  if (start.offset === undefined || end.offset === undefined) return;

  // build a inner wrapper node and render as markdown w/ html head
  const className = ['wrapper', 'inner-wrapper', `${tagName}-inner-wrapper`];
  const classSelector = className.map((cls) => '.' + cls).join('');
  const wrappedNode = h(`div${classSelector}`, {}, children);
  hastNode.children = [wrappedNode];

  const childrenMarkdown = markdownSource.slice(start.offset, end.offset);
  let innerMarkdown: string;
  innerMarkdown = hastToMarkdownWithHtmlHead(wrappedNode, { style }, childrenMarkdown);
  // console.log('🚀 innerMarkdown:', JSON.stringify(innerMarkdown), { hastNode });

  return [{ start: start.offset, end: end.offset }, innerMarkdown];
}

function buildOuterStyleWrapper(
  hastNode: HastElementWithOffset,
  style: string,
  markdownSource: string
): [Offset, string] | undefined {
  if (!hastNode.properties) hastNode.properties = { style: '' };

  // Some tags requires specific syntax to work and cannot be easily replaced with html.
  // Inject a wrapper INSIDE the tag and use that instead.
  const { tagName, children } = hastNode;
  const { start, end } = hastNode.position;

  // build a inner wrapper node and render as markdown w/ html head
  const className = ['wrapper', 'outer-wrapper', `${tagName}-outer-wrapper`];
  const classSelector = className.map((cls) => '.' + cls).join('');
  const wrappedNode = h(`div${classSelector}`, {}, children);
  hastNode.children = [wrappedNode];

  let childrenMarkdown;
  //childrenMarkdown = markdownSource.slice(start.offset, end.offset);
  // slice with leading whitespace, (block will be re-indented later.)
  let slicedSourceLines = markdownSource.split('\n').slice(start.line - 1, end.line);
  const [leadLength, _allLeadLengths] = computeMinLeadingWhitespaceLength(slicedSourceLines);
  childrenMarkdown = slicedSourceLines.map((line) => line.slice(leadLength)).join('\n');

  // surround markdown with newlines
  childrenMarkdown = '\n\n' + childrenMarkdown + '\n';

  // render html'ed markdown
  let innerMarkdown: string;
  innerMarkdown = hastToMarkdownWithHtmlHead(wrappedNode, { style }, childrenMarkdown);

  // re-indent children
  const innerMarkdownLines = innerMarkdown.split('\n');
  innerMarkdown = [
    innerMarkdownLines[0],
    ...prependLeadToLines(innerMarkdownLines.slice(1), leadLength),
  ].join('\n');

  //console.log('🚀 innerMarkdown:', JSON.stringify(innerMarkdown), { hastNode, wrappedNode });
  return [{ start: start.offset, end: end.offset }, innerMarkdown];
}

function buildInlineStyle(
  hastNode: HastElementWithOffset,
  style: string,
  markdownSource: string
): [Offset, string] | undefined {
  // keep children in markdown as text
  // const childrenMarkdown = markdownSource.slice(start.offset, end.offset);
  const childrenMarkdown = hastNode.children
    .map((childNode) => hastToMarkdown(childNode))
    .join('\n')
    .trim();

  // console.log( '🚀 ~ file: source.ts:134 ~ childrenMarkdown:', childrenMarkdown, JSON.stringify(hastNode, null, 2));
  const mdSource = hastToMarkdownWithHtmlHead(hastNode, { style }, childrenMarkdown);

  const { start, end } = hastNode.position;
  return [{ start: start.offset, end: end.offset }, mdSource];
}

export function buildMarkdownStyleRemover(
  hastNode: HastElement,
  markdownSource: string
): [Offset, string] | undefined {
  if (hastNode.position === undefined) return;
  const { start, end } = hastNode.position;
  if (start?.offset === undefined) return;
  if (end?.offset === undefined) return;

  // remove outer/inner wrapper element
  const wrapperType = checkStyleWrapperElement(hastNode);

  // remove outer wrapping element
  if (wrapperType === 'outer') {
    const onlyChild = hastNode.children[0] as HastElementWithOffset;
    // const { start, end } = onlyChild.position ?? {};

    //
    const childrenMarkdown = getChildMarkdownByLine(
      hastNode as HastElementWithOffset,
      markdownSource
    );
    if (!childrenMarkdown) return;

    return [{ start: start.offset, end: end.offset }, childrenMarkdown];
  }
  // remove inner wrapping element
  else if (wrapperType === 'inner') {
    const onlyChild = hastNode.children[0] as HastElementWithOffset;
    // const { start, end } = onlyChild.position ?? {};

    //
    const childrenMarkdown = getChildMarkdownByOffset(
      hastNode as HastElementWithOffset,
      markdownSource
    );
    // console.log( '🚀 ~ file: style_wrapper.ts:197 ~ childrenMarkdown:', JSON.stringify(childrenMarkdown), { markdownSource, onlyChild, hastNode, });
    if (!childrenMarkdown) return;

    return [{ start: start.offset, end: end.offset }, childrenMarkdown];
  }
  // turn html back to markdown
  else {
    throw new Error('Not Implmemented');
  }
}

function getChildMarkdownByOffset(
  hastNode: HastElementWithOffset,
  markdownSource: string
): string | undefined {
  const onlyChild = hastNode.children[0] as HastElementWithOffset;
  const { start, end } = onlyChild.position ?? {};

  return markdownSource.slice(start.offset, end.offset);
}

function getChildMarkdownByLine(
  hastNode: HastElementWithOffset,
  markdownSource: string
): string | undefined {
  const onlyChild = hastNode.children[0] as HastElementWithOffset;
  const { start, end } = onlyChild.position ?? {};

  let slicedSourceLines = markdownSource.split('\n').slice(start.line - 1, end.line);

  // dedent. (outerIndent < innerIndent)
  const outerIndent = hastNode.position.start.column;
  const innerIndent = start.column;
  const dedentAmount = Math.max(innerIndent - outerIndent, 0);

  const childrenMarkdown = slicedSourceLines.map((line) => line.slice(dedentAmount)).join('\n');
  return childrenMarkdown;
}

/**
 * Check if node is a wrapper element. If it is, return the wrapper type. Return false if not.
 * @param node
 * @returns either wrapper type, or false.
 */
export function checkStyleWrapperElement(node: HastContent): false | WrapperType {
  if (node.type !== 'element') return false;

  const { tagName } = node;
  const className: string[] = (node.properties?.className ?? []) as string[];
  if (!(tagName === 'div' && className?.includes('wrapper'))) {
    return false;
  }

  if (className.includes('outer-wrapper')) return 'outer';
  else if (className.includes('inner-wrapper')) return 'inner';

  //
  console.error('cannot figure out wrapper type:', className);
  return false;
}
