<script lang="ts">
  import { onMount } from 'svelte';
  import {
    handleLoginRedirect,
    firebaseGithubSignIn,
    firebaseGithubSignOut,
    initAuth,
  } from './firebase_github_auth';
  import type { User } from 'firebase/auth';

  export let checkingLabel = 'Checking...';
  export let flex: boolean | 'row' | 'column' | undefined = undefined;

  let currentUser: User | null = null;
  let loginStatus: boolean | undefined = undefined; // 3 states, not 2 (undefined refers to "checking..")
  $: {
    // update login status, except for the initial state
    if (!(loginStatus === undefined && currentUser === null)) {
      loginStatus = !!currentUser;
    }
  }

  async function logout() {
    await firebaseGithubSignOut();
    currentUser = null;
  }

  onMount(async () => {
    const auth = initAuth();
    const result = await handleLoginRedirect();

    if (auth.currentUser) {
      currentUser = auth.currentUser;
    } else {
      currentUser = result;
    }
    loginStatus = !!currentUser;
  });
</script>

<div
  class="auth-box"
  style:display={flex ? 'flex' : 'block'}
  style:flex-direction={flex ? flex && 'row' : null}
>
  {#if loginStatus === undefined}
    <button disabled>{checkingLabel}</button>
  {:else if loginStatus === true}
    <img alt={currentUser?.displayName} src={currentUser?.photoURL} />
    <button on:click={logout}>Logout</button>
  {:else if loginStatus === false}
    <button on:click={firebaseGithubSignIn}>Login</button>
  {/if}
</div>

<style>
  .auth-box {
    display: flex;
  }
  img {
    height: 30px;
  }
</style>
