import { describe, it, beforeEach, expect } from 'vitest';
import { tick } from 'svelte';
import { get, writable } from 'svelte/store';
import type { Readable } from 'svelte/store';

import { markdown, htmlAsync, html } from './source_stores';

describe('markdown to html', () => {
  describe('html store', () => {
    it('should render HTML if markdown is set', async () => {
      let $html;
      html.subscribe((value) => {
        $html = value;
      });

      markdown.set('a *markdown* text');

      //await tick();
      // requires async not because of how stores work, but how remark works.
      await delayAsync(10);

      //console.log("🚀 ~ file: source_stores.spec.ts:32 ~ html.subscribe ~ $html:", JSON.stringify($html));
      expect(JSON.stringify($html)).toEqual(JSON.stringify('<p>a <em>markdown</em> text</p>'));
    });

    it("MAY work with get(html) because of being async", async () => {
      markdown.set('a *markdown* text');

      //await tick();
      // requires async not because of how stores work, but how remark works.
      //await delayAsync(10);

      const $html = get(html);

      //console.log("🚀 ~ file: source_stores.spec.ts:25 ~ it.only ~ $html2:", $html2)
      expect($html).toEqual('<p>a <em>markdown</em> text</p>');
    });
  });

  describe('htmlAsync store', () => {
    it('should resolve into HTML with subscription', async () => {
      let htmlPr: Promise<string> | undefined;
      htmlAsync.subscribe((value) => { htmlPr = value });

      markdown.set('a *markdown* text');

      // no ticks required, as the process is synchronous.

      expect(htmlPr).toBeDefined();
      if (typeof htmlPr === 'undefined') return;

      // htmlAsync is a promise
      expect(htmlPr.then).toBeTypeOf('function');

      // which resolves into html
      const $html = await htmlPr;
      expect($html).toEqual('<p>a <em>markdown</em> text</p>');
    });

    it('should resolve into HTML with get', async () => {
      markdown.set('a *markdown* text');

      // htmlAsync is a promise
      const pr = get(htmlAsync);
      expect(pr.then).toBeTypeOf('function');

      // which resolves into html
      const $html = await pr;
      expect($html).toEqual('<p>a <em>markdown</em> text</p>');
    });
  });

});

// utils

async function delayAsync(ms = 0) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}
