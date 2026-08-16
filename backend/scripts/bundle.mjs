// Bundles every Lambda handler into a single self-contained CJS file per
// function (including @pitch/shared, an unpublished workspace package that
// `sam build`'s own npm install step can't resolve — see backend/Makefile).
// Run from the repo root or backend/, after `npm run build:shared`.
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const backendRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const functions = [
  { name: 'lobby', entry: 'src/functions/lobby/handler.ts' },
  { name: 'stats', entry: 'src/functions/stats/handler.ts' },
  { name: 'onConnect', entry: 'src/functions/connection/onConnect.ts' },
  { name: 'onDisconnect', entry: 'src/functions/connection/onDisconnect.ts' },
  { name: 'sync', entry: 'src/functions/connection/sync.ts' },
  { name: 'bid', entry: 'src/functions/gameplay/bid.ts' },
  { name: 'chooseTrump', entry: 'src/functions/gameplay/chooseTrump.ts' },
  { name: 'playCard', entry: 'src/functions/gameplay/playCard.ts' },
  { name: 'startNextRound', entry: 'src/functions/gameplay/startNextRound.ts' },
];

const outDir = path.join(backendRoot, 'dist-lambda');
mkdirSync(outDir, { recursive: true });

for (const fn of functions) {
  await build({
    entryPoints: [path.join(backendRoot, fn.entry)],
    outfile: path.join(outDir, `${fn.name}.js`),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    sourcemap: false,
    minify: false,
    logLevel: 'warning',
  });
}

console.log(`Bundled ${functions.length} Lambda functions into ${path.relative(process.cwd(), outDir)}/`);
