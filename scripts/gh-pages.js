import getGitConfigPath from 'git-config-path';
import parseGitConfig from 'parse-git-config';
import { publish } from 'gh-pages';

const { name, email } = (() => {
  const { user } = {
    ...parseGitConfig.sync({ path: getGitConfigPath('global') }),
    ...parseGitConfig.sync(),
  };
  let { name, email } = user ?? {};
  name = name ?? process.env.NAME;
  email = email ?? process.env.EMAIL;
  return { email, name };
})();

if (!name || !email) {
  console.error('ERROR: Could not find name and email from git config.');
  console.error('You must either provide it in git config file or by env var NAME= EMAIL=');
  process.exit(1);
}

console.log('publishing "build" directory to "gh-pages" branch...');
publish(
  'build', // path to public directory
  {
    src: ['**/*', '.nojekyll'],
    branch: 'gh-pages',
    repo: 'git@github.com:dailyjs-white-ox/wysi-mark-svelte.git',
    user: { name, email },
    // dotfiles: true,
  },
  () => {
    console.log('Deploy Complete!');
  }
);
