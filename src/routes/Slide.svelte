<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	export let previewHtml: string;

	const dispatch = createEventDispatcher();

	function handleClickCloseSlide() {
		dispatch('clickCloseSlide');
	}
</script>

<div class="slide">
	<nav class="navigator">
		<button on:click={handleClickCloseSlide}>close slide</button>
	</nav>
	<section>
		{@html previewHtml}
	</section>
</div>

<style>
	.navigator {
		padding: 8px;
		border-bottom: 1px dashed gray;
	}
	.slide {
		position: absolute;
		left: 0px;
		right: 0px;
		top: 0px;
		bottom: 0px;
		background-color: white;
	}
</style>
