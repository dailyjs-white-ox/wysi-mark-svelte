import { describe, it, expect } from 'vitest';

import { prependSelector } from './cssparse';

describe('prependSelector', () => {
  it('should render prepend selector', () => {
    const styleText = `
      h2 {
        text-decoration: underline;
      }
    `;

    const newStyleText = prependSelector(styleText, 'article');
    expect(newStyleText).toEqual(normalize('article h2 { text-decoration: underline }'));
  });

  it('should be prepend to multiple rules', () => {
    const styleText = `
      h1 {
        font-size: 1.5rem;
      }
      h2 {
        text-decoration: underline;
      }
    `;

    const newStyleText = prependSelector(styleText, 'article.slide-index-1 div');
    expect(prependSelector(styleText, 'article')).toEqual(
      normalize(
        ['article h1 { font-size: 1.5rem; }', 'article h2 { text-decoration: underline }'].join(' ')
      )
    );
  });

  it('should be able to prepend multiple selectors', () => {
    const styleText = `
      h2 {
        text-decoration: underline;
      }
    `;

    const newStyleText = prependSelector(styleText, 'article.slide-index-1 div');
    expect(newStyleText).toEqual(
      normalize('article.slide-index-1 div h2 { text-decoration: underline }')
    );
  });
});

/**
 * helper function to simplify comparing generated style text
 */
function normalize(style: string): string {
  style = style.replace(/\s*\{\s*/g, '{').replace(/\s*\}\s*/g, '}');
  // remove whitespace inside rule declaration { ... } around colon( : )
  style = style.replace(/(\{[^}]*)\s*:\s*([^}]*\})/g, '$1:$2');
  // remove trailing semicolons
  style = style.replace(/;}/g, '}');
  return style;
}
