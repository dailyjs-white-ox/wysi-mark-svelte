import { writable, readable, derived, type Writable, type Readable, get } from 'svelte/store';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';
import { toMarkdown } from 'mdast-util-to-markdown';
import { fromHtml } from 'hast-util-from-html';
import { toMdast } from 'hast-util-to-mdast';
import { toHtml } from 'hast-util-to-html';
import { isElement } from 'hast-util-is-element';
import { filter } from 'unist-util-filter';
import { h } from 'hastscript';
import type { HastRoot, HastNodes, HastContent } from 'mdast-util-to-hast/lib/index.js';
import type { MdastNode } from 'hast-util-to-mdast/lib/index.js';
import type { VFile } from 'vfile';

export type { HastNodes, HastContent };

// export const markdown = writable('');
// export const html = writable('');
// export const mdast: Writable<MdastNode> = writable();

// ---

// hast-driven approach

//export const hast: Writable<HastRoot> = writable(h());
//
//export const html = derived(hast, ($hast) => toHtml($hast));
//
//export const markdown = (() => {
//  const store = derived(hast, ($hast) => {
//    const mdast = toMdast($hast);
//
//    const markdownSource = toMarkdown(mdast);
//    console.log('markdown updated from hast', JSON.stringify(markdownSource), { $hast, mdast });
//    return markdownSource;
//  });
//
//  return {
//    ...store,
//    set(source: string) {
//      console.log('markdown.set', JSON.stringify(source));
//      const mdast = fromMarkdown(source);
//      const hastTree = toHast(mdast);
//      hast.set(hastTree);
//    },
//  };
//})();

// ---

// markdown-driven

export const markdown = writable('');

export const hast = (() => {
  const store = derived(markdown, ($markdown) => {
    const mdastTree = fromMarkdown($markdown);
    const hastTree = toHast(mdastTree);
    console.log('🚀 hastTree:', hastTree, { $markdown, mdastTree });
    if (!hastTree) {
      throw new Error('hastTree is null');
    }
    return hastTree;
  });

  return store;
})();

export const html = derived(hast, ($hast) => toHtml($hast));

// export function setMarkdown(markdown: string) {
//   console.log('setMarkdown:', JSON.stringify(markdown));
//   const mdast = fromMarkdown(markdown);
//   const hastTree = toHast(mdast);
//   hast.set(hastTree);
// }

//// propagate change on markdown change
//markdown.subscribe(($markdown) => {
//  console.log('$markdown:', typeof $markdown, JSON.stringify($markdown));
//  const mdastTree = fromMarkdown($markdown);
//  mdast.set(mdastTree);
//
//  //const hastTree = toHast(mdastTree);
//  //if (!hastTree) {
//  //  throw new Error('failed transforming mdast to hast');
//  //}
//  //hast.set(hastTree);
//  //
//  //const htmlSource = toHtml(hastTree);
//  //html.set(htmlSource);
//});

//// propagate change on html change
//html.subscribe(($html) => {
//  const hastTree = fromHtml($html, { fragment: true });
//  hast.set(hastTree);
//
//  //const mdastTree = toMdast(hastTree);
//  //mdast.set(mdastTree);
//  //
//  //const markdownSource = toMarkdown(mdastTree);
//  //console.log('mrakdown.set:', JSON.stringify(markdownSource), { $html });
//  //markdown.set(markdownSource);
//});

//hast.subscribe(($hast) => {
//  // propagate towards html
//  const htmlSource = toHtml($hast);
//  if (htmlSource !== get(html)) {
//    html.set(htmlSource);
//  }
//
//  // propagate towards markdown
//  const mdastTree = toMdast($hast);
//  mdast.set(mdastTree);
//  //const markdownSource = toMarkdown(mdastTree);
//  //console.log('mrakdown.set:', JSON.stringify(markdownSource), { $hast });
//  //markdown.set(markdownSource);
//});

//mdast.subscribe(($mdast) => {
//  const markdownSource = toMarkdown($mdast);
//  console.log('mrakdown.set:', JSON.stringify(markdownSource), { $mdast });
//  markdown.set(markdownSource);
//
//  const hastTree = toHast($mdast);
//  if (!hastTree) {
//    throw new Error('failed transforming mdast to hast');
//  }
//  hast.set(hastTree);
//});

export const slideHasts: Readable<HastContent[][]> = derived(hast, ($hast) => {
  // normalize children - remove blank text nodes, throughout the tree
  const { children } = filter($hast, null, (node) => {
    if (node.type === 'text' && node.value.trim() === '') {
      return false;
    }
    return true;
  }) as HastRoot;

  // group nodes by HR node
  const groups: HastContent[][] = children.reduce<HastContent[][]>(
    (memo, node) => {
      const lastGroup = memo.at(-1) ?? [];

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
    //node.properties.className = (node.properties.className ?? []) as string[];
    //node.properties.className.push(`node-index-${[...ancestorTrace, index].join('.')}`);

    assignNodeIndexTrace(node.children, [...ancestorTrace, index]);
  });
}

// FIXME: deprecate me
export const slides: Readable<string[]> = derived(html, ($html) =>
  $html
    .split('<hr>')
    .map((text) => text.trim())
    .filter(Boolean)
);

// functions

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
