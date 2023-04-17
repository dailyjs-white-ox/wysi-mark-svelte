// most of the codes in this file is based on firebase github auth document,
// https://firebase.google.com/docs/auth/web/github-auth?authuser=0

// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GithubAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type User,
} from 'firebase/auth';
import { FirebaseError } from '@firebase/util';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAF5e7QIoALpco7IL4rO6kD6ZwxdQaOVjM',
  authDomain: 'wysi-mark-svelte.firebaseapp.com',
  projectId: 'wysi-mark-svelte',
  storageBucket: 'wysi-mark-svelte.appspot.com',
  messagingSenderId: '875925428320',
  appId: '1:875925428320:web:13097129db3709fad64b05',
};

export function initAuth() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  // Initialize Firebase Authentication and get a reference to the service
  const auth = getAuth(app);

  return auth;
}

export function firebaseGithubSignIn() {
  const auth = initAuth();
  const provider = new GithubAuthProvider();
  //provider.addScope('repo');
  //provider.setCustomParameters({ allow_signup: 'false' });
  signInWithRedirect(auth, provider);
}

export async function handleLoginRedirect(): Promise<User | undefined> {
  const auth = getAuth();
  try {
    const result = await getRedirectResult(auth);
    if (!result) {
      return;
    }

    const credential = GithubAuthProvider.credentialFromResult(result);
    if (credential) {
      // This gives you a GitHub Access Token. You can use it to access the GitHub API.
      const token = credential.accessToken;
      // ...
      //console.log('github access token:', token);
    }

    // The signed-in user info.
    const user = result.user;
    return user;
  } catch (error) {
    if (error instanceof FirebaseError) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.email;
      // The AuthCredential type that was used.
      const credential = GithubAuthProvider.credentialFromError(error);
      // ...
      console.error('auth error:', {
        errorCode,
        errorMessage,
        email,
        credential,
      });
    }
  }
}

export async function firebaseGithubSignOut() {
  const auth = getAuth();

  try {
    await signOut(auth);
  } catch (err) {
    console.error('logout error:', err);
  }
}
