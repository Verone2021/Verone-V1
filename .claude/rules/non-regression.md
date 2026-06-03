# Démarche anti-régression — pratique senior obligatoire

**Source de vérité unique** pour toute correction ou ajout de fonctionnalité qui touche du code déjà en prod.

Cette règle existe parce qu'il est trivial pour un agent de "corriger" un bug et de casser silencieusement 3 autres call sites. Elle formalise la démarche d'un développeur senior expérimenté : auditer avant de toucher, tester avant et après, ne jamais bundle des fixes hétérogènes dans une même PR.

> Inspiré des pratiques Google (testing on the toilet), Meta (regression test discipline), Stripe (1 PR = 1 sujet), GitHub (audit-first), et de la pratique TDD outside-in.

---

## Règles d'or pour chaque correction

### 1. Audit pré-modification (read-only)

Avant **toute** modification d'un composant, hook ou fichier déjà en prod :

- `grep` exhaustif des call sites du symbole touché (export, fonction, hook)
- Lecture intégrale (`Read`) des fichiers consommateurs identifiés
- Identification des contrats publics : signature exportée, props, types Zod, retours
- Inventaire des tests existants couvrant le code touché (Playwright + unitaires)
- Si > 3 call sites impactés ET aucun test E2E existant → ajouter d'abord un test de couverture, puis corriger

### 2. Test de référence AVANT modification

Capture du comportement actuel — preuve photo + DOM lu programmatiquement :

- Script Playwright autonome dans `scripts/test-<feature>.mjs` (pattern existant : `scripts/test-invoice-vat-so178.mjs`)
- Screenshots stockés `.playwright-mcp/screenshots/YYYYMMDD/baseline-*.png`
- Valeurs DOM critiques lues via `page.evaluate(...)` et sauvegardées en JSON
- 0 erreur console attendue (vérifier explicitement)

### 3. Modification minimale

- **1 PR = 1 bug fixé**. Sauf bundling thématique cohérent (3 typos sur la même page, par exemple).
- Diff par défaut < 30 lignes. Si plus, justifier en description PR.
- Aucune refacto opportuniste. La règle "tant que j'y suis" est interdite.
- Type-check + lint locaux verts avant push (`pnpm --filter @verone/<app> type-check && pnpm --filter @verone/<app> lint`)
- Tests unitaires verts si présents (`npx tsx packages/.../__tests__/*.test.ts`)

### 4. Test post-modification

- **Test ciblé** : le cas qui était cassé est maintenant fixé. Replay du test de référence (étape 2) → succès.
- **Test de régression locale** : les call sites identifiés en étape 1 continuent à fonctionner. 2-3 cas voisins testés via Playwright.
- **Console errors** : 0 erreur nouvelle apparue.
- **CI verte** : tous les checks bloquants `ESLint + Type-Check + Build`, `DB FK drift`, `Supabase TS types drift`, `E2E Smoke (Playwright)`, `PR vers main vient de staging`.

### 5. Mémoire / documentation

- Si la correction met en évidence un pattern récurrent (ex: oubli d'invalider une query, mauvais hook de fetch, accent perdu en wizard) → ajouter une règle dédiée dans `.claude/rules/`
- Tout fichier marqué `@protected` touché → ADR dans `.claude/DECISIONS.md`
- Tout fichier `apps/back-office/src/app/api/qonto/*` ou trigger DB → arrêt avant modification, validation Romeo obligatoire

### 6. Auto-merge avec garde-fous

- Auto-merge activé seulement si :
  - Type-check + lint verts localement
  - Test Playwright local PASS sur le cas corrigé ET sur les cas voisins
  - Reviewer-agent PASS (si le sprint le justifie)
- Hot-patch (rollback rapide) prêt : ID de PR notée, commande de revert mémorisée.

---

## Cas où on N'APPLIQUE PAS la correction tout de suite

### Arrêt obligatoire — demande Roméo

1. L'audit pré-modification révèle un blocage RLS, trigger DB ou interdiction `.claude/rules/`
2. Le composant touché est marqué `@protected` dans son en-tête
3. Le composant fait partie des triggers stock (`stock-triggers-protected.md`)
4. La modification touche une route API Qonto (`/api/qonto/*` — `code-standards.md`)
5. La modification toucherait `sales_orders.tax_rate` ou la formule de TVA (cf. `finance.md` R8)
6. > 3 call sites impactés sans test E2E existant ET impossibilité d'écrire un test rapide

### Arrêt obligatoire — analyse plus profonde

- La cause racine n'est pas claire après l'audit pré-modification → investigation supplémentaire (DevTools réseau, logs Supabase, REPL local) **avant** toute écriture de code
- Le diff dépasse 100 lignes pour un "fix" → c'est un refactoring, doit être présenté comme tel

---

## Anti-patterns interdits

- ❌ Bundler 5 fixes hétérogènes dans une seule PR de 200 lignes
- ❌ Modifier un hook partagé sans grep des call sites
- ❌ Pousser une correction sans test de régression local sur 2-3 cas voisins
- ❌ Auto-merge sur un fix qui n'a jamais été testé manuellement ou via Playwright
- ❌ Suppression d'un test "qui flake" sans investiguer la cause
- ❌ Désactiver une règle ESLint / TS pour faire passer un type-check (cf. ADR-033, code-standards.md ANTI-RACCOURCIS)
- ❌ "Tant que j'y suis je refacto X" — chaque refacto a sa propre PR

---

## Workflow type pour 1 correction

```
1. Branche depuis staging à jour : fix/BO-AREA-NNN-description
2. Audit pré-modif (grep + Read) — 10 min
3. Test de référence Playwright (capture screenshot + DOM) — 5 min
4. Modification minimale (1 fichier ou 2 max) — 5-20 min
5. Type-check + lint locaux verts
6. Test post-modif Playwright sur 2-3 cas (corrigé + voisins) — 10 min
7. Commit, push, PR vers staging
8. Auto-merge --squash --delete-branch
9. Vérifier CI verte
10. Si régression détectée en staging : revert immédiat via gh pr revert
```

Temps total moyen : 30-60 min par correction simple, plus pour les corrections moyennes (B3, B4) ou complexes (B1).

---

## Application aux sous-agents

Cette règle s'applique à **tous les sous-agents** :

- `dev-agent` : applique la démarche complète, rapporte chaque étape dans son fichier dev-report
- `reviewer-agent` : refuse une PR qui n'a pas suivi la démarche (pas de test de référence, diff > 30 lignes sans justif, etc.)
- `perf-optimizer` : audit pré-modification renforcé sur les hooks utilisés en boucle

Le coordinateur (l'agent principal) **vérifie** que chaque sous-agent a bien suivi la démarche avant de promouvoir une PR ready.

---

## Référence

Référencé par :

- `CLAUDE.md` racine (table SOURCES DE VERITE)
- `.claude/INDEX.md`
- `.claude/rules/workflow.md` (complémentaire — 1 PR = 1 bloc cohérent)
- `.claude/rules/code-standards.md` (ANTI-RACCOURCIS — pas de bypass mécanique)

Sprint d'origine : `BO-NONREG-001` (2026-06-03), suite à l'audit sourcing/consultation qui a révélé 5 bugs + 7 points UX en prod.
