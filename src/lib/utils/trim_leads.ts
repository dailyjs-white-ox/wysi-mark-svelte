// trim leading whitespace

const DEFAULT_LEADING_WHITESPACE_OPTIONS = {
  removeBlankFirstLine: false,
  removeBlankLastLine: false,
  trimFirstLine: false, // trim first line, and ignore on computing leading whitespace
  ignoreEmptyLine: true,
};
type LeadingWhitespaceOptions = typeof DEFAULT_LEADING_WHITESPACE_OPTIONS;

export function countLeadingWhitespaces(lines: string[]): number[] {
  return lines
    .map((line) => {
      const match = line.match(/^\s*/);
      if (!match) return 0;
      return match[0].length;
    })
    .filter((length) => length !== undefined) as number[];
}

export function computeMinLeadingWhitespaceLength(
  lines: string | string[],
  options?: Partial<LeadingWhitespaceOptions>
): [number, number[], string[]] {
  const { removeBlankFirstLine, removeBlankLastLine, trimFirstLine, ignoreEmptyLine } = {
    ...DEFAULT_LEADING_WHITESPACE_OPTIONS,
    ...options,
  };
  if (typeof lines === 'string') {
    lines = lines.split('\n');
  } else {
    lines = lines.slice();
  }
  if (trimFirstLine) {
    lines = lines.join('\n').trimStart().split('\n');
  }

  // options
  if (removeBlankLastLine) {
    const lastLineLength = lines.at(-1)?.length;
    if (lastLineLength === 0) {
      lines.pop();
    }
  }
  if (removeBlankFirstLine) {
    if (lines.length > 0 && lines[0].length === 0) {
      lines.shift();
    }
  }
  if (ignoreEmptyLine) {
    lines = lines.filter((line) => line.length !== 0);
  }

  //
  let leadLengths: number[] = countLeadingWhitespaces(lines);

  // compute
  const minLeadLength = Math.min(...(trimFirstLine ? leadLengths.slice(1) : leadLengths));
  return [minLeadLength === Infinity ? 0 : minLeadLength, leadLengths, lines];
}

export function trimLeads(
  lines: string | string[],
  options?: Partial<LeadingWhitespaceOptions>
): string {
  const { trimFirstLine } = { ...DEFAULT_LEADING_WHITESPACE_OPTIONS, ...options };
  if (typeof lines === 'string') {
    lines = lines.split('\n');
  }
  if (trimFirstLine) {
    lines = lines.join('\n').trimStart().split('\n');
  }

  //
  const [minLeadingSpace, _lengths] = computeMinLeadingWhitespaceLength(lines, options);

  // slice with leading space
  const result = lines
    .map((line, index) => {
      if (index === 0 && trimFirstLine) return line;
      return line.slice(minLeadingSpace);
    })
    .join('\n');
  // console.log('🚀 trimLeads ~ minLeadingSpace:', minLeadingSpace, { result, _lengths, lines });
  return result;
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
