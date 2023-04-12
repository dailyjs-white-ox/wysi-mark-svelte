import { inspect } from 'node:util';
import { h } from 'hastscript';
import { describe, it, expect } from 'vitest';
import { hastInsertStyle, hastText, removeBlankTextNodes, replaceMarkdownAt } from './source';
import { fromHtml } from 'hast-util-from-html';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import { removePosition } from 'unist-util-remove-position';
import { select } from 'hast-util-select';
import type { HastRoot } from 'mdast-util-to-hast/lib';
import type { HastElement } from 'mdast-util-to-hast/lib/state';
import type { Node } from 'hast';
import { toMarkdown } from 'mdast-util-to-markdown';

describe('hastInsertStyle', () => {
  it('convert p tag to html', () => {
    const markdownSource = 'abc';
    const mdast = fromMarkdown(markdownSource);
    const hastNode = (toHast(mdast) as HastRoot).children[0];
    // const hastNode = fromHtml('<p>abc</p>', { fragment: true }).children[0];

    const result = hastInsertStyle(hastNode as HastElement, 'color: blue;', markdownSource);
    expect(result).not.toBeUndefined();
    if (result === undefined) return;

    const [_pos, mdSource] = result;
    expect(mdSource).toEqual('<p style="color: blue;">abc</p>');
  });

  describe('li tag', () => {
    it('wrap li tag inner with html', () => {
      const markdownSource = [
        //
        '* 1st item',
        '* 2nd item',
      ].join('\n');
      const mdast = fromMarkdown(markdownSource);
      const hastNode = (toHast(mdast) as HastRoot).children[0];

      // verify rendered HTML
      const htmlSource = toHtml(hastNode);
      expect(htmlSource.replace(/\s/g, '')).toEqual(
        `
        <ul>
            <li>1st item</li>
            <li>2nd item</li>
        </ul>`.replace(/\s/g, '')
      );

      //
      const liNode = select('li', hastNode);
      const result = hastInsertStyle(liNode as HastElement, 'color: blue;', markdownSource);
      expect(result).not.toBeUndefined();
      if (result === undefined) return;

      // verify converted part
      const [pos, targetMarkdown] = result;
      const expectedTargetMarkdown =
        '<div class="li-inner-wrapper" style="color: blue;">1st item</div>';
      // console.log('Expected:', format(expectedTargetMarkdown));
      // console.log('Actual  :', format(targetMarkdown));
      expect(targetMarkdown).toEqual(expectedTargetMarkdown);

      // verify entire markdown
      const newMarkdownSource = replaceMarkdownAt(markdownSource, pos, targetMarkdown);
      expect(newMarkdownSource.replace(/\s/g, '')).toEqual(
        `
      * <div class="li-inner-wrapper" style="color: blue;">1st item</div>
      * 2nd item
    `.replace(/\s/g, '')
      );
    });
  });

  describe('ul tag', () => {
    it('wrap ul tag inner with html', () => {
      const markdownSource = [
        //
        'some text',
        '',
        '- 1st item',
        '- 2nd item',
      ].join('\n');
      const mdast = fromMarkdown(markdownSource);
      let hastNode = toHast(mdast) as HastRoot;
      hastNode = removeBlankTextNodes(hastNode);

      // verify rendered HTML
      const htmlSource = toHtml(hastNode);
      // console.log('Expected:', format(normalizeHtml(` <p>some text</p> <ul> <li>1st item</li> <li>2nd item</li> </ul> `)));
      // console.log('Actual  :', format(normalizeHtml(htmlSource)));
      expect(normalizeHtml(htmlSource)).toEqual(
        normalizeHtml(`
          <p>some text</p>

          <ul>
            <li>1st item</li>
            <li>2nd item</li>
          </ul>
        `)
      );

      //
      const ulNode = select('ul', hastNode);
      // console.log('ulNode:', format(ulNode, { removePosition: false }));
      const result = hastInsertStyle(ulNode as HastElement, 'color: blue;', markdownSource);
      expect(result).not.toBeUndefined();
      if (result === undefined) return;

      // verify converted part
      const [pos, targetMarkdown] = result;
      const expectedTargetMarkdown = trimLeads(`
          <div class="ul-inner-wrapper" style="color: blue;">

          - 1st item
          - 2nd item
          </div>`);
      //console.log('Expected:', format(expectedTargetMarkdown));
      //console.log('Actual  :', format(targetMarkdown));
      expect(targetMarkdown).toEqual(expectedTargetMarkdown);

      // verify entire markdown
      const entireMarkdown = replaceMarkdownAt(markdownSource, pos, targetMarkdown);
      const expectedEntireMarkdown = trimLeads(`
          some text

          <div class="ul-inner-wrapper" style="color: blue;">

          - 1st item
          - 2nd item
          </div>`);
      // console.log('expected:', format(expectedEntireMarkdown));
      // console.log('actual  :', format(entireMarkdown));
      expect(trimLeads(entireMarkdown)).toEqual(expectedEntireMarkdown);
    });
  });
});

// helpers

function trimLeads(str: string): string {
  const lines = str.split('\n');
  if (lines.length > 0 && lines[0].trim().length === 0) {
    lines.shift();
  }
  const lengths = lines
    .map((line) => {
      if (line.length === 0) return;
      const match = line.match(/^\s*/);
      if (!match) return;
      return match[0].length;
    })
    .filter((length) => length !== undefined) as number[];
  const minLeadingSpace = Math.min(...lengths);
  // console.log('🚀 trimLeads ~ minLeadingSpace:', minLeadingSpace, { lengths, lines });
  return lines.map((line) => line.slice(minLeadingSpace)).join('\n');
}

function normalizeHtml(htmlSource: string) {
  const hast = fromHtml(htmlSource, { fragment: true });
  const hast2 = removeBlankTextNodes(hast);
  return toHtml(hast2, { allowDangerousHtml: true });
}

type FormatOptions = {
  removePosition: boolean;
  trimLeads: boolean;
  normalizeHtml: boolean;
  nested: number;
  depth: null | number;
  colors: boolean;
};
const DEFAULT_FORMAT_OPTIONS = {
  removePosition: true,
  trimLeads: false,
  normalizeHtml: false,
  depth: null,
  colors: true,
  nested: 0,
};
function format(arg: unknown, options: Partial<FormatOptions> = {}): unknown {
  // console.log('[FORMAT]', typeof arg, arg, options);
  const {
    nested,
    trimLeads: trimLeadsOption,
    normalizeHtml: normalizeHtmlOption,
    removePosition: removePositionOption,
    depth,
    colors,
  } = { ...DEFAULT_FORMAT_OPTIONS, ...options };

  if (typeof arg === 'number') return arg;
  if (typeof arg === 'string') {
    if (normalizeHtmlOption) {
      arg = normalizeHtml(arg);
    } else if (trimLeadsOption && arg.split('\n').length > 1) {
      arg = trimLeads(arg);
    }
    // if (!nested) { return JSON.stringify(arg); }
  }
  //// array
  //if (Array.isArray(arg)) {
  //  return arg.map((x) => format(x, { ...options, nested: nested + 1 }));
  //}
  if (arg === null) return null;
  // object
  if (typeof arg === 'object') {
    if (
      arg.hasOwnProperty('position') &&
      typeof arg['position'] === 'object' &&
      removePositionOption
    ) {
      arg = removePosition(structuredClone(arg) as Node, { force: true });
    }
    //const entries = Object.entries(arg);
    //const entries2 = entries.map(([key, value]) => [
    //  key,
    //  format(value, { ...options, nested: nested + 1 }),
    //]);
    //// return Object.fromEntries(entries2);
    //// return inspect(Object.fromEntries(entries2), { depth });
    // arg = Object.fromEntries(entries2);
    // console.dir(arg);
  }

  // default behavior
  return inspect(arg, { depth, colors });
}

function dir(...args: unknown[]) {
  const options: { nested?: boolean; removePosition?: boolean } = {};
  // options.removePosition = true;

  console.log(...args.map((arg) => format(arg, options)));
  // console.log(args.map((x) => inspect(x)));
}
