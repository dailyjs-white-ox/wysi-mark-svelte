import { describe, it, expect } from 'vitest';

import { get } from 'svelte/store';

import { markdown, html, hast } from './source_stores';

describe('markdown to html', () => {
  describe.skip('mdast', () => {
    it('should render MDAST if markdown is set', async () => {
      let $mdast;
      mdast.subscribe((value) => {
        $mdast = value;
      });

      markdown.set('a *markdown* text');

      //await tick();
      // requires async not because of how stores work, but how remark works.
      await delayAsync(10);

      expect($mdast).toBeTypeOf('object');
      const expectedShape = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'a ' },
              { type: 'emphasis', children: [{ type: 'text', value: 'markdown' }] },
              { type: 'text', value: ' text' },
            ],
          },
        ],
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
        children: [
          {
            type: 'element',
            tagName: 'p',
            properties: {},
            children: [
              { type: 'text', value: 'a ' },
              { type: 'element', tagName: 'em', children: [{ type: 'text', value: 'markdown' }] },
              { type: 'text', value: ' text' },
            ],
          },
        ],
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

      expect($html).toEqual('<p>a <em>markdown</em> text</p>');
    });

    it('should work with get(html)', async () => {
      markdown.set('a *markdown* text');

      //await tick();
      // requires async not because of how stores work, but how remark works.
      //await delayAsync(10);

      const $html = get(html);

      expect($html).toEqual('<p>a <em>markdown</em> text</p>');
    });

    describe('inline html', () => {
      it('should render inline html', () => {
        markdown.set(`Outside div

<div>

a *markdown* inside div

</div>
      `);

        const $html = get(html);
        expect($html.replaceAll('\n', '')).toEqual(
          '<p>Outside div</p><div><p>a <em>markdown</em> inside div</p></div>'
        );
      });

      it('should not allow dangerous tags and attributes', () => {
        markdown.set(`Outside div

<script>
console.log('Hello world');
</script>

<a href="" onClick="alert('Hi!')">link</a>

      `);

        const $html = get(html);
        expect($html.replaceAll('\n', '')).toEqual('<p>Outside div</p><p><a href="">link</a></p>');
      });

      it('should allow class and style in particular', () => {
        markdown.set(`Outside div

<div style="border: 1px solid red;">

a *markdown* inside div

</div>

<h2 class="m-0">heading without margin</h2>

      `);

        const $html = get(html);
        expect($html.replaceAll('\n', '')).toEqual(
          [
            '<p>Outside div</p>',
            '<div style="border: 1px solid red;"><p>a <em>markdown</em> inside div</p></div>',
            '<h2 class="m-0">heading without margin</h2>',
          ].join('')
        );
      });

      it('should preserve previous value if parse failed', () => {
        markdown.set(`
a *markdown* text

<div>some text</div>
      `);
        let $html = get(html);
        const expected1 = ['<p>a <em>markdown</em> text</p>', '<div>some text</div>'].join('');
        expect($html.replaceAll('\n', '')).toEqual(expected1);

        // set to brokent html

        markdown.set(`
<div

a *markdown* text

<div>some text</div>
      `);

        $html = get(html);
        expect($html.replaceAll('\n', '')).toEqual(expected1);
      });
    });
  });
});

describe.skip('html to markdown', () => {
  it('should build hast if html is set', () => {
    let $hast;
    hast.subscribe((value) => {
      $hast = value;
    });

    html.set('<p>a <em>html</em> text</p>');

    //await tick();

    const expectedShape = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            { type: 'text', value: 'a ' },
            { type: 'element', tagName: 'em', children: [{ type: 'text', value: 'html' }] },
            { type: 'text', value: ' text' },
          ],
        },
      ],
    };
    expect($hast).toMatchObject(expectedShape);
  });

  it('should build mdast if html is set', () => {
    let $mdast;
    mdast.subscribe((value) => {
      $mdast = value;
    });

    html.set('<p>a <em>html</em> text</p>');

    //await tick();

    const expectedShape = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'a ' },
            { type: 'emphasis', children: [{ type: 'text', value: 'html' }] },
            { type: 'text', value: ' text' },
          ],
        },
      ],
    };
    expect($mdast).toMatchObject(expectedShape);
  });

  it('should render markdown if html is set', async () => {
    let $markdown;
    markdown.subscribe((value) => {
      $markdown = value;
    });

    html.set('<p>a <em>html</em> text</p>');

    //await tick();
    // requires async not because of how stores work, but how remark works.
    //await delayAsync(10);

    expect($markdown.trim()).toEqual('a *html* text');
  });
});

describe.skip('changing hast', () => {
  it('should propagate to html', () => {
    let $html;
    html.subscribe((value) => {
      $html = value;
    });

    hast.set({
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            { type: 'text', value: 'a ' },
            { type: 'element', tagName: 'em', children: [{ type: 'text', value: 'html' }] },
            { type: 'text', value: ' text' },
          ],
        },
      ],
    });

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
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            { type: 'text', value: 'a ' },
            { type: 'element', tagName: 'em', children: [{ type: 'text', value: 'html' }] },
            { type: 'text', value: ' text' },
          ],
        },
      ],
    });

    expect($mdast).toMatchObject({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'a ' },
            { type: 'emphasis', children: [{ type: 'text', value: 'html' }] },
            { type: 'text', value: ' text' },
          ],
        },
      ],
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
