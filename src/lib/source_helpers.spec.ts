// @vitest-environment jsdom

import { describe, it, beforeEach, expect } from 'vitest';

import { h } from 'hastscript';

import { contentTitleFromHast, contentTitleFromHtml } from './source_helpers';

describe('source helpers', () => {

  describe('contentTitleFromHtml', () => {
    it('should fetch first heading', () => {
      const contentTitle = contentTitleFromHtml('<h2>heading 2</h2><h1>heading 1</h1>');
      expect(contentTitle).toEqual('heading 2')
    });

    it('should fetch first text if there is no heading', () => {
      const contentTitle = contentTitleFromHtml('<p>First sentence.</p>');
      expect(contentTitle).toEqual('First sentence.')
    });
  });

  describe('contentTitleFromHast', () => {
    it('should fetch first heading', () => {
      const contentTitle = contentTitleFromHast([
        h('h2', 'heading 2'),
        h('h1', 'heading 1'),
      ]);
      expect(contentTitle).toEqual('heading 2')
    });

    it('should fetch first text if there is no heading', () => {
      const contentTitle = contentTitleFromHast([h('p', 'First sentence.')]);
      expect(contentTitle).toEqual('First sentence.')
    });
  });

});
