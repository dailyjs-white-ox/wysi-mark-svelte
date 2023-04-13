<script>
  let maximized = false;
  let headerHeight = 60;
  let footerHeight = 60;

  function toggleMax() {
    maximized = !maximized;
  }

  $: if (maximized) {
    headerHeight = 20;
    footerHeight = 0;
  } else {
    headerHeight = 60;
    footerHeight = 60;
  }
</script>

<div
  class="app"
  style:--header-height={`${headerHeight}px`}
  style:--footer-height={`${footerHeight}px`}
>
  <header>
    <h1>wysi mark</h1>
    <button type="button" on:click={toggleMax}>Max</button>
  </header>
  <div>
    <slot {maximized} />
  </div>
  <footer>footer</footer>
</div>

<style>
  .app {
    --header-height: 60px;
    --footer-height: 60px;
  }

  .app {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: var(--header-height, 60px) minmax(0, 1fr) var(--footer-height, 60px);
    grid-template-areas:
      'header'
      'content'
      'footer';
    grid-column-gap: 0px;
    grid-row-gap: 0px;
    width: 100vw;
    height: 100vh;
  }

  header {
    grid-area: header;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
  }
  header h1 {
    margin: 0;
    font-size: 1rem;
  }
  .app > div {
    grid-area: content;
  }
  footer {
    grid-area: footer;
    border-top: 1px solid black;
  }
</style>
