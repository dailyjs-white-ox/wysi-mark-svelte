<div class="parent">
	<header>
		<h1>wysi mark</h1>
	</header>
	<main>
		<slot />
	</main>
	<footer> footer </footer>
</div>

<style>
.parent {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 60px 1fr 60px;
	grid-column-gap: 0px;
	grid-row-gap: 0px;
	width: 100vw;
	height: 100vh;
}

header { grid-area: 1 / 1 / 2 / 2; }
header h1 { margin: 0;}
main { 
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	grid-area: 2 / 1 / 3 / 2; 
}
footer { grid-area: 3 / 1 / 4 / 2; }
</style>