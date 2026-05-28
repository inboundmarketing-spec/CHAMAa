import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');

const sharedDistPath = path.join(repoRoot, 'packages', 'shared', 'dist', 'atleticas.js');
const sourceDir = path.join(repoRoot, 'packages', 'aaa');
const destDir = path.join(repoRoot, 'apps', 'web', 'public', 'atleticas');

if (!fs.existsSync(sharedDistPath)) {
  throw new Error(`Arquivo não encontrado: ${sharedDistPath}`);
}
if (!fs.existsSync(sourceDir)) {
  throw new Error(`Pasta não encontrada: ${sourceDir}`);
}

fs.mkdirSync(destDir, { recursive: true });

// eslint-disable-next-line import/no-dynamic-require, global-require
const shared = await import(pathToFileUrl(sharedDistPath));

const { ATLETICA_LOGO_FILES, ATLETICA_SOURCE_FILES } = shared;

if (!ATLETICA_LOGO_FILES || !ATLETICA_SOURCE_FILES) {
  throw new Error(
    'Não consegui carregar ATLETICA_LOGO_FILES/ATLETICA_SOURCE_FILES de packages/shared/dist/atleticas.js',
  );
}

const entries = Object.keys(ATLETICA_LOGO_FILES).map((name) => ({
  name,
  from: ATLETICA_SOURCE_FILES[name],
  to: ATLETICA_LOGO_FILES[name],
}));

const missing = [];
const copied = [];

for (const { name, from, to } of entries) {
  const fromPath = path.join(sourceDir, from);
  const toPath = path.join(destDir, to);

  if (!from || !to) {
    missing.push({ name, reason: 'mapeamento vazio', from, to });
    continue;
  }

  if (!fs.existsSync(fromPath)) {
    missing.push({ name, reason: 'arquivo fonte ausente', from: fromPath, to: toPath });
    continue;
  }

  fs.copyFileSync(fromPath, toPath);
  copied.push({ name, from: fromPath, to: toPath });
}

// Obs: não removemos arquivos existentes aqui.
// Em alguns ambientes, encoding/normalização de nomes pode causar falsa divergência.
const allowed = new Set(Object.values(ATLETICA_LOGO_FILES));

console.log(`Destino: ${destDir}`);
console.log(`Copiados: ${copied.length}/${entries.length}`);
console.log(`Mapeados (allowed): ${allowed.size}`);
if (missing.length) {
  console.log('Faltando:');
  for (const m of missing) console.log(`- ${m.name}: ${m.reason}`);
  process.exitCode = 1;
}

function pathToFileUrl(p) {
  const url = new URL(`file://${p.replace(/\\/g, '/')}`);
  return url;
}

