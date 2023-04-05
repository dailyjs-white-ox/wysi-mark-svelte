import { toText } from 'hast-util-to-text';
import { createHtmlElement } from '$lib/utils/html';
import type { HastContent } from './source_stores';

export function contentTitleFromHtml(htmlSource: string): string {
  const { body } = createHtmlElement(htmlSource);
  if (!body) return '';

  const headingEl = body.querySelector('h1,h2,h3,h4,h5,h6');
  if (headingEl !== null) {
    return headingEl.textContent ?? '';
  }

  // return first printable line
  const node = [...body.childNodes].find((node) => node.textContent);
  if (node) {
    return node.textContent ?? '';
  }

  return '';
}

export function contentTitleFromHast(hastNodes: HastContent[]): string {
  const headingNode = hastNodes.find((node) =>
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName)
  );
  if (headingNode) {
    return toText(headingNode);
  }

  const node = hastNodes.find((node) => toText(node));
  if (node) {
    return toText(node) ?? '';
  }
  return '';
}
