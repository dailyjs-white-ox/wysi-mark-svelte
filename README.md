# WYSI-mark slide editor

This is a A markdown-driven WYSIWYG(What You See Is What You Get) slide editor.

It aims on three things:

1. Markdown first: Write content (or some portion of it) in plain text, because it's easier to write with.

2. Easy styling: Add styles and transitions to slides like any other GUI programs -- just like you do in Keynote, Powerpoint, Google Slides, because that's easier.

3. No install: Host your slide content on the web, because you don't want to run your own server just to share ideas.

## Features

Here are some features that is implemented (few), and is on the roadmap.

### Basic Features

- edit content via text

- markdown content is rendered into HTML

- slide specific syntax (`---` is evaluated as 'new slide')

- slide specific styles (local `<style />` tags)

- save & load content (TBD)

- render svelte components (TBD)

### Additional Features (work in progess)

- more code-specific features:

  - syntax highlighting
  - folding & scrolling
  - highlighting specific parts

- simpler methods to add transitions

- more simpler methods to add styles:

  - apply user-defined styles
  - add pug-like syntax
  - tailwindcss support

- nested outline

- load 3rd-party components directly from:

  - npm
  - svelte repl
  - raw file, such as github gist
  - github repository

- social features: login, like, clone, follow

and others..!
