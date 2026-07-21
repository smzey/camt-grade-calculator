// scripts/deploy-gh-pages.mjs
// Manual deploy to GitHub Pages WITHOUT GitHub Actions (used because the account
// can't run Actions). Builds the static client and force-pushes just the built
// files to the `gh-pages` branch, which Pages serves via "Deploy from a branch".
//
//   npm run deploy
//
// `main` never gets build artifacts committed to it — the output is assembled in
// a throwaway temp folder and pushed as a single fresh commit to gh-pages.

import { execSync } from 'node:child_process';
import { cpSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = '/camt-grade-calculator/'; // project-page subpath (match vite base)
const REMOTE = 'https://github.com/smzey/camt-grade-calculator.git';
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });

// 1) Build the client with the project-page base so asset URLs resolve.
console.log('▶ Building client…');
run(`npm --prefix client run build -- --base=${BASE}`);

// 2) Assemble the publish folder in a temp dir (keeps this repo/main untouched).
const pub = mkdtempSync(join(tmpdir(), 'camt-ghpages-'));
cpSync('client/dist', pub, { recursive: true });
writeFileSync(join(pub, '.nojekyll'), ''); // serve files as-is (no Jekyll)

// 3) Fresh single-commit repo -> force-push to gh-pages.
console.log('▶ Publishing to gh-pages…');
const git = (cmd) => run(`git ${cmd}`, { cwd: pub });
git('init -b gh-pages -q');
git('add -A');
git('-c user.name=svoja -c user.email=switzersawet@gmail.com commit -q -m "Deploy static site"');
git(`remote add origin ${REMOTE}`);
git('push -f -q origin gh-pages');

rmSync(pub, { recursive: true, force: true });
console.log('\n✅ Deployed. Live at https://smzey.github.io/camt-grade-calculator/');
