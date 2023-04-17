<script>
  import AuthBox from '$lib/github_authbox/AuthBox.svelte';

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
    <div class="right">
      <button type="button" on:click={toggleMax}>Max</button>
      <AuthBox checkingLabel="Login" />
    </div>
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
    overflow: hidden;
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
    position: relative;

    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
  }
  header:after {
    --shadow-height: 0.5rem;
    --shadow-gradient: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.1) 0%,
      rgba(0, 0, 0, 0.05) 30%,
      transparent 100%
    );
    content: '';
    position: absolute;
    width: 100%;
    height: var(--shadow-height);
    left: 0;
    bottom: calc(-1 * var(--shadow-height));
    background: var(--shadow-gradient);
  }
  header h1 {
    margin: 0;
    font-size: 1rem;
  }
  header > div.right {
    display: flex;
    gap: 4px;
  }
  .app > div {
    grid-area: content;
  }
  footer {
    grid-area: footer;
    border-top: 1px solid black;
  }
</style>
