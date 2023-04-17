import { toText } from 'hast-util-to-text';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown';
import type { Content as MdastContent } from 'mdast';
import type { HastContent } from './source_stores';
import { createHtmlElement } from '$lib/utils/html';

export function firstLine(text: string | null): string {
  if (!text) return '';
  const lines = text.trim().split('\n');
  if (lines.length === 0) {
    return text;
  }
  return lines[0] + `... (${lines.length} lines)`;
}

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

export function guessSufficientThematicBreaks(markdown: string): boolean {
  const mdast = fromMarkdown(markdown);

  // there should be 'thematicBreak' nodes before each 'heading' nodes, except the first.
  // return false if there is at least one that does not.
  let checkedFirstHeading = false;
  const hasMissingBreak = mdast.children.some((node, index, entire) => {
    if (node.type === 'heading') {
      if (!checkedFirstHeading) {
        checkedFirstHeading = true;
        return false;
      }
      // previous node is not thematic break!
      if (index > 0 && entire[index - 1].type !== 'thematicBreak') {
        return true;
      }
    }
    return false;
  });

  return hasMissingBreak;
}

export function insertThematicBreaksBeforeEachHeadings(markdown: string): string {
  const mdast = fromMarkdown(markdown);

  let checkedFirstHeading = false;
  mdast.children = mdast.children.reduce<MdastContent[]>((memo, node, index, entire) => {
    if (node.type !== 'heading') return memo.concat([node]);

    if (!checkedFirstHeading) {
      checkedFirstHeading = true;
      return memo.concat([node]);
    }

    // previous node is not thematic break!
    if (index > 0 && entire[index - 1].type !== 'thematicBreak') {
      return memo.concat([{ type: 'thematicBreak' }, node]);
    }

    return memo.concat([node]);
  }, []);

  return toMarkdown(mdast);
}
