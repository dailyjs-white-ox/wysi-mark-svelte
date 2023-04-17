import { parse, generate, find as cssFind, findAll as cssFindAll } from 'css-tree';
import type { Rule, Selector, CssNode, FindFn, List } from 'css-tree';

export function prependSelector(styleText: string, selector: string): string {
  const ast = parse(styleText, { positions: false });

  //const ruleNodes = cssFindAll(ast, (cssnode) => cssnode.type === 'Rule') as Rule[];
  //ruleNodes.forEach((ruleNode) => {
  //  console.log('rule:', JSON.stringify(ruleNode), ruleNode);
  //  // Rule > SelectorList > Selector > *
  //
  //  if (ruleNode.prelude.type === 'Raw') return;
  //
  //  const selectorListNodes = ruleNode.prelude.children.filter(
  //    ({ type }) => type === 'SelectorList'
  //  );
  //
  //  selectorListNodes.forEach((selectorListNode) => {
  //    //   selectorListNode.ch;
  //  });
  //});

  const selectorNodes = findAll(ast, ({ type }) => type === 'Selector') as Selector[];
  selectorNodes.forEach((selectorNode) => {
    const prependingSelectorList = parsePrependingSelector(selector);
    selectorNode.children.prependList(prependingSelectorList);
  });

  return generate(ast);
}

function parsePrependingSelector(selector: string): List<CssNode> {
  // parse prepending selector
  const prependingSelectorAst = parse(selector + '{}');
  const prependingSelector = find<Selector>(
    prependingSelectorAst,
    ({ type }) => type === 'Selector'
  );
  if (!prependingSelector) return;

  const prependingSelectorList = prependingSelector.children;
  prependingSelectorList.appendData({
    type: 'Combinator',
    loc: undefined,
    name: ' ',
  });

  return prependingSelectorList;
}

/**
 * Default csstree.find behavior with types
 */
export function find<T extends CssNode>(ast: CssNode, fn: FindFn): T | null {
  const result = cssFind(ast, fn);
  if (result === null) return null;

  return result as T;
}

/**
 * Default csstree.findAll behavior with types
 */
export function findAll<T extends CssNode>(ast: CssNode, fn: FindFn): T[] {
  const result = cssFindAll(ast, fn);

  return result as T[];
}
