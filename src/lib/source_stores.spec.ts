import { describe, it, beforeEach, expect } from 'vitest';

import { tick } from 'svelte';
import { get, writable } from 'svelte/store';
import type { Readable } from 'svelte/store';

import '../spec_helpers';

import { markdown, html, mdast, hast } from './source_stores';

describe('markdown to html', () => {

  describe('mdast', () => {
    it('should render MDAST if markdown is set', async () => {
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
      const expectedShape = {
        type: 'root',
        children: [{
          type: 'paragraph', children: [
            { type: 'text', value: 'a ' },
            { type: 'emphasis', children: [{ type: 'text', value: 'markdown' }] },
            { type: 'text', value: ' text' }
          ]
        }]
      };
      expect($mdast).toMatchObject(expectedShape);
    });
  });

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
      const expectedShape = {
        type: 'root',
        children: [{
          type: 'element', tagName: 'p', properties: {}, children: [
            { type: 'text', value: 'a ' },
            { type: 'element', tagName: 'em', children: [{ type: 'text', value: 'markdown' }] },
            { type: 'text', value: ' text' }
          ]
        }],
      };
      expect($hast).toMatchObject(expectedShape);
    });
  });

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
      expect($html).toEqual('<p>a <em>markdown</em> text</p>');
    });

    it("MAY work with get(html) because of being async", async () => {
      markdown.set('a *markdown* text');

      //await tick();
      // requires async not because of how stores work, but how remark works.
      //await delayAsync(10);

      const $html = get(html);

      expect($html).toEqual('<p>a <em>markdown</em> text</p>');
    });
  });
});

describe('html to markdown', () => {
  it('should build hast if html is set', () => {
    let $hast;
    hast.subscribe((value) => {
      $hast = value;
    });

    html.set('<p>a <em>html</em> text</p>')

    //await tick();

    const expectedShape = {
      type: 'root',
      children: [{
        type: 'element', tagName: 'p', properties: {}, children: [
          { type: 'text', value: 'a ' },
          { type: 'element', tagName: 'em', children: [{ type: 'text', value: 'html' }] },
          { type: 'text', value: ' text' }
        ]
      }],
    };
    expect($hast).toMatchObject(expectedShape);
  });

  it('should build mdast if html is set', () => {
    let $mdast;
    mdast.subscribe((value) => {
      $mdast = value;
    });

    html.set('<p>a <em>html</em> text</p>')

    //await tick();
    //console.log("🚀 ~ file: source_stores.spec.ts:165 ~ mdast.subscribe ~ $mdast:", $mdast)

    const expectedShape = {
      type: 'root',
      children: [{
        type: 'paragraph', children: [
          { type: 'text', value: 'a ' },
          { type: 'emphasis', children: [{ type: 'text', value: 'html' }] },
          { type: 'text', value: ' text' }
        ]
      }]
    };
    expect($mdast).toMatchObject(expectedShape);
  });

  it('should render markdown if html is set', async () => {
    let $markdown;
    markdown.subscribe((value) => {
      $markdown = value;
    });

    html.set('<p>a <em>html</em> text</p>')

    //await tick();
    // requires async not because of how stores work, but how remark works.
    //await delayAsync(10);

    //console.log("🚀 ~ file: source_stores.spec.ts:32 ~ html.subscribe ~ $html:", JSON.stringify($html));
    expect($markdown.trim()).toEqual('a *html* text');
  });

})

describe('changing hast', () => {
  it('should propagate to html', () => {
    let $html;
    html.subscribe((value) => {
      $html = value;
    });

    hast.set({
      type: 'root',
      children: [{
        type: 'element', tagName: 'p', properties: {}, children: [
          { type: 'text', value: 'a ' },
          { type: 'element', tagName: 'em', children: [{ type: 'text', value: 'html' }] },
          { type: 'text', value: ' text' }
        ]
      }],
    })

    expect($html).toEqual('<p>a <em>html</em> text</p>');
  });

  it('should propagate to markdown', () => {
    let $markdown: string = '';
    markdown.subscribe((value) => {
      $markdown = value;
    });
    let $mdast;
    mdast.subscribe((value) => {
      $mdast = value;
    });

    // action
    hast.set({
      type: 'root',
      children: [{
        type: 'element', tagName: 'p', properties: {}, children: [
          { type: 'text', value: 'a ' },
          { type: 'element', tagName: 'em', children: [{ type: 'text', value: 'html' }] },
          { type: 'text', value: ' text' }
        ]
      }],
    })

    expect($mdast).toMatchObject({
      type: 'root',
      children: [{
        type: 'paragraph', children: [
          { type: 'text', value: 'a ' },
          { type: 'emphasis', children: [{ type: 'text', value: 'html' }] },
          { type: 'text', value: ' text' }
        ]
      }]
    });
    expect($markdown.trim()).toEqual('a *html* text');
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
