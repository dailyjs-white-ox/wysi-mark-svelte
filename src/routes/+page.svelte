<script lang="ts">
	import { unified } from 'unified';
	import remarkParse from 'remark-parse';
	import remarkRehype from 'remark-rehype';
	import rehypeSanitize from 'rehype-sanitize';
	import rehypeStringify from 'rehype-stringify';

	let source = '';
	let previewHtml = '';

	async function generatePreview(source: string) {
		return await unified()
			.use(remarkParse)
			.use(remarkRehype)
			.use(rehypeSanitize)
			.use(rehypeStringify)
			.process(source);
	}

	$: (async function () {
		const preview = await generatePreview(source);
		previewHtml = preview.value.toString();
	})();
</script>

<section class="editor">
	<textarea bind:value={source} />
</section>
<section class="preview">
	{@html previewHtml}
</section>

<style>
	.editor {
		grid-area: 1 / 1 / 2 / 3;
	}
	.preview {
		grid-area: 1 / 3 / 2 / 5;
	}
</style>
