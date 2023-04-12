import { inspect } from 'node:util';
import { describe, it, expect } from 'vitest';

import { fromHtml } from 'hast-util-from-html';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import { removePosition } from 'unist-util-remove-position';
import { select } from 'hast-util-select';
import type { HastRoot, HastElement } from 'mdast-util-to-hast/lib/state';
import type { Node } from 'hast';
import { hastInsertStyle, removeBlankTextNodes, replaceMarkdownAt, trimLeads } from './source';

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

  describe('inline', () => {
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

  describe('block', () => {
    it('wraps ul tag inner with html', () => {
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
      const expectedTargetMarkdown = trimLeads(
        `
          <div class="ul-inner-wrapper" style="color: blue;">

          - 1st item
          - 2nd item
          </div>`,
        { removeBlankFirstLine: true }
      ).trim();
      // console.log('Expected:', format(expectedTargetMarkdown));
      // console.log('Actual  :', format(targetMarkdown));
      expect(targetMarkdown).toEqual(expectedTargetMarkdown);

      // verify entire markdown
      const entireMarkdown = replaceMarkdownAt(markdownSource, pos, targetMarkdown);
      const expectedEntireMarkdown = trimLeads(
        `
          some text

          <div class="ul-inner-wrapper" style="color: blue;">

          - 1st item
          - 2nd item
          </div>`,
        { removeBlankFirstLine: true }
      ).trim();
      // console.log('expected:', format(expectedEntireMarkdown));
      // console.log('actual  :', format(entireMarkdown));
      expect(trimLeads(entireMarkdown)).toEqual(expectedEntireMarkdown);
    });

    it('keeps indent of parent', () => {
      const markdownSource = trimLeads(
        `
        some text

        * parent list
          - 1st item of child list
          - 2nd item of child list
        * ending list item
      `.trimEnd()
      );
      const mdast = fromMarkdown(markdownSource);
      let hastNode = toHast(mdast) as HastRoot;
      hastNode = removeBlankTextNodes(hastNode);
      // console.log('🚀 hastNode:', format(hastNode, { removePosition: false }));

      // verify rendered HTML
      const htmlSource = toHtml(hastNode);
      const expectedHtmlSource = normalizeHtml(
        `
        <p>some text</p>
        <ul>
          <li>parent list<ul>
              <li>1st item of child list</li>
              <li>2nd item of child list</li>
            </ul>
          </li>
          <li>ending list item</li>
        </ul>
        `
      );
      // console.log('Expected:', format(expectedHtmlSource));
      // console.log('Actual  :', format(normalizeHtml(htmlSource)));
      expect(normalizeHtml(htmlSource)).toEqual(expectedHtmlSource);

      //
      const childUlNode = select('ul ul', hastNode);
      // console.log('childUlNode:', format(childUlNode, { removePosition: false }));
      const result = hastInsertStyle(childUlNode as HastElement, 'color: blue;', markdownSource);
      expect(result).not.toBeUndefined();
      if (result === undefined) return;

      const [pos, targetMarkdown] = result;

      // verify converted part
      const expectedTargetMarkdown = trimLeads(
        `
         <div class="ul-inner-wrapper" style="color: blue;">

           - 1st item of child list
           - 2nd item of child list
           </div>`
      ).trim();
      // console.log('Expected:', format(expectedTargetMarkdown));
      // console.log('Actual  :', format(targetMarkdown));
      expect(targetMarkdown).toEqual(expectedTargetMarkdown);

      // verify entire markdown
      const entireMarkdown = replaceMarkdownAt(markdownSource, pos, targetMarkdown);
      const expectedEntireMarkdown = trimLeads(`
          some text

          * parent list
            <div class="ul-inner-wrapper" style="color: blue;">

            - 1st item of child list
            - 2nd item of child list
            </div>
          * ending list item`);
      // console.log('expected:', format(expectedEntireMarkdown));
      // console.log('actual  :', format(entireMarkdown));
      expect(entireMarkdown).toEqual(expectedEntireMarkdown);
    });
  });
});

// helpers

function normalizeHtml(htmlSource: string, options = {}) {
  const { verbose } = { verbose: false, ...options };

  const hast = fromHtml(htmlSource, { fragment: true });
  const hast2 = removeBlankTextNodes(hast);
  const html2 = toHtml(hast2, { allowDangerousHtml: true });
  if (verbose) {
    console.log(
      '🚀 ~ file: source.spec.ts:229 ~ normalizeHtml ~ hast:',
      format(html2),
      format(
        {
          hast: removePosition(hast, { force: true }),
          hast2: removePosition(hast2, { force: true }),
        },
        { depth: null }
      )
    );
  }
  return html2;
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
  }

  // default behavior
  return inspect(arg, { depth, colors });
}
