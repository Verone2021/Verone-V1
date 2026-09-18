#!/usr/bin/env node
/**
 * Compare les routes que Next.js compile avec celles que Vercel deploie reellement.
 *
 * Pourquoi ce script existe
 * -------------------------
 * Le 15 septembre 2026, la fiche produit `/produits/catalogue/detail/[id]` a
 * disparu de la production sans qu'aucun signal ne se leve : la compilation la
 * listait (`ƒ /produits/catalogue/detail/[id]  43.1 kB`), mais la sortie du
 * deploiement ne contenait aucune entree pour elle. Vercel repondait
 * `x-matched-path: /_not-found` sur les 218 produits, depuis tous les ecrans.
 *
 * Le meme bug avait frappe en avril (ADR .claude/DECISIONS.md) et en mai
 * (5 tentatives de correction en 15 h). A chaque fois il a ete valide sur
 * « la page repond 200 » — sans regarder QUELLE route repondait. Ni tsc, ni
 * ESLint, ni `next build`, ni les tests de fumee ne voient cette classe de
 * panne : le code est juste, la compilation est verte, c'est l'etape de sortie
 * qui perd la route.
 *
 * Ce script est le seul garde-fou qui aurait vu passer les trois episodes.
 *
 * Usage
 * -----
 *   node scripts/check-deployed-routes.mjs <url-de-deploiement>
 *   node scripts/check-deployed-routes.mjs --sha=<commit>   # attend puis verifie
 *   node scripts/check-deployed-routes.mjs                  # dernier deploiement
 *
 * Sort en 1 si une route compilee n'est pas deployee.
 *
 * Jeton : VERCEL_TOKEN, sinon le jeton de la CLI Vercel locale.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT = process.env.VERCEL_PROJECT ?? 'verone-back-office';
const API = 'https://api.vercel.com';

/** Routes que Vercel sert sans qu'elles aient d'entree de sortie propre. */
const NEVER_EMITTED = new Set(['/_app', '/_document', '/_error']);

function readCliToken() {
  const candidates = [
    join(homedir(), 'Library/Application Support/com.vercel.cli/auth.json'),
    join(homedir(), '.local/share/com.vercel.cli/auth.json'),
    join(homedir(), '.config/com.vercel.cli/auth.json'),
  ];
  for (const path of candidates) {
    try {
      const token = JSON.parse(readFileSync(path, 'utf8')).token;
      if (token) return token;
    } catch {
      // fichier absent ou illisible : on essaie le suivant
    }
  }
  return null;
}

const TOKEN = process.env.VERCEL_TOKEN ?? readCliToken();
if (!TOKEN) {
  console.error(
    'Aucun jeton Vercel. Definir VERCEL_TOKEN ou se connecter avec la CLI Vercel.'
  );
  process.exit(2);
}

async function api(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`${path} -> HTTP ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function listDeployments() {
  const list = await api(
    `/v6/deployments?app=${encodeURIComponent(PROJECT)}&limit=20`
  );
  return list.deployments ?? [];
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Deploiement a verifier : celui qui porte l'URL donnee, celui qui porte le
 * commit donne, sinon le dernier. Avec un commit, on attend qu'il soit construit
 * (la verification n'a de sens que sur une sortie terminee).
 */
async function resolveDeployment(target) {
  const sha = target?.startsWith('--sha=') ? target.slice(6) : null;
  const deadline = Date.now() + 25 * 60 * 1000;

  for (;;) {
    const deployments = await listDeployments();
    if (!deployments.length)
      throw new Error(`Aucun deploiement pour ${PROJECT}.`);

    if (!target) return deployments[0];

    if (sha) {
      const match = deployments.find(d =>
        (d.meta?.githubCommitSha ?? '').startsWith(sha)
      );
      if (match?.readyState === 'READY') return match;
      if (match && ['ERROR', 'CANCELED'].includes(match.readyState)) {
        throw new Error(
          `Deploiement ${match.uid} en etat ${match.readyState} : rien a verifier.`
        );
      }
      if (Date.now() > deadline) {
        throw new Error(
          `Aucun deploiement pret pour le commit ${sha} apres 25 min.`
        );
      }
      await sleep(30_000);
      continue;
    }

    const host = target.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const match = deployments.find(d => d.url === host);
    if (!match) throw new Error(`Deploiement introuvable pour ${host}.`);
    return match;
  }
}

/**
 * Routes de page listees par le tableau de fin de `next build`, extraites du
 * journal de compilation du deploiement. Les routes d'API sont ecartees : elles
 * sont deployees sous une autre forme.
 */
function compiledRoutes(deploymentUrl) {
  // `vercel inspect --logs` ecrit le journal de compilation sur stderr :
  // on fusionne les deux flux, sinon on ne lit rien.
  const log = execFileSync(
    'bash',
    ['-c', `vercel inspect "https://${deploymentUrl}" --logs 2>&1`],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  const rx = /[├└]\s+[ƒ○●◐]\s+(\/\S*)/g;
  const routes = new Set();
  for (const line of log.split('\n')) {
    let m;
    while ((m = rx.exec(line)) !== null) {
      const route = m[1];
      if (route.startsWith('/api/')) continue;
      if (NEVER_EMITTED.has(route)) continue;
      routes.add(route.replace(/^\//, ''));
    }
  }
  return routes;
}

/** Chemins reellement presents dans la sortie du deploiement. */
async function deployedRoutes(deploymentId) {
  const { builds = [] } = await api(`/v11/deployments/${deploymentId}/builds`);
  const paths = new Set();
  for (const build of builds) {
    for (const output of build.output ?? []) {
      const path = output.path ?? '';
      if (path && !path.endsWith('.rsc')) paths.add(path);
    }
  }
  return paths;
}

const target = process.argv[2];
const deployment = await resolveDeployment(target);
const compiled = compiledRoutes(deployment.url);
const deployed = await deployedRoutes(deployment.uid);

if (compiled.size === 0) {
  console.error(
    `Aucune route lue dans le journal de ${deployment.url}. Journal tronque, ` +
      'compilation issue du cache, ou format du tableau de routes modifie.'
  );
  process.exit(2);
}

const missing = [...compiled].filter(r => !deployed.has(r)).sort();

console.log(`Deploiement : ${deployment.url} (${deployment.uid})`);
console.log(`Routes de page compilees : ${compiled.size}`);
console.log(`Chemins deployes         : ${deployed.size}`);

if (missing.length === 0) {
  console.log('\nToutes les routes compilees sont servies.');
  process.exit(0);
}

console.error(`\nCOMPILEES MAIS ABSENTES DU DEPLOIEMENT (${missing.length}) :`);
for (const route of missing) console.error(`  /${route}`);
console.error(
  '\nCes routes repondront 404 avec x-matched-path: /_not-found. ' +
    'Le code est juste : c est la sortie du deploiement qui les perd.'
);
process.exit(1);
