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
import { toText } from 'hast-util-to-text';
import type { HastNodes, HastContent, MdastRoot } from 'mdast-util-to-hast/lib/index.js';

import { buildSlideIndexClassName } from './components/Preview/utils';
import { prependSelector } from './utils/cssparse';
import { removeBlankTextNodes } from './source/hast/utils';

export type { HastNodes, HastContent };

// see ../../node_modules/hast-util-sanitize/lib/schema.js for details
const sanitizeSchema = structuredClone({
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'header', 'footer', 'style'],
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
  // console.log('🚀 ~ file: source_stores.ts:42 ~ turnMdastToSanitizedHast ~ hastTree2:', hastTree2, { hastTree0, hastTree1, });
  return hastTree2;
}

// markdown-driven
export const WELCOME_MESSAGE = `
# Welcome

welcome to [wysi mark](https://github.com/dailyjs-white-ox/wysi-mark-svelte) !

Try the followings:
* write content in markdown
* **click me** and try adding styles in the right side bar
* split into a new slide by adding a separator "\`-- -\`"
  `;

export const markdown = (() => {
  const store = writable(WELCOME_MESSAGE);

  /** Update store on specific range */
  function updateAt({ start, end }: { start: number; end: number }, value: string) {
    store.update(($markdown) => $markdown.slice(0, start) + value + $markdown.slice(end));
  }

  return {
    ...store,
    updateAt,
  };
})();

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
  // normalize children
  const { children } = removeBlankTextNodes($hast);

  // group nodes by HR node
  const slideGroups: HastContent[][] = children.reduce<HastContent[][]>(
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
  if (slideGroups.length > 0 && slideGroups[0].length === 0) {
    slideGroups.shift();
  }

  slideGroups.forEach((groupNodes, groupIndex) => {
    // assign slide index and node trace
    assignNodeIndexTrace(groupNodes, groupIndex);

    // inject slide unique hash to inline styles
    injectSlideLocalCssScope(groupNodes, groupIndex);
  });

  // console.log('🚀 $slideHasts', slideGroups);
  return slideGroups;
});

function assignNodeIndexTrace(
  nodes: HastContent[],
  groupIndex: number,
  ancestorTrace: number[] = []
) {
  nodes.forEach((node, index) => {
    if (!isElement(node)) return;

    node.properties = node.properties ?? {};
    node.properties.dataNodeIndexTrace = [...ancestorTrace, index].join('.');
    assignNodeIndexTrace(node.children, groupIndex, [...ancestorTrace, index]);
  });
}

function injectSlideLocalCssScope(groupNodes: HastContent[], groupIndex: number) {
  const styleNodes = groupNodes.filter(
    (node) => node.type === 'element' && node.tagName === 'style'
  );
  if (styleNodes.length === 0) return;

  const className = buildSlideIndexClassName(groupIndex);
  styleNodes.forEach((hastNode) => {
    const styleText = toText(hastNode).trim();
    const styleText2 = prependSelector(styleText, `article.${className}`);
    hastNode.children = [{ type: 'text', value: styleText2 }];
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
