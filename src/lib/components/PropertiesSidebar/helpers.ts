import { checkStyleWrapperElement } from '$lib/source/hast/style_wrapper';
import type { NodeIndexTrace, SelectedSourceDetail } from '$lib/selected_stores';
import type { HastContent, SlideHastNode } from '$lib/source_stores';

/**
 * Check whether current node matches the trace.
 */
export function checkIndexTraceMatch(
  [trace, source]: [NodeIndexTrace, SelectedSourceDetail],
  node: HastContent,
  nodeIndex: number
): boolean {
  if (trace.length === 1 && trace[0] === nodeIndex) {
    return true;
  }

  if (checkWrapperSelection([trace, source], node)) {
    return true;
  }

  return false;
}

function checkWrapperSelection(
  [trace, source]: [NodeIndexTrace, SelectedSourceDetail],
  node: HastContent
): boolean {
  if (trace.length === 2) {
    const wrapperType = checkStyleWrapperElement(node);

    // when outer-wrapper is selected ONLY from other than 'Properties', stop here.
    if (source.source !== 'Properties') {
      if (wrapperType === 'outer' && node.type === 'element' && node.children.length === 1) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Recursively find out the traced node
 * @returns the traced node, or undefined if not found.
 */
export function findHastNodeByIndexTrace(
  node: HastContent,
  nodeIndex: number,
  [trace, source]: [NodeIndexTrace, SelectedSourceDetail]
): HastContent | undefined {
  if (node.type !== 'element') return;

  if (checkIndexTraceMatch([trace, source], node, nodeIndex)) {
    return node;
  }

  // trace children
  const remaining = trace.slice(1);
  const childIndex = remaining[0];
  const childNode = node.children[childIndex];
  if (!childNode) return;

  return findHastNodeByIndexTrace(childNode, childIndex, [remaining, source]);
}
