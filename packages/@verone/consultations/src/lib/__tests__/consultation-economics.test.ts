/**
 * Point d'entrée principal — consultation-economics
 *
 * Ce fichier orchestre les suites de tests thématiques.
 * Chaque suite peut aussi s'exécuter de manière autonome :
 *
 *   npx tsx .../consultation-economics.nominal.test.ts
 *   npx tsx .../consultation-economics.free-sample.test.ts
 *   npx tsx .../consultation-economics.guards.test.ts
 *   npx tsx .../consultation-economics.pricing.test.ts
 *   npx tsx .../consultation-economics.amounts.test.ts
 *   npx tsx .../consultation-economics.supplier-costs.test.ts
 *
 * Exécution globale :
 *   npx tsx .../consultation-economics.test.ts
 *
 * Sprints BO-CONSULT-P2-001 — 2026-09-12 · BO-CONSULT-P9-001 — 2026-09-13
 * Total assertions : 41 (répartition dans les 6 fichiers thématiques)
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const suites = [
  'consultation-economics.nominal.test.ts',
  'consultation-economics.free-sample.test.ts',
  'consultation-economics.guards.test.ts',
  'consultation-economics.pricing.test.ts',
  'consultation-economics.amounts.test.ts',
  'consultation-economics.supplier-costs.test.ts',
] as const;

const failures: string[] = [];

for (const suite of suites) {
  const filePath = path.join(__dirname, suite);
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`SUITE : ${suite}`);
  console.log('═'.repeat(50));

  const result = spawnSync('npx', ['tsx', filePath], {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    failures.push(suite);
  }
}

console.log(`\n${'═'.repeat(50)}`);
if (failures.length === 0) {
  console.log(`TOTAL — toutes les suites passent (41 assertions au total) ✅`);
} else {
  console.log(
    `TOTAL — ${failures.length} suite(s) en échec : ${failures.join(', ')}`
  );
}
console.log('═'.repeat(50));

if (failures.length > 0) {
  process.exit(1);
}
