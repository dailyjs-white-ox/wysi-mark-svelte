import { describe, it, beforeEach, expect } from 'vitest';
import { tick } from 'svelte';
import { get, writable } from 'svelte/store';
import type { Readable } from 'svelte/store';

import { markdown, htmlAsync, html, mdast, hast } from './source_stores';


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

describe.skip('html to markdown', () => {
  it('should render Markdown if html is set', async () => {
    let $markdown;
    markdown.subscribe((value) => {
      $markdown = value;
    });

    html.set('<p>a <em>html</em> text</p>')

    //await tick();
    // requires async not because of how stores work, but how remark works.
    await delayAsync(10);

    //console.log("🚀 ~ file: source_stores.spec.ts:32 ~ html.subscribe ~ $html:", JSON.stringify($html));
    expect($markdown).toEqual('a *html* text');
  });

})

describe('mdast', () => {
  it.only('should render MDAST if markdown is set', async () => {
    let $mdast;
    mdast.subscribe((value) => {
      $mdast = value;
    });

    markdown.set('a *markdown* text');

    //await tick();
    // requires async not because of how stores work, but how remark works.
    await delayAsync(10);
    //console.log("🚀 $mdast:", JSON.stringify($mdast, null, 2))

    expect($mdast).toBeTypeOf('object');
    //expect($mdast.children[0]).toMatchObject({
    //  type: "paragraph",
    //  children: [
    //    { type: 'text', value: 'a ' },
    //    { type: 'emphasize', children: [{ type: 'text', value: 'markdown' }] },
    //    { type: 'text', value: ' text' }
    //  ]
    //})
    expect($mdast).toHaveProperty('type', 'root');
    expect($mdast).toHaveProperty('children');
    //expect($mdast.children).toHaveLength(1);
    expect($mdast).toHaveProperty('children', expect.arrayHavingLength(1));
    //expect($mdast.children[0]).toHaveProperty('type', 'paragraph');
    expect($mdast).toHaveProperty('children[0].type', 'paragraph');
    expect($mdast).toHaveProperty('children[0].children');
    //expect($mdast.children[0].children).toHaveLength(3);
    expect($mdast).toHaveProperty('children[0].children', expect.arrayHavingLength(3));
    //expect($mdast).toHaveProperty('children[0].children[0].type', 'text');
    //expect($mdast).toHaveProperty('children[0].children[0].value', 'a ');
    expect($mdast).toHaveProperty('children[0].children[0]', expect.objectContaining(
      { type: 'text', value: 'a ', position: expect.anything() }
    ));
    expect($mdast).toHaveProperty('children[0].children[1]', expect.objectContaining({
      type: 'emphasis', children: [
        { type: 'text', value: 'markdown', position: expect.anything() }
      ]
    }));
    expect($mdast).toHaveProperty('children[0].children[2]', expect.objectContaining(
      { type: 'text', value: ' text', position: expect.anything() }
    ));
  });
})

describe('hast', () => {
  it('should render HAST if markdown is set', async () => {
    let $hast;
    hast.subscribe((value) => {
      $hast = value;
    });

    markdown.set('a *markdown* text');

    //await tick();
    // requires async not because of how stores work, but how remark works.
    await delayAsync(10);

    expect($hast).toBeTypeOf('object');
  });
})

// utils

async function delayAsync(ms = 0) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

expect.extend({
  arrayHavingLength: (...args) => {
    const [received, expected] = args;
    if (received.length !== expected) {
      return {
        message: () => `expected ${received} to have length ${expected}`,
        pass: false,
      };
    }
    return { pass: true };
  }
})
